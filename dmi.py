import time
import serial, json, threading
from termcolor import colored
from Helpers import *

class DMI:
    """
    Digital Music Instrument class. Handles arduino communication, note receiving and message-to-dashboard sending.
    """

    def __init__(self):
        self.config = Helpers.config
        self.active = True

        try:
            self.arduino = serial.Serial(
                port=self.config["arduino_port"],
                baudrate=self.config["arduino_baudrate"],
                timeout=.1
            )

        except serial.SerialException as e:
            print(colored(
                f"Connection to Arduino failed: {e}. "
                "If the Arduino is connected, try another port in settings.json (arduino_port).",
                "red"
            ))

    def capture(self) -> None:
        """
        Reads pressed button JSON data from Arduino in a loop.
        The received messages are lists of dicts formatted like [{"Expander":(e.g. 0x22), "Column":(A or B), "Pin":(e.g. 3))}]
        """
        while self.active:
            try:
                raw = self.arduino.readline()

                tolerance = 5
                for i in range(tolerance):
                    try:
                        print(raw)
                        raw = raw.decode('utf-8').strip()
                        break
                    except UnicodeDecodeError as d:
                        print(colored(f"Error while Decoding: {d}. Retry ({i}/{tolerance})", "red"))
                        raw = self.arduino.readline() # Read next line for next iteration
                    
            except serial.SerialException as e:
                print(colored(f"Lost connection to Arduino: {e}", "red"))
                break

            if not raw or raw ==  "": 
                continue # skip broken messages

            pressed = json.loads(raw) 
            print(colored(f"Received from Arduino: {pressed}", "blue"))

    def run(self) -> None:
        """
        Runs the DMI thread until it is terminated using the stop() method.
        """
        threading.Thread(target=self.capture, daemon=True).start()
        
        try:
            while self.active:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def stop(self) -> None:
        """
        Terminates the DMI thread greacefully.
        """
        self.active = False
