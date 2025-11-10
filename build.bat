cd dashboard
pyinstaller main.py --add-data "settings.json;." --add-data "settings_dscr.json;." --add-data "templates;templates" --add-data "static;static" --onefile