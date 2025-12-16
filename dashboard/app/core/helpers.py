import logging
from pathlib import Path
import json, subprocess, sys
from pygame import midi


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
    def list_serial_ports() -> list[str]:
        """
        Lists all available COMs on Windows.
        Results can be used to identify which COM connection should be used for the arduino.
        """
        command = "Get-CimInstance Win32_SerialPort | Select-Object DeviceID, Name, Description"
        result = str(
            subprocess.check_output(["powershell", "-Command", command], text=True)
        )  # CMD wont work; PS required!

        if not result:
            return []

        lines = result.split("\n")
        return [x for x in lines[3:] if x.strip()]  # Remove seperators and labels

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
