import threading
from fastapi import APIRouter, Request

from app.service.DMI import DMI
from app.core.helpers import Helpers

router = APIRouter()

@router.get("/start")
async def start(request: Request):
    """
    Endpoint for starting the brick recognition service.
    """
    if request.app.state.dmi.status != Helpers.Status.ACTIVE:
        try:
            if(request.app.state.dmi.initialize()):
                threading.Thread(target=request.app.state.dmi.run, daemon=True).start()
                return {"status": Helpers.Status.ACTIVE}
        except Exception as e:
            return {"status": Helpers.Status.ERROR, "message": str(e)}
    return {"status": Helpers.Status.ACTIVE}

@router.get("/stop")
async def stop(request: Request):
    """
    Endpoint for stopping the brick recognition service.
    """
    if request.app.state.dmi is not None:
        request.app.state.dmi.stop()
        request.app.state.dmi = None
    return {"status": Helpers.Status.INACTIVE}

@router.post("/skipped")
async def skip(request: Request):
    """
    Endpoint for updating skipped notes.
    """
    data = await request.json()
    if "skip" not in data:
        return {"status": Helpers.Status.ERROR, "message" : "Skip parameter missing"}
    
    Helpers.write("skip",data["skip"])
    return {"status": Helpers.Status.OK}
