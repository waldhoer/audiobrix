cd dashboard
copy "settings.json" ".\dist\settings.json"
copy "settings_dscr.json" ".\dist\settings_dscr.json"
pyinstaller main.py --add-data "settings.json;." --add-data "settings_dscr.json;." --add-data "templates;templates" --add-data "static;static" --onefile