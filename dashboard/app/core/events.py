import traceback
from blinker import signal
from blinker import NamedSignal


class _Events:
    """
    Singleton class containing all signals for the blinker event messaging.
    """

    def __init__(self):
        self.active = signal("active")
        self.inactive = signal("inactive")
        self.error = signal("error")
        self.warning = signal("warning")
        self.info = signal("info")

        self.disconnected = signal("disconnected")

        self.instrument_change = signal("instrument_changed")
        self.speed_change = signal("speed_changed")
        self.device_change = signal("device_changed")

    DMI = "DMI"
    SEQ = "Sequencer"

    @staticmethod
    def send_tb(signal: NamedSignal, e: Exception, sender, service, msg: str = ""):
        tb_str = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        if msg != "":
            tb_str = msg + " - " + tb_str
        signal.send(sender, service=service, message=tb_str)


Event = _Events()
