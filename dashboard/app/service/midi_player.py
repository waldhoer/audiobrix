import pygame.midi
import time
from app.core.helpers import Helpers
from app.core.events import Event


class MidiPlayer:
    """
    Basic MIDI player for playing notes.
    """

    def __init__(self, instrument_nr=1):
        instrument_nr = (
            instrument_nr if (instrument_nr >= 0 and instrument_nr <= 127) else 0
        )

        try:
            pygame.midi.init()
            self.player = pygame.midi.Output(int(Helpers.config["midi_device_id"]))
            self.player.set_instrument(instrument_nr)
        except Exception as e:
            self.player = None
            if "midi Output not open" in str(e):
                raise RuntimeError(
                    "Der MIDI Ausgang konnte nicht aktiviert werden. Stelle sicher, dass ein Audiogerät verbunden ist: "
                    + str(e)
                )
            else:
                raise e

    def play_note(self, notes: list, duration=0.3, velocity=127):
        """
        Plays a list of MIDI notes at once.
        @param notes: list of notes to play
        @param duration: how long the note should be played
        @param velocity: key intensity
        """
        for note in notes:
            self.player.note_on(note, velocity)

        time.sleep(duration)

        for note in notes:
            self.player.note_off(note, velocity)

    def close(self):
        """
        Terminates the midi player gracefully
        """
        self.player.close()
        pygame.midi.quit()


def update_output_device(self, new_device_id=None):
    """
    Reinitializes the MIDI output device of the midi player.
    @param new_device_id: If None, the ID from settings is used.
    """
    try:
        if hasattr(self, "player") and self.player:
            self.player.close()

        pygame.midi.quit()
        pygame.midi.init()

        if new_device_id is None:
            new_device_id = int(Helpers.config["midi_device_id"])

        self.player = pygame.midi.Output(new_device_id)
        self.player.set_instrument(self.instrument_nr)

        print(f"MIDI output updated to device ID {new_device_id}")

    except Exception as e:
        self.player = None
        Event.error.send(self, service=Event.DMI, message=str(e))
        return

    Event.device_change.send(
        self, service=Event.DMI, message=f"Changed speed to {new_device_id}"
    )
