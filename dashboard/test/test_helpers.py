import json
from pathlib import Path
import unittest
from app.core.helpers import *


class HelperTester(unittest.TestCase):
    path = Path(__file__).resolve()
    config_path = resource_path("settings.json")
    config_description_path = resource_path("settings_dscr.json")

    def testEmptyWrite(self):
        """
        Tests if empty settings can be stored
        """
        with self.assertRaises(AttributeError):
            settings = Helpers.config

            Helpers.writeAll(dict())

            with open(self.config_path, "r", encoding="utf-8") as config_file:
                new_settings = json.load(config_file)
                Helpers.writeAll(settings)

                print("Test:", new_settings)
                assert new_settings != {}


if __name__ == "__main__":
    unittest.main()
