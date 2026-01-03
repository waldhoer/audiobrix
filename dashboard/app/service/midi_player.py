import time
import mido
from mido import Message
from app.core.helpers import Helpers
from app.core.events import Event

mido.set_backend("mido.backends.rtmidi")


class MidiPlayer:
    """
    Robust MIDI player for playing notes using mido + python-rtmidi.
    """

    def __init__(self, instrument_nr=1):
        self.instrument_nr = instrument_nr if 0 <= instrument_nr <= 127 else 0
        self.port_name = None
        self.player = None

        try:
            self.update_output_device()  # default initializer
            self.set_instrument(self.instrument_nr)

        except Exception as e:
            self.player = None
            raise RuntimeError(
                "MIDI Player Initialisation failed. Are audio devices available?"
            ) from e

    def play_note(self, notes: list, duration=0.3, velocity=127):
        """
        Plays a list of MIDI notes at once.
        """
        if not self.player:
            raise RuntimeError(
                "Midi Player not initialized. Possibly missing output port."
            )

        for note in notes:
            self.player.send(Message("note_on", note=note, velocity=velocity))

        time.sleep(duration)

        for note in notes:
            self.player.send(Message("note_off", note=note, velocity=velocity))

    def set_instrument(self, instrument_nr: int):
        """
        Updates the MIDI players instrument.

        :param instrument_nr: The new instrument ID
        :type instrument_nr: int
        """
        self.instrument_nr = instrument_nr
        self.player.send(Message("program_change", program=instrument_nr))

    def update_output_device(self, new_device_id=None):
        """
        Reinitializes the MIDI output device of the midi player.

        :param new_device_id: If None, the ID from settings is used.
        """

        if new_device_id is None:
            self.port_name = Helpers.config.get("midi_device_name")
            if not self.port_name:
                available_ports = mido.get_output_names()
                if not available_ports:
                    raise RuntimeError("No compatible Midi ports found!")
                self.port_name = available_ports[0]
        else:
            available_ports = mido.get_output_names()
            new_device_id = int(new_device_id)
            if new_device_id < 0 or new_device_id >= len(available_ports):
                raise ValueError(f"Invalid MIDI Device ID '{new_device_id}'")
            self.port_name = available_ports[new_device_id]

        self.player = mido.open_output(self.port_name)
