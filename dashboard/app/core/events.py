from blinker import signal


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


Event = _Events()
