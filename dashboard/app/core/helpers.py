import logging, re
from pathlib import Path
import json, subprocess, sys
from pygame import midi
import serial.tools.list_ports
from app.core.events import Event


def base_path() -> Path:
    """Return the base path depending on whether we're running from source or PyInstaller."""
    if getattr(sys, "frozen", False):
        # Running from PyInstaller
        return Path(sys.executable).parent
    else:
        # Running development / python directly
        return Path(__file__).resolve().parent.parent.parent


def resource_path(relative_path: str) -> Path:
    """Get absolute path to a resource inside or outside the bundle."""
    return base_path() / relative_path


class Helpers:

    @classmethod
    def write(cls, key: str, value):
        """
        Update a key in the config and save it to file.
        """
        cls.config[key] = value
        with open(cls.config_path, "w") as config_file:
            json.dump(cls.config, config_file, indent=4)

    @classmethod
    def writeAll(cls, new_config: dict):
        """
        Overwrite the entire config with a new one and save it to file.
        """
        cls.config = new_config
        with open(cls.config_path, "w") as config_file:
            json.dump(cls.config, config_file, indent=4)

    @staticmethod
    def list_serial_ports() -> list:
        """
        Lists all available COMs on Windows.
        Results can be used to identify which COM connection should be used for the arduino.
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
        midi.init()
        devices = []
        for i in range(midi.get_count()):
            info = midi.get_device_info(i)
            devices.append(
                str(i) + ": " + info[0].decode("utf-8") + "-" + info[1].decode("utf-8")
            )
        return devices

    @staticmethod
    def setup_logging():
        """
        Sets up basic logging (to file and console). To be called on startup once.
        """
        log_dir = base_path() / "logs"
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / "events.log"

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            handlers=[
                logging.FileHandler(log_file, encoding="utf-8"),
                logging.StreamHandler(),  # added for console output
            ],
        )

    descriptions = None

    path = Path(__file__).resolve()
    config_path = resource_path("settings.json")
    config_description_path = resource_path("settings_dscr.json")

    with open(config_path, "r", encoding="utf-8") as config_file:
        config = json.load(config_file)
    with open(config_description_path, "r", encoding="utf-8") as description_file:
        descriptions = json.load(description_file)
