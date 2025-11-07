from blinker import signal

class _Events:
    """
    Singleton class containing all signals for the blinker event messaging.
    """
    def __init__(self):
        self.dmi_active = signal("dmi-active")
        self.dmi_inactive = signal("dmi-inactive")
        self.dmi_error = signal("dmi-error")
        self.dmi_disconnected = signal("dmi-disconnected")
        self.dmi_warning = signal("dmi-warning")

        self.sequencer_active = signal("sequencer-active")
        self.sequencer_inactive = signal("sequencer-inactive")
        self.sequencer_error = signal("sequencer-error")
        self.sequencer_instrument_change = signal("sequencer-instrument_changed")
        self.sequencer_speed_change = signal("sequencer-speed_changed")
        self.sequencer_device_change = signal("sequencer-device-changed")

Event = _Events()