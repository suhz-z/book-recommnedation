# app/services/monitor.py
import asyncio
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models import Alert
import os
import re
from pathlib import Path
import aiofiles


LOG_FILE = Path(os.getenv("FASTAPI_LOG_FILE", "logs/fastapi.log"))
ERROR_PATTERN = re.compile(r"\bERROR\b|\bCRITICAL\b|\bException\b", re.I)
CHECK_INTERVAL_SECONDS = int(os.getenv("DASHBOARD_MONITOR_INTERVAL", "60"))
ERROR_THRESHOLD = int(os.getenv("ERROR_THRESHOLD_5MIN", "50"))


async def tail_file_lines_async(path: Path, n: int = 100) -> list[str]:
    """Async tail implementation for last n lines."""
    if not path.exists():
        return []
    
    try:
        async with aiofiles.open(path, "rb") as f:
            await f.seek(0, os.SEEK_END)
            pos = await f.tell()
            block_size = 1024
            data = bytearray()
            lines = []
            
            while pos > 0 and len(lines) <= n:
                read_size = block_size if pos - block_size > 0 else pos
                pos -= read_size
                await f.seek(pos)
                buf = await f.read(read_size)
                data = buf + data
                lines = data.splitlines()
                if pos == 0:
                    break
            
            decoded = [line.decode(errors="ignore") for line in lines[-n:]]
            return decoded
    except Exception:
        return []


class Monitor:
    """Lightweight background monitor for critical errors only."""
    
    def __init__(self, app):
        self._task = None
        self.app = app
        self.running = False
        self._last_check = None
        self._check_count = 0
        self._error_count = 0


    async def _count_recent_errors(self, minutes: int = 5) -> int:
        """Count ERROR/CRITICAL/Exception lines in last N minutes (async)."""
        if not LOG_FILE.exists():
            return 0
        
        count = 0
        now = datetime.now()
        cutoff = now - timedelta(minutes=minutes)
        
        try:
            # Non-blocking file read
            lines = await tail_file_lines_async(LOG_FILE, n=1000)
            
            for line in lines:
                if ERROR_PATTERN.search(line):
                    try:
                        # Parse timestamp: "YYYY-MM-DD HH:MM:SS,fff | LEVEL | message"
                        ts_str = line.split("|", 1)[0].strip()
                        # Handle both with and without milliseconds
                        for fmt in ["%Y-%m-%d %H:%M:%S,%f", "%Y-%m-%d %H:%M:%S"]:
                            try:
                                ts = datetime.strptime(ts_str, fmt)
                                break
                            except ValueError:
                                continue
                        else:
                            # If no format matches, count it anyway (recent logs)
                            count += 1
                            continue
                            
                        if ts >= cutoff:
                            count += 1
                    except (ValueError, IndexError):
                        # Can't parse timestamp, assume recent
                        count += 1
        except Exception:
            pass
        
        return count


    async def _check_and_alert(self, session: Session):
        """Check for critical issues and create alerts if needed."""
        
        try:
            errors_5m = await self._count_recent_errors(minutes=5)
            
            # Only alert if threshold exceeded
            if errors_5m >= ERROR_THRESHOLD:
                now = datetime.now()
                
                # Check for existing unresolved alerts from monitor in last 10 minutes
                existing = session.exec(
                    select(Alert)
                    .where(Alert.source == "monitor")
                    .where(Alert.resolved == False)
                    .where(Alert.created_at >= now - timedelta(minutes=10))
                ).first()
                
                # Create alert only if no recent similar alert exists
                if not existing:
                    severity = "critical" if errors_5m >= ERROR_THRESHOLD * 1.5 else "warning"
                    session.add(Alert(
                        severity=severity,
                        source="monitor",
                        message=f"High error rate detected: {errors_5m} errors in last 5 minutes"
                    ))
                    session.commit()
                    
        except Exception as e:
            self._error_count += 1
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
                
                self._last_check = datetime.now()
                self._check_count += 1
                
                await self._check_and_alert(session)
                
            except Exception:
                # Swallow errors to keep monitor running
                self._error_count += 1
            finally:
                if session:
                    try:
                        session.close()
                    except Exception:
                        pass
            
            # Wait before next check
            await asyncio.sleep(CHECK_INTERVAL_SECONDS)


    def start(self):
        """Start the monitor task."""
        if not self._task or self._task.done():
            self._task = asyncio.create_task(self.run())
        return self._task


    def stop(self):
        """Stop the monitor task gracefully."""
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
    
    
    def get_stats(self) -> dict:
        """Get monitor health statistics."""
        return {
            "running": self.running,
            "last_check": self._last_check.isoformat() if self._last_check else None,
            "total_checks": self._check_count,
            "check_errors": self._error_count,
            "uptime_checks": self._check_count - self._error_count
        }
