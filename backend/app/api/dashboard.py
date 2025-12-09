"""Admin dashboard routes - PROTECTED."""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select, func
from app.models import User, Alert
from app.db.session import get_session
from app.auth import get_current_active_admin
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
import os
from app.services.monitor import Monitor


router = APIRouter(tags=["Dashboard"])
templates = Jinja2Templates(directory="app/templates")

LOG_FILE = Path("logs/fastapi.log")
LOG_TAIL_MAX_LINES = 500


# Dependency for monitor access
def get_monitor(request: Request) -> Monitor:
    """Dependency to get monitor instance."""
    if not hasattr(request.app.state, 'monitor'):
        raise HTTPException(
            status_code=503,
            detail="Monitor service not initialized"
        )
    return request.app.state.monitor


# status check
async def check_overall_status(session: Session) -> Dict[str, Any]:
    """Check overall system status (database connectivity)."""
    try:
        result = session.exec(select(func.count()).select_from(User)).first()
        return {
            "status": "healthy",
            "message": "System operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"System error: {str(e)}"
        }


# alert
def get_alerts(session: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """Get unresolved alerts from database."""
    statement = select(Alert).where(
        Alert.resolved == False
    ).order_by(Alert.created_at.desc()).limit(limit)
    
    db_alerts = session.exec(statement).all()
    
    alerts = []
    for alert in db_alerts:
        alerts.append({
            "id": alert.id,
            "severity": alert.severity,
            "source": alert.source or "system",
            "message": alert.message,
            "timestamp": alert.created_at.isoformat()
        })
    
    return alerts


# logs
def tail_file_lines(path: Path, n: int = 100) -> List[str]:
    """Simple tail implementation for last n lines."""
    if not path.exists():
        return []
    
    with open(path, "rb") as f:
        f.seek(0, os.SEEK_END)
        pos = f.tell()
        block_size = 1024
        data = bytearray()
        lines = []
        
        while pos > 0 and len(lines) <= n:
            read_size = block_size if pos - block_size > 0 else pos
            pos -= read_size
            f.seek(pos)
            buf = f.read(read_size)
            data = buf + data
            lines = data.splitlines()
            if pos == 0:
                break
        
        decoded = [line.decode(errors="ignore") for line in lines[-n:]]
        return decoded


def read_recent_logs(lines: int = 50) -> List[Dict[str, str]]:
    """Read and parse recent log entries."""
    raw_lines = tail_file_lines(LOG_FILE, n=lines)
    
    logs = []
    for line in reversed(raw_lines):
        line = line.strip()
        if not line:
            continue
        
        parts = line.split('|', 2)
        if len(parts) >= 3:
            logs.append({
                "timestamp": parts[0].strip(),
                "level": parts[1].strip(),
                "message": parts[2].strip()
            })
        else:
            logs.append({
                "timestamp": "",
                "level": "INFO",
                "message": line
            })
    
    return logs


# routes
@router.get("/", response_class=HTMLResponse)
async def dashboard_home(
    request: Request,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
):
    """Main dashboard page - ADMIN ONLY."""
    system_status = await check_overall_status(session)
    
    context = {
        "request": request,
        "status": system_status,
        "alerts": get_alerts(session),
        "logs": read_recent_logs(50),
        "timestamp": datetime.now().isoformat(),
        "admin_name": current_admin.name,
        "admin_email": current_admin.email
    }
    
    return templates.TemplateResponse("dashboard.html", context)


@router.get("/api/status")
async def api_status_check(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
):
    """JSON status check - ADMIN ONLY."""
    system_status = await check_overall_status(session)
    
    return {
        "status": system_status["status"],
        "message": system_status["message"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# monitor health check
@router.get("/api/monitor/status")
async def monitor_health(
    monitor: Monitor = Depends(get_monitor),
    current_admin: User = Depends(get_current_active_admin)
):
    """Get monitor health statistics - ADMIN ONLY."""
    stats = monitor.get_stats()
    
    return {
        "monitor": stats,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/logs")
async def get_logs(
    lines: int = 50,
    level: Optional[str] = None,
    current_admin: User = Depends(get_current_active_admin)
):
    """Get recent logs with optional filtering - ADMIN ONLY."""
    lines = min(lines, LOG_TAIL_MAX_LINES)
    logs = read_recent_logs(lines)
    
    if level:
        logs = [log for log in logs if log["level"].lower() == level.lower()]
    
    return {"count": len(logs), "logs": logs}


@router.get("/api/alerts")
async def list_alerts(
    session: Session = Depends(get_session),
    limit: int = 50,
    current_admin: User = Depends(get_current_active_admin)
):
    """List unresolved alerts - ADMIN ONLY."""
    alerts = get_alerts(session, limit)
    
    return {
        "count": len(alerts),
        "critical_count": sum(1 for a in alerts if a["severity"] == "critical"),
        "alerts": alerts
    }


@router.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_active_admin)
):
    """Resolve an alert - ADMIN ONLY."""
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.resolved = True
    alert.resolved_at = datetime.now()
    session.add(alert)
    session.commit()
    session.refresh(alert)
    
    return {"message": "Alert resolved", "alert_id": alert_id}
