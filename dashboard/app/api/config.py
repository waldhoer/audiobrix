from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.core.helpers import Helpers

router = APIRouter()

@router.get("/config")
async def read():
    """
    Endpoint for reading the current configuration file.
    """
    return Helpers.config

@router.get("/config_dscr")
async def read_descriptions():
    """
    Endpoint for reading the current configuration file descriptions.
    """
    return JSONResponse(content=Helpers.descriptions, media_type="application/json; charset=utf-8")


@router.put("/config")
async def write(request: Request):
    """
    Endpoint for writing all settings to file.
    """
    Helpers.writeAll(await request.json())

@router.get("/status")
async def status(request: Request, service: str):
    """
    Endpoint for checking if the DMI or Sequencer service is running.
    @param service: "dmi" or "seq"
    """
    if service == "dmi":
        service_obj = request.app.state.dmi
    elif service == "seq":
        service_obj = request.app.state.sequencer
    else:
        return {"status": Helpers.Status.INACTIVE}

    if not service_obj:
        return {"status": Helpers.Status.INACTIVE}

    return {"status": service_obj.status}

@router.get("/systest")
async def systest(request: Request):
    """
    Endpoint for checking the system test results
    """
    return {"COM" : Helpers.list_serial_ports(), "MIDI": Helpers.list_midi_devices()}