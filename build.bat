copy ".\dashboard\settings.json" ".\dist\settings.json"
copy ".\dashboard\settings_dscr.json" ".\dist\settings_dscr.json"

powershell -NoProfile -Command "$p='.\dist\settings.json'; $j=Get-Content $p -Raw | ConvertFrom-Json; $j.show_tutorial=$true; $j | ConvertTo-Json -Depth 1 | Set-Content $p"

pyinstaller ^
  --paths . ^
  --paths .\dashboard ^
  --onefile ^
  --add-data ".\dashboard\settings.json;." ^
  --add-data ".\dashboard\settings_dscr.json;." ^
  --add-data ".\dashboard\templates;templates" ^
  --add-data ".\dashboard\static;static" ^
  --collect-submodules "app" ^
  --hidden-import "mido.backends.rtmidi" ^
  --hidden-import "rtmidi" ^
  .\dashboard\main.py 