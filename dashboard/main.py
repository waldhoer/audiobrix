import asyncio, pygame
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from pythonosc import udp_client
from app.core.helpers import Helpers
from app.service.osc_manager import OscManager
from app.service.web_socket_manager import WebSocketManager
from app.api import html as htmlApi, dmi as dmiApi, sequencer as sequencerApi, config as configApi

BASE_DIR = Path(__file__).resolve().parent
config = Helpers.config

ws_manager = WebSocketManager()
dashboard = udp_client.SimpleUDPClient(config["visualizer_address"], config["visualizer_port"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    app.state.loop = loop
    app.state.dmi = None
    app.state.sequencer = None
    app.state.dashboard = dashboard

    app.state.osc = OscManager(
        config["visualizer_address"],
        config["visualizer_port"],
        app.state.sequencer,
        ws_manager,
        loop=loop
    )
    app.state.osc.start()
    yield
    pygame.midi.quit()

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
    uvicorn.run("main:app", host=config["visualizer_address"], port=config["dashboard_port"], reload=True)
