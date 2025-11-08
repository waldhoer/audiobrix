import asyncio
from collections import deque

class EventBridge:
    """
    Connects Blinker signals to WebSocket broadcasts.
    Automatically sends the internal signals to the websocket manager.
    This can be then used directly in frontend. 

    EventBridge must be a Singleton to avoid duplicate connection.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, ws_manager):
        if getattr(self, "_initialized", False):
            return
        self.ws_manager = ws_manager
        self.loop = None
        self.pending_events = deque()
        self._connected_signals = set()
        self.connect_signals()
        print("[EventBridge] EventBridge initialized")

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """
        Set the main loop and flush pending events
        """
        self.loop = loop
        while self.pending_events:
            message = self.pending_events.popleft()
            self._schedule_broadcast(message)

    def _schedule_broadcast(self, message: dict):
        """
        Schedules a broadcast of the given message to the websocket manager.
        If there is a problem in communication, it is likely hidden here. Have fun :')
        """
        if self.loop is None:
            self.pending_events.append(message)
            return

        try:
            try:
                running_loop = asyncio.get_running_loop()
                same_thread = running_loop == self.loop
            except RuntimeError:
                same_thread = False

            if same_thread:
                asyncio.create_task(self.ws_manager.broadcast(message))
            else:
                future = asyncio.run_coroutine_threadsafe(
                    self.ws_manager.broadcast(message), self.loop
                )
                future.add_done_callback(
                    lambda fut: print(f"[EventBridge] Broadcast error: {fut.exception()}") if fut.exception() else None
                )
        except Exception as e:
            print(f"[EventBridge] Unexpected error: {e}")

    def make_handler(self, signal):
        """
        Creates an event handler foir each signal"""
        def handle_event(sender, **kwargs):
            message = {"type": "event", "name": signal.name, "body": kwargs}
            print(f"[{signal.name}]: {kwargs}")
            self._schedule_broadcast(message)
        return handle_event

    def connect_signals(self):
        """
        Automatically connects all Event Signals to the WS manager
        """
        from app.core.events import Event
        from app.core.helpers import Helpers

        for name, sig in Event.__dict__.items():
            # filter signals which have not been connected yet
            if hasattr(sig, "connect") and sig not in self._connected_signals and not sig.has_receivers_for(self.make_handler(sig)): 
                sig.connect(self.make_handler(sig), weak=False)
                self._connected_signals.add(sig)
                if Helpers.config.get("verbose"):
                    print(f"[EventBridge] Connected signal: {sig.name}")
