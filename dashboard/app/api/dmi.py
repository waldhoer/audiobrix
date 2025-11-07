import threading
from fastapi import APIRouter, Request

from app.service.DMI import DMI
from app.core.helpers import Helpers
from app.core.events import Event

router = APIRouter()

@router.get("/start")
async def start(request: Request):
    """
    Endpoint for starting the brick recognition service.
    """
    if request.app.state.dmi == None:
        request.app.state.dmi = DMI()

    if request.app.state.dmi.status != Helpers.Status.ACTIVE:
        try:
            if(request.app.state.dmi.initialize()):
                threading.Thread(target=request.app.state.dmi.run, daemon=True).start()
        except Exception as e:
            Event.error.send("API_Start",service="DMI",message=str(e))
    Event.warning.send("API_Start",service="DMI",message="The DMI is already active.")

@router.get("/stop")
async def stop(request: Request):
    """
    Endpoint for stopping the brick recognition service.
    """
    if request.app.state.dmi is not None:
        request.app.state.dmi.stop()
        request.app.state.dmi = None

@router.post("/skipped")
async def skip(request: Request):
    """
    Endpoint for updating skipped notes.
    """
    data = await request.json()
    if "skip" not in data:
        Event.warning.send("API_Skip",service="DMI",message="Missing skip parameter.")
    
    Helpers.write("skip",data["skip"])
