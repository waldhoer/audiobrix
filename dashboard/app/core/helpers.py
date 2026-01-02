import logging, re
from pathlib import Path
import json, sys
import time, mido
from mido import Message
import serial.tools.list_ports
from app.core.events import Event


def base_path() -> Path:
    """Returns the base path depending on whether we're running from source or PyInstaller."""
    if getattr(sys, "frozen", False):
        # Running from PyInstaller
        return Path(sys.executable).parent
    else:
        # Running development / python directly
        return Path(__file__).resolve().parent.parent.parent


def resource_path(relative_path: str) -> Path:
    """Gets absolute path to a resource inside or outside the bundle."""
    return base_path() / relative_path


class Helpers:

    descriptions = {}
    config = {}

    config_path = resource_path("settings.json")
    config_description_path = resource_path("settings_dscr.json")

    @classmethod
    def write(cls, key: str, value):
        """
        Update a key in the config and save it to file.

        :param cls: Class Variable
        :param key: The new settings key
        :param value: The new settings value
        """
        if not key or len(key) == 0:
            raise AttributeError(
                f"Invalid or empty parameters provided for single settings write: '{key}' with '{value}'"
            )

        cls.config[key] = value
        with open(cls.config_path, "w") as config_file:
            json.dump(cls.config, config_file, indent=4)

    @classmethod
    def writeAll(cls, new_config: dict):
        """
        Overwrite the entire config with a new one and save it to file.

        :param cls: Class Variable
        :param new_config: The new settings dictionary with all settings fields
        """
        if len(new_config) == 0:
            raise AttributeError("Empty dict provided for settings write")

        cls.config = new_config
        with open(cls.config_path, "w") as config_file:
            json.dump(cls.config, config_file, indent=4)

    @staticmethod
    def test_arduino_connection(port: str) -> bool:
        """
        Tests if an Arduino is reachable on the given port and the communication is working.
        This immitates the DMI JSON communication with the arduino and is rather strict!

        :param port: The port string (e.g. "COM3")
        :return: True if the connection was successful, false otherwise
        """
        decode_tolerance = 5
        Event.info.send(
            "Comtest_Connection_Test", service="systest", message="Probing " + port
        )
        try:
            with serial.Serial(
                port, Helpers.config["arduino_baudrate"], timeout=0.1
            ) as ser:
                time.sleep(0.2)

                for decode_attempt in range(3):
                    raw = ser.readline()
                    if not raw:
                        continue

                    # Avoids decode error crashes
                    for decode_attempt in range(decode_tolerance):
                        try:
                            decoded = raw.decode("utf-8").strip()
                            break
                        except UnicodeDecodeError:
                            raw = ser.readline()  # retry on decode failure
                    else:
                        continue

                    if not decoded:
                        continue

                    # Test for real data
                    try:
                        json.loads(decoded)
                        return True
                    except json.JSONDecodeError:
                        continue

        except serial.SerialException:
            return False

        return False

    @staticmethod
    def test_midi_port(device_id: int | str) -> bool:
        """
        Tests if the midi port can actually be opened and played.
        """
        try:
            if isinstance(device_id, int):
                ports = mido.get_output_names()
                if device_id < 0 or device_id >= len(ports):
                    return False
                port_name = ports[device_id]
            else:
                port_name = str(device_id)

            # Try to open, send a short test note, then close
            with mido.open_output(port_name) as port:
                port.send(Message("note_on", note=60, velocity=64))
                port.send(Message("note_off", note=60, velocity=64))

            Event.info.send(
                "Miditest_Connection_Test",
                service="systest",
                message="Probing " + port_name,
            )
            return True

        except Exception as e:
            Event.error.send(
                "Miditest_Connection_Test",
                service="systest",
                message=f"Port '{device_id}' failed: {e}",
            )
            return False

    @staticmethod
    def list_serial_ports() -> list:
        """
        Lists all available COMs on Windows.
        Results can be used to identify which COM connection should be used for the arduino.

        :return: List of available COM ports with details.
        """
        ports = list(serial.tools.list_ports.comports())
        result = []
        for p in ports:
            candidate = False

            try:
                # Checks for VID  if they are set (often null)
                if p.vid == 0x2341:
                    candidate = True

                # Checks for VID in HWID string (can create false positives!)
                if p.hwid and "2341" in p.hwid:
                    candidate = True

                # Checks for VID / PID if windows embeds it in a string
                match = re.search(r"VID&([0-9A-Fa-f]+)_PID&([0-9A-Fa-f]+)", p.hwid)
                if match:
                    if int(match.group(1), 16) == 0x2341:
                        candidate = True

                result.append(
                    {
                        "device": p.device,
                        "name": p.device,
                        "description": p.description,
                        "hwid": p.hwid,
                        "vid": p.vid,
                        "pid": p.pid,
                        "serial_number": p.serial_number,
                        "location": p.location,
                        "manufacturer": p.manufacturer,
                        "product": p.product,
                        "interface": p.interface,
                        "candidate": candidate,
                        "runnable": Helpers.test_arduino_connection(p.device),
                    }
                )
            except Exception as e:
                Event.error.send("Comtest_Failed", service="systest", message=str(e))

        return result

    @staticmethod
    def list_midi_devices() -> list[str]:
        """
        Lists all available midi devices and their ID.
        Results can be used to identify which MIDI device to use for the MIDI audio player.
        This is specifically important on Laptops (often) without default MIDI devices.
        """
        devices = []
        output_names = mido.get_output_names()
        for i, name in enumerate(output_names):
            devices.append(
                {
                    "index": i,
                    "name": name,
                    "candidate": Helpers.test_midi_port(i),
                }
            )
        return devices

    @staticmethod
    def setup_logging() -> None:
        """
        Sets up the logging (to file and console). To be called on startup once.
        Events are captured and later broadcasted to the frontend.
        Other logs from the FastAPI are logged in file, but not broadcasted.
        """
        log_dir = base_path() / "logs"
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / "events.log"

        formatter = logging.Formatter("%(asctime)s [%(levelname)s] : %(message)s")

        # General logger defaults:
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.INFO)

        # Console logger handler (Capture console logs):
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.INFO)

        # Root logger (Events and Application logs):
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)

        if not root_logger.handlers:
            root_logger.addHandler(file_handler)
            root_logger.addHandler(console_handler)

        # Attach FastAPI loggers:
        fastapi_loggers = ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi")
        for logger_name in fastapi_loggers:
            logger = logging.getLogger(logger_name)
            logger.setLevel(logging.INFO)
            logger.propagate = False  # avoid double logging

            if not logger.handlers:
                logger.addHandler(file_handler)
                logger.addHandler(console_handler)

    @classmethod
    def load_settings(cls) -> None:
        """
        Loads the settings and checks if they are empty or rather complete.

        :param cls: Class variable
        """

        # Check if descriptions are empty
        with open(
            cls.config_description_path, "r", encoding="utf-8"
        ) as description_file:
            descriptions = json.load(description_file)
            if len(descriptions) == 0:
                msg = KeyError(f"Settings Descriptions are empty. Exiting.")
                Event.error.send("Helpers", service="Helpers Config", msg=str(msg))
                raise msg
            cls.descriptions = descriptions

        # Check if settings are empty and each description has a setting variable
        with open(cls.config_path, "r", encoding="utf-8") as config_file:
            config = json.load(config_file)

            if len(config) == 0:
                msg = KeyError(f"Settings are empty. Exiting.")
                Event.error.send("Helpers", service="Helpers Config", msg=str(msg))
                raise msg

            for key in config.keys():
                if not key in cls.descriptions:
                    msg = KeyError(
                        f"Expected setting variable {key} not found. Exiting."
                    )
                    Event.error.send("Helpers", service="Helpers Config", msg=str(msg))
                    raise msg

            cls.config = config
