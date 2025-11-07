from app.core.events import Event
from app.service.web_socket_manager import WebSocketManager
from app.core.helpers import Helpers
import asyncio

class EventBridge:
    """
    Connects Blinker signals to WebSocket broadcasts.
    Automatically sends the internal signals to the websocket manager.
    This can be then used directly in frontend. 
    """
    def __init__(self, ws_manager: WebSocketManager, loop):
        self.ws_manager = ws_manager
        self.loop = loop
        self.connect_signals()
        print("[EventBridge] Connected signals to WebSocketManager.")

    def connect_signals(self):
        """
        Connects the Signal from the Event singleton class automatically
        """
        for name, sig in Event.__dict__.items():
            if hasattr(sig, "connect") and not sig.has_receivers_for(self.make_handler(sig)): # filter signals which have not been connected yet
                sig.connect(self.make_handler(sig), weak=False)
                
                if (Helpers.config["verbose"]):
                    print(f"[EventBridge] Connected signal: {sig.name}")

    def make_handler(self, signal):
        async def broadcast_async(message):
            await self.ws_manager.broadcast(message)

        def handle_event(sender, **kwargs):
            """
            Sends the signal to the websocket clients.
            The loop timing is a little bit tricky, for future me: Do not simplify this :)
            """
            event_name = signal.name
            print(f"[Signal] {event_name} | data={kwargs}") # print in terminal
            message = {"event": event_name, "body": kwargs}

            try:
                loop = self.loop or asyncio.get_event_loop()

                if loop.is_running():
                    if loop == asyncio.get_running_loop():
                        asyncio.create_task(self.ws_manager.broadcast(message)) # normal case
                    else:
                        asyncio.run_coroutine_threadsafe(self.ws_manager.broadcast(message), loop) # for other thread
                else:
                    loop.run_until_complete(self.ws_manager.broadcast(message)) # rather rare case, added for robustness 
            except RuntimeError:
                asyncio.run(broadcast_async(message))

        return handle_event