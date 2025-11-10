import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from pythonosc import udp_client
from app.core.helpers import Helpers
from app.service.osc_manager import OscManager
from app.service.web_socket_manager import WebSocketManager
from app.api import (
    html as htmlApi,
    dmi as dmiApi,
    sequencer as sequencerApi,
    config as configApi,
)
from pygame import midi
from app.core.event_bridge import EventBridge
from app.service.DMI import DMI

BASE_DIR = Path(__file__).resolve().parent
config = Helpers.config

ws_manager = WebSocketManager()
event_bridge = EventBridge(ws_manager)
dashboard = udp_client.SimpleUDPClient(
    config["osc_own_address"], config["osc_own_port"]
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    event_bridge.set_loop(loop)
    app.state.loop = loop
    app.state.dmi = DMI()
    app.state.sequencer = None
    app.state.dashboard = dashboard

    app.state.osc = OscManager(
        config["osc_own_address"],
        config["osc_own_port"],
        config["osc_remote_address"],
        config["osc_remote_port"],
        app.state,
        ws_manager,
        loop=loop,
    )
    app.state.osc.start()
    yield
    midi.quit()


app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
routers = [htmlApi.router, dmiApi.router, sequencerApi.router, configApi.router]
for router in routers:
    app.include_router(router)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except:
        ws_manager.disconnect(ws)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app", host="127.0.0.1", port=config["dashboard_port"], reload=True
    )
