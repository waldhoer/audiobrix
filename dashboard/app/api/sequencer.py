from fastapi import APIRouter, Request

from app.core.helpers import Helpers
from app.service.sequencer import Sequencer
from app.core.events import Event

router = APIRouter()
config = Helpers.config

@router.get("/sequencer/start")
async def start_sequencer(request: Request):
    """
    Endpoint for starting the sequencer service.
    """
    if request.app.state.sequencer is None or request.app.state.sequencer.running == False:
        try:
            sequencer = Sequencer(request.app.state.dashboard, config["bpm_playing_speed"], config["instrument"])
            request.app.state.sequencer = sequencer
            request.app.state.osc.sequencer = sequencer # also the OSC Manager needs to be informed about the new sequencer for pattern broadcasting
        except Exception as e:
            Event.error.send("API_SeqStart",service="Sequencer",message=str(e))
    request.app.state.sequencer.start()

@router.get("/sequencer/stop")
async def stop_sequencer(request: Request):     
    """
    Endpoint for stopping the sequencer service.
    """  
    if request.app.state.sequencer is not None:
        request.app.state.sequencer.stop()
        request.app.state.sequencer = None
        request.app.state.osc.sequencer = None
    
@router.get("/sequencer/instrument")
async def change_instrument(request: Request, channel : int):       
    """
    Endpoint for changing the instrument of the sequencer.
    The channel should be a GM number (0-127).
    """
    sequencer = request.app.state.sequencer
    if sequencer:
        Helpers.write("instrument", channel)
        return sequencer.change_instrument(channel)
    
@router.get("/sequencer/speed")
async def change_speed(request: Request, bpm : int):       
    """
    Endpoint for changing the instrument speed.
    The bpm should be between 20 and 300.
    """
    sequencer = request.app.state.sequencer
    if sequencer:
        Helpers.write("bpm_playing_speed", bpm)
        return sequencer.change_speed(bpm)
    
@router.get("/sequencer/device")
async def change_device(request: Request):       
    """
    Endpoint for changing the midi device (usually 0 or 1).
    """
    sequencer = request.app.state.sequencer
    if sequencer:
        return sequencer.change_device()
    