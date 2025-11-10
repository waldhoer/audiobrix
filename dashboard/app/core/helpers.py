from pathlib import Path
import json, subprocess
from pygame import midi


class Helpers:
    descriptions = None

    path = Path(__file__).resolve()
    config_path = path.parent.parent.parent / "settings.json"
    config_description_path = path.parent.parent.parent / "settings_dscr.json"

    with open(config_path, "r", encoding="utf-8") as config_file:
        config = json.load(config_file)
    with open(config_description_path, "r", encoding="utf-8") as description_file:
        descriptions = json.load(description_file)

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
