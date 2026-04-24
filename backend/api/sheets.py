import gspread
from google.oauth2.service_account import Credentials
from django.conf import settings
from functools import lru_cache
import threading
import time

_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 300  # 5 minutes


def _get_client():
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    creds = Credentials.from_service_account_file(str(settings.GOOGLE_SHEETS_CREDENTIALS), scopes=scopes)
    return gspread.authorize(creds)


def _fetch_sheet(sheet_name):
    gc = _get_client()
    sh = gc.open_by_key(settings.GOOGLE_SHEET_ID)
    ws = sh.worksheet(sheet_name)
    return ws.get_all_values()


def get_sheet_data(sheet_name):
    now = time.time()
    with _cache_lock:
        if sheet_name in _cache:
            data, ts = _cache[sheet_name]
            if now - ts < CACHE_TTL:
                return data
    data = _fetch_sheet(sheet_name)
    with _cache_lock:
        _cache[sheet_name] = (data, now)
    return data


def sheet_to_dicts(sheet_name):
    rows = get_sheet_data(sheet_name)
    if not rows:
        return []
    headers = [h.replace('\n', ' ').strip() for h in rows[0]]
    return [dict(zip(headers, row)) for row in rows[1:] if any(cell.strip() for cell in row)]
