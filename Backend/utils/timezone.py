from datetime import datetime, timedelta, timezone

# Indian Standard Time is UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

def get_current_time():
    """Get current time in Indian Standard Time (IST)"""
    return datetime.now(IST)

def get_current_time_iso():
    """Get current time in IST as ISO format string"""
    return get_current_time().isoformat()

