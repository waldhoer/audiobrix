from pythonosc import dispatcher, osc_server
from app.service.sequencer import Sequencer
import json, asyncio, threading
from app.service.web_socket_manager import WebSocketManager

class OscManager:
    """
    Manager class for OSC Processing and Sending.
    """
    def __init__(self, address, port, state, ws_manager: WebSocketManager, loop: asyncio.AbstractEventLoop):
        self.address = address
        self.port = port
        self.state = state
        self.ws_manager = ws_manager
        self.loop = loop
        self.pattern_cache = None

    def start(self) -> None:
        """
        Starts the OscManager in a new thread.
        """
        thread = threading.Thread(target=self.run, daemon=True)
        thread.start()

    def run(self) -> None:
        """
        Run by the OscManager thread, this method runs the osc server. 
        """
        disp = dispatcher.Dispatcher()
        disp.map("/dashboard", self.handler)

        server = osc_server.ThreadingOSCUDPServer((self.address, self.port), disp)
        print(f"Listening for OSC on {self.address}:{self.port}")
        server.serve_forever()

    def handler(self, address, *args) -> None:
        """
        Receives and processes the midi notes from the DMI as JSON.
        The processed message is broadcasted to the websocket manager.
        @param address: The OSC address
        @param args: Incoming message(s)
        """
        parsed = None

        if args and isinstance(args[0], (bytes, bytearray)):
            try:
                parsed = json.loads(args[0].decode("utf-8"))
            except Exception as e:
                print("Failed to parse OSC payload:", e)
                parsed = args[0].decode("utf-8", errors="ignore")
        else:
            parsed = args

        # Feed directly DMI data if it is running
        if (self.state.sequencer != None and parsed["type"] == "pattern"):
            self.pattern_cache = parsed["data"]
            self.state.sequencer.beats_pattern = parsed["data"]

        # Use cache if the DMI is not running
        elif (self.state.sequencer != None and parsed["type"] != "pattern"):
            self.state.sequencer.beats_pattern = self.pattern_cache

        message = {"address": address, "data": parsed}
        asyncio.run_coroutine_threadsafe(self.ws_manager.broadcast(message), self.loop)


