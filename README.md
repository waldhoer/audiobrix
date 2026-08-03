# Audiobrix
The AudioBrix is a digital musical interface (DMI) which is based on electrified DUPLO bricks. 
The audiobrix application is only available with the corresponding Audiobrix hardware.

## How to use this repository
Before you start, ensure to install all python requirements as specified in `requirements.txt`. After that, check if the Arduino communication port (on Windows usually something like `COM1` for example) is correctly set in the `settings.json`. In case of errors, this configuration file is most likely the cause. Always check if ports, address ranges etc. are set up correctly.

## How to use the instrument
To access the Audiobrix interface start the `main.exe` application. Ensure the main python application is running continously in a terminal/background. 
Next, open `localhost:8000` in your browser. (port depends on `dashboard_port` in the settings).  

If you are not using Windows, the `main.py` file can be used to start the application.

The dashboard offers some few functions:
- Brick recognition start / stop
- Sequencer playing start / stop
- Showing Logs
- Showing current Note Sheet / Brick Sheet
- Disabling and Enabling Columns/Beats
