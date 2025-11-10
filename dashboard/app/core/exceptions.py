class AudiobrixUsbError(Exception):
    """
    Exception raised when the Audiobrix USB device cannot be found or connected to.
    """

    def __init__(self, message: Exception):
        prefix = "The Audiobrix USB device could not be found. "
        postfix = " - If the Arduino is connected, try another port in settings."
        super().__init__(prefix + message.__str__() + postfix)


class AudiobrixUsbKilledError(Exception):
    """
    Exception raised when the Audiobrix USB device is suddenly disconnected.
    """

    def __init__(self, message: Exception):
        prefix = "The Audiobrix USB device was disconnected. "
        super().__init__(prefix + message.__str__())
