pyinstaller dashboard/main.py ^
  --onefile ^
  --paths dashboard ^
  --collect-submodules app ^
  --add-data "dashboard/settings.json;." ^
  --add-data "dashboard/settings_dscr.json;." ^
  --add-data "dashboard/templates;templates" ^
  --add-data "dashboard/static;static"
