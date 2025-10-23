from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """
    Serves the dashboard HTML page.
    """
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/dashboard", response_class=HTMLResponse)
async def read_dashboard(request: Request):
    """
    Serves the dashboard HTML page.
    """
    return templates.TemplateResponse("dashboard.html", {"request": request})

@router.get("/settings", response_class=HTMLResponse)
async def read_settings(request: Request):
    """
    Serves the settings HTML page.
    """
    return templates.TemplateResponse("settings.html", {"request": request})
