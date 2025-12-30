import json
from pathlib import Path
import unittest
from app.core.helpers import *


class HelperTester(unittest.TestCase):
    path = Path(__file__).resolve()
    config_path = resource_path("settings.json")
    config_description_path = resource_path("settings_dscr.json")

    def test_EmptyWrite(self):
        """
        Tests if empty settings can be stored
        """
        settings = Helpers.config

        with self.assertRaises(AttributeError):
            Helpers.writeAll(dict())

        with self.assertRaises(AttributeError):
            Helpers.write("arduino_port", None)

        with self.assertRaises(AttributeError):
            Helpers.write("", "Test")

        Helpers.writeAll(settings)


if __name__ == "__main__":
    unittest.main()
