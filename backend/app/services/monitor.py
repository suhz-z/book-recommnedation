# app/services/monitor.py
import asyncio
from datetime import datetime, timedelta
from sqlmodel import Session
from app.models import Alert
import os
import re


LOG_FILE = os.getenv("FASTAPI_LOG_FILE", "logs/fastapi.log")
ERROR_PATTERN = re.compile(r"\bERROR\b|\bCRITICAL\b|\bException\b", re.I)
CHECK_INTERVAL_SECONDS = int(os.getenv("DASHBOARD_MONITOR_INTERVAL", "60"))
ERROR_THRESHOLD = int(os.getenv("ERROR_THRESHOLD_5MIN", "50"))


class Monitor:
    """Lightweight background monitor for critical errors only."""
    
    def __init__(self, app):
        self._task = None
        self.app = app
        self.running = False
        self._last_alert_time = None


    async def _count_recent_errors(self, minutes: int = 5) -> int:
        """Count ERROR/CRITICAL/Exception lines in last N minutes."""
        if not os.path.exists(LOG_FILE):
            return 0
        
        count = 0
        now = datetime.now()
        cutoff = now - timedelta(minutes=minutes)
        
        try:
            with open(LOG_FILE, "r", errors="ignore") as f:
                # Read last 1000 lines for performance
                lines = f.readlines()[-1000:]
                
            for line in lines:
                if ERROR_PATTERN.search(line):
                    try:
                        # Parse timestamp: "YYYY-MM-DD HH:MM:SS | LEVEL | message"
                        ts_str = line.split("|", 1)[0].strip()
                        ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
                        if ts >= cutoff:
                            count += 1
                    except (ValueError, IndexError):
                        # If timestamp parsing fails, count recent errors anyway
                        count += 1
        except Exception:
            pass
        
        return count


    async def _check_and_alert(self, session: Session):
        """Check for critical issues and create alerts."""
        
        # Check error rate in logs
        try:
            errors_5m = await self._count_recent_errors(minutes=5)
            
            # Only alert if threshold exceeded and not alerted recently
            if errors_5m >= ERROR_THRESHOLD:
                now = datetime.now()
                # Avoid duplicate alerts within 10 minutes
                if not self._last_alert_time or (now - self._last_alert_time) > timedelta(minutes=10):
                    session.add(Alert(
                        severity="critical" if errors_5m >= ERROR_THRESHOLD * 1.5 else "warning",
                        source="monitor",
                        message=f"High error rate detected: {errors_5m} errors in last 5 minutes"
                    ))
                    self._last_alert_time = now
        except Exception:
            # Silently continue if log reading fails
            pass
        
        # Persist alerts
        try:
            session.commit()
        except Exception:
            session.rollback()


    async def run(self):
        """Main monitoring loop."""
        self.running = True
        
        while self.running:
            session = None
            try:
                # Create new session for each check
                from app.db.session import SessionLocal
                session = SessionLocal()
                
                await self._check_and_alert(session)
                
            except Exception:
                # Swallow errors to keep monitor running
                pass
            finally:
                if session:
                    try:
                        session.close()
                    except Exception:
                        pass
            
            await asyncio.sleep(CHECK_INTERVAL_SECONDS)


    def start(self):
        """Start the monitor task."""
        if not self._task or self._task.done():
            self._task = asyncio.create_task(self.run())
        return self._task


    def stop(self):
        """Stop the monitor task."""
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
