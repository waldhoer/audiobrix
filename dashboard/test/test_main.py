import importlib
from pathlib import Path
import unittest
from app.core.helpers import *
from fastapi.testclient import TestClient
from main import app


class MainTester(unittest.TestCase):
    path = Path(__file__).resolve()
    config_path = resource_path("settings.json")
    config_description_path = resource_path("settings_dscr.json")

    def test_SetUp(self):
        settings = Helpers.config
        with open(self.config_path, "w", encoding="utf-8") as config_file:
            config_file.write("{}")

        with self.assertRaises(KeyError):
            self.client = TestClient(app)
            Helpers.load_settings()

        Helpers.writeAll(settings)

    def test_root(self):
        with TestClient(app) as client:
            response = client.get("/")
            self.assertEqual(response.status_code, 200)
