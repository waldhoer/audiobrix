from pygame.midi import MidiException
from app.service.midi_player import MidiPlayer
import time, json, threading
from pythonosc import udp_client
from app.core.events import Event
from app.core.helpers import Helpers

class Sequencer:
    """
    The Sequencer class is responsible for playing received beat patterns
    """

    def __init__(self, dashboard_client : udp_client.SimpleUDPClient, bpm : int, instrument : int):
        """
        Initializes a new Sequencer.
        @param dashboard_client: The dashboard client used to sent the current notes (for visualisation)
        @bpm: The beats per minute playing speed
        """
        self.beats_pattern = [[] for _ in range(8)]
        self.thread = None
        self.bpm = bpm
        self.dashboard_client = dashboard_client
        self.midi_player = None
        self.instrument = instrument
        self.running = False

    def start(self):
        """
        Plays the sequencer in a loop until it is terminated using the stop() method.
        """
        if not self.midi_player:
            try:
                self.midi_player = MidiPlayer(instrument_nr=self.instrument)
            except Exception as e:
                Event.error.send(self, service=Event.SEQ, message=str(e))
                return
            
        if self.running == False:
            self.running = True
            self.thread = threading.Thread(target=self.loop, daemon=True)
            self.thread.start()
            Event.active.send(self, service=Event.SEQ)
        else:
            Event.warning.send(self, service=Event.SEQ, message="Sequencer is already active.")
            Event.active.send(self, service=Event.SEQ)
    
    def stop(self) -> None:  
        """
        Stops the sequencer playing gracefully.
        """     
        if self.midi_player:
            self.midi_player.close()
            self.midi_player = None

        self.running = False
        Event.inactive.send(self, service=Event.SEQ)

    def change_instrument(self, instrument : int):
        """
        Changes the instrument of the sequencer while playing
        @param instrument: The GM number of the new instrument 
        """
        self.instrument = instrument
        if self.midi_player:
            self.midi_player.close()

            try:
                self.midi_player = MidiPlayer(instrument_nr=self.instrument)
            except Exception as e:
                Event.error.send(self, service=Event.SEQ, message=str(e))
                return
            
        Event.instrument_change.send(self, service=Event.SEQ, message=f"Changed to {instrument}")

    def loop(self) -> None:
        """
        Plays the beats_pattern in a loop, sending OSC messages to the dashboard for drawing notes.
        This loop is also responsible for playing the audio notes.
        """
        step = 0
        next_tick = time.perf_counter()
        while self.running == True:
            if not self.beats_pattern:
                self.beats_pattern = [[] for _ in range(Helpers.config["note_amount"])] # empty patterns for edge case (DMI never started)
            current_notes = self.beats_pattern[step]
            played_notes = [
                n for n in current_notes if "skip" in Helpers.config and [str(step), str(n)] not in Helpers.config["skip"]
            ]
            
            message = {
                "type" : "step",
                "step" : step,
                "data" : played_notes
            }
            self.dashboard_client.send_message("/dashboard", (json.dumps(message) + "\n").encode()) 

            if self.midi_player is not None:
                try:
                    self.midi_player.play_note(played_notes, duration=(60.0 / self.bpm)) # quarter note
                except (RuntimeError, MidiException):
                    pass # ignore midi errors on termination gracefully

            step = (step + 1) % Helpers.config["note_amount"]

            # To increase performance stability usage of the perf_counter is required. 
            next_tick += 60.0 / self.bpm # interval
            now = time.perf_counter()
            sleep_time = next_tick - now
            if sleep_time > 0:
                time.sleep(sleep_time)
    
    def change_speed(self, bpm: int):
        """
        Changes the playing speed of the sequencer.
        @param bpm: The new beats per minute speed
        """
        if bpm < 20 or bpm > 300:
            Event.error.send(self, service=Event.SEQ, message="BPM must be between 20 and 300.")
            return

        self.bpm = bpm
        Event.speed_change.send(self, service=Event.SEQ, message=f"Changed speed to {bpm}")