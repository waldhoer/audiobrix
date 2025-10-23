from fastapi import WebSocket

class WebSocketManager:
    """
    Manager class for WebSocket handling.
    Responsible for dis/connecting and broadcasting 
    """
    def __init__(self):
        self.clients = set()

    async def connect(self, ws: WebSocket):
        """
        Connects to a websocket
        """
        await ws.accept()
        self.clients.add(ws)

    def disconnect(self, ws: WebSocket):
        """
        Disconnects from a websocket
        """
        self.clients.discard(ws)

    async def broadcast(self, message: dict):
        """
        Broadcasts a message to connected clients.
        """
        to_remove = set()
        for ws in self.clients:
            try:
                await ws.send_json(message)
            except:
                to_remove.add(ws)
        self.clients -= to_remove
