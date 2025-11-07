import time
import serial, json, threading
from termcolor import colored
from pythonosc import udp_client
from app.core.helpers import Helpers
from app.core.exceptions import *
from app.core.events import Event

class DMI:
    """
    Digital Music Instrument class. Handles arduino communication, note receiving and message-to-dashboard sending.
    """

    def __init__(self):
        self.config = Helpers.config
        self.running = False

        self.rounding_base = 5
        self.notes = []
        self.lock = threading.Lock()

    def initialize(self) -> bool:
        """
        Initializes the serial connection - Must be called after the DMI __init__ due to timing reasons for blinker.
        @return: True if the initialization was successful, false otherwise
        """
        try:
            self.arduino = serial.Serial(
                port=self.config["arduino_port"],
                baudrate=self.config["arduino_baudrate"],
                timeout=.1
            )

            self.dashboard_client = udp_client.SimpleUDPClient(
                self.config["visualizer_address"],
                self.config["visualizer_port"]
            )

        except serial.SerialException as e:
            Event.error.send(self, service=Event.DMI, message=str(AudiobrixUsbError(e)))
            return False
        
        return True
    
    def base_round(self, value) -> int:
        """
        Rounds a given value to the nearest base.
        """
        adjustment = 1
        return round((value - adjustment) / self.rounding_base)

    def capture(self) -> None:
        """
        Reads pressed button JSON data from Arduino in a loop.
        The received messages are lists of dicts formatted like [{"Expander":(e.g. 0x22), "Column":(A or B), "Pin":(e.g. 3))}]
        """
        first = True
        while self.running == True:
            try:
                raw = self.arduino.readline()

                tolerance = 5
                for i in range(tolerance):
                    try:
                        raw = raw.decode('utf-8').strip()
                        break
                    except UnicodeDecodeError as d:
                        Event.warning.send(
                            self, 
                            service=Event.DMI, 
                            message=str(f"Error while Decoding: {d}. Retry ({i}/{tolerance})")
                        )
                        raw = self.arduino.readline() # Read next line for next iteration

                # We only really know if the DMI is active once it ran at leas once sucessfully
                if first:
                    first = False
                    Event.active.send(self, service=Event.DMI) 
            except serial.SerialException as e:
                self.running = False
                Event.disconnected.send(self, service=Event.DMI, message=str(AudiobrixUsbKilledError(e)))
                break

            except AttributeError as e:
                self.running = False
                Event.error.send(self, service=Event.DMI, message=str(AudiobrixUsbError(e)))
                break

            if not raw or raw ==  "": 
                continue # skip broken messages

            try:
                pressed = json.loads(raw) 
            except json.decoder.JSONDecodeError as e:
                if (Helpers.config["verbose"]):
                    Event.warning.send(
                        self, 
                        service=Event.DMI, 
                        message=str(f"Error while parsing JSON from Arduino: {e} - Raw data: {raw[0:50]}")
                    )
                continue # skip broken messages

            notes = []
            for i in range(self.config["note_amount"]):
                resistance = pressed[i]["Resistance"]
                brick_amount = self.base_round(resistance)
                if self.config["verbose"]:
                    print(colored(f"Received from Arduino: MIDI_{self.resistance_to_midi(brick_amount)} - {brick_amount} Bricks - {pressed[i]}", "blue"))
                
                if (brick_amount > 0):
                    notes.append([self.resistance_to_midi(brick_amount)])
                else:
                    notes.append([])

            with self.lock:
                self.notes = notes

            message = {"type" : "pattern", "data" : notes}
            self.dashboard_client.send_message("/dashboard",(json.dumps(message) + "\n").encode())
            

    def resistance_to_midi(self, bricks_amount: int) -> int:
        """
        Converts a brick amount to a MIDI note.
        @param bricks_amount: Amount of stacked bricks
        @return: MIDI note number
        """
        whole_tones = list([60, 62, 64, 65, 67, 69, 71, 72])

        if (bricks_amount >= len(whole_tones)):
            return whole_tones[len(whole_tones) - 1] 
    
        return whole_tones[bricks_amount-1]
    
    def run(self) -> None:
        """
        Runs the DMI thread until it is terminated using the stop() method.
        """
        self.running = True
        threading.Thread(target=self.capture, daemon=True).start()
        
        try:
            while self.running == True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

        self.running = False

    def stop(self) -> None:
        """
        Terminates the DMI thread greacefully.
        """
        self.running = False
        Event.inactive.send(self, service=Event.DMI)
