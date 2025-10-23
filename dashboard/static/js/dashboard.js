/**
 * List of midi names with corresponding MIDI number
 */
const midi_names = {
    60 : "C3",
    62 : "D3",
    64 : "E3",
    65 : "F3",
    67 : "G3",
    69 : "A3",
    71 : "B3",
    72 : "C4",
};

/**
 * Status class for DMI and Sequencer States.
 */
class Status{
    static ACTIVE = "active";
    static INACTIVE = "inactive";
    static ERROR = "error";
    static DISCONNECTED = "disconnected";
    static INSTRUMENT_CHANGED = "instrument_changed";
    static SPEED_CHANGED = "speed_changed";
    DEVICE_CHANGED = "device_changed";
    static OK = "ok";

    static current_dmi_status = Status.INACTIVE;
    static current_seq_status = Status.INACTIVE;
}

/**
 * Maps a name to a MIDI number.
 * Only specific MIDI values are allowed.
 * @param {number} midi_number
 */
function midiToName(midi_number){
    return midi_names[midi_number] ?? "\u{26A0}"; // warning sign
}

/**
 * Adds line breaks after a certain number of characters, considering spaces.
 * This method is required to avoid long log messages, breaking potential layouts.
 * @param {*} text The text message
 * @param {*} maxLength maximum number of characters per line
 * @returns Formatted Text
 */
function formatText(text, maxLength) {
  const regex = new RegExp(`(.{1,${maxLength}})(\\s|$)`, 'g');
  return text.replace(regex, '$1\n');
}

/**
 * Fetches a ressource from the given URI and returns the resulting JSON Object.
 * @param {String} uri The uri to fetch
 * @returns The JSON result
 */
async function fetch_json(uri){
    return await (await fetch(uri)).json();
}

/**
 * Adds a message to the log (with ending line break)
 * @param {*} message The message to append
 * @param {*} color Optional color of the message
 * @param {*} rt If true, the message is added to the real-time log
 */
function logMessage(message, color) {
    const log = document.getElementById("log");

    const span = document.createElement("div");
    if (color) {
        span.style.color = color;
    }
    span.textContent = formatText(message, 60); 
    
    log.appendChild(span);

    log.scrollTop = log.scrollHeight; // TODO: En/Disable autoscroll
}

function logPattern(message) {
    const log = document.getElementById("pattern_log");
    log.textContent = message;
}

function logStep(message) {
    const log = document.getElementById("step_log");
    log.textContent = message;
}

/**
 * Shows a new notification toast 
 * @param {*} message The message to show
 * @param {*} duration The duration to show in milliseconds 
 */
function showNotification(message, duration = 7000) {
  const container = document.getElementById("notificationContainer");

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<p><i class="fa-solid fa-circle-exclamation"></i> &nbsp; ${message}</p>`;

  container.prepend(notification);

  requestAnimationFrame(() => {
    notification.classList.add("show");
  });

  const existing = container.querySelectorAll(".notification");
  if (existing.length > 3) {
    existing[existing.length - 1].remove();
  }

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300); // fade-out
  }, duration);
}

/**
 * Reads the settings from the config file
 * @returns The current settings from the config file
 */
async function readSettings() {
    try {
        return await fetch_json("http://localhost:8000/config");
    } catch (error) {
        console.error("Error fetching file:", error);
        return null;
    }
}

/**
 * Writes the given settings to the config file
 * @param {*} settings The settings in JSON format
 */
async function writeSettings(settings) {
    try {
        fetch('/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
    } catch (error) {
        console.error("Error fetching file:", error);
    }
}

/**
 * Starts the DMI using the start endpoint
 */
async function startDMI() {
    try {
        if (Status.current_dmi_status === Status.ACTIVE) {
            logMessage("Das DMI ist bereits aktiv \u{1F609}", "DarkOrange"); // winking face
            return;
        }
        const data = await fetch_json("/start");
        if (data.status === Status.ERROR) {
            logMessage("Fehler beim Starten des DMI \u{1F6A8}", "DarkOrange"); // siren symbol
            logMessage(data.message, "red");
            showNotification("Fehler beim Starten der Blockerkennung. Klicke auf \"Details Anzeigen\" für mehr Infos.");
        } else {
            logMessage("DMI gestartet \u{1F4AA}");
        }
    } catch (err) {
        logMessage("Fehler beim Starten des DMI: " + err, "red");
    }
}

/**
* Stops the DMI using the stop endpoint
*/
async function stopDMI() {
    try {
        if (Status.current_dmi_status !== Status.ACTIVE) {
            logMessage("Das DMI war bereits deaktiviert \u{1F609}", "DarkOrange"); // winking face
        }
        await fetch("/stop");
        logMessage("DMI gestoppt \u{1F4A4}");
    } catch (err) {
        logMessage("Fehler beim Stoppen des DMI: " + err, "red");
    }
}

/**
 * Starts the sequencer using the start endpoint
 */
async function startSequencer() {
    try {
        if (Status.current_seq_status === Status.ACTIVE) {
            logMessage("Der Sequencer war bereits aktiviert \u{1F609}", "DarkOrange"); // winking face
            return;
        }
        const data = await fetch_json("/sequencer/start")
        if (data.status === Status.ERROR) {
            logMessage("Fehler beim Starten des Sequencers \u{1F6A8}", "DarkOrange"); // siren symbol
            logMessage(data.message, "red");
            showNotification("Fehler beim Starten des Sequencers. Klicke auf \"Details Anzeigen\" für mehr Infos.");
        } else {
            logMessage("Sequencer gestartet \u{1F4AA}");
        }
        
    } catch (err) {
        logMessage("Fehler beim Starten des Sequncers: " + err, "red");
    }
}

/**
 * Stops the sequencer using the stop endpoint
 */
async function stopSequencer() {
    try {
        if (Status.current_seq_status !== Status.ACTIVE) {
            logMessage("Der Sequencer war bereits deaktiviert \u{1F609}", "DarkOrange"); // winking face
            return;
        }

        await fetch("/sequencer/stop");
        logMessage("Sequencer gestoppt \u{1F4A4}");
    } catch (err) {
        logMessage("Fehler beim Stoppen des Sequencers: " + err, "red");
    }
}

/**
 * Updates the midi output device.
 */
async function changeInstrumentDevice(){
    title = "MIDI Output Device";
    try {
        let result = await fetch_json("http://localhost:8000/sequencer/device");
        if (result == Status.DEVICE_CHANGED){
            console.log("MIDI Output Device wurde aktualisiert");
        } else {
            console.log("Fehler beim Wechseln des MIDI Output Device "+result.message);
        }
    } catch (err) {
        console.error("Netzwerkfehler beim Wechseln von " + title + ": " + err, "red");
        return false;
    }
}

/**
 * Sets the DMI button state.
 * @param {*} active True means the button should show the "Stop" while false means otherwise
 */
function setDMIButtonState(active) {
    const btn = document.getElementById("dmiButton");
    if (active) {
        btn.classList.remove("button-green");
        btn.classList.add("button-red");
        btn.textContent = "⏸️ Blockerkennung stoppen";
    } else {
        btn.classList.remove("button-red");
        btn.classList.add("button-green");
        btn.textContent = "▶️ Blockerkennung starten";
    }
}

/**
 * Sets the sequencer button state.
 * @param {*} active True means the button should show the "Stop" while false means otherwise
 */
function setSequencerButtonState(active) {
    const btn = document.getElementById("seqButton");
    if (active) {
        btn.classList.remove("button-green");
        btn.classList.add("button-red");
        btn.textContent = "⏹️ Sequencer stoppen";
    } else {
        btn.classList.remove("button-red");
        btn.classList.add("button-green");
        btn.textContent = "🔁 Sequencer starten";
    }
}

/**
 * Toggles the brick recognition state and updates the button accordingly
 */
function toggleDMI() {
    const btn = document.getElementById("dmiButton");
    const isActive = btn.classList.contains("button-red");

    if (!isActive) {
        startDMI();
    } else {
        stopDMI();
    }
}

/**
 * Toggles the sequencer playing state and updates the button accordingly
 */
function toggleSequencer() {
    const btn = document.getElementById("seqButton");
    const isActive = btn.classList.contains("button-red");

    if (!isActive) {
        startSequencer();
    } else {
        stopSequencer();
    }
}

function toggleDetails() {
    const log = document.getElementById("logContainer");
    const btn = document.getElementById("toggleDetailsButton");

    if (log.style.display === "none") {
        log.style.display = "flex";
        btn.innerHTML = '<p><i class="fa-solid fa-code"></i> Details Verbergen</p>';
    } else {
        log.style.display = "none";
        btn.innerHTML = '<p><i class="fa-solid fa-code"></i> Details Anzeigen</p>';
    }
}

/**
 * Sets the instrument color for the toggle buttons
 * @param {int} instrument 
 */
async function setInstrumentButton(instrument = null){
    if (instrument == null){
        const settings = await readSettings();
        instrument = settings["instrument"];
    }

    for (let index = 0; index < 128; index++) {
        const btn = document.getElementById("toggleInstrument"+index)
        if (btn != null && btn.classList.contains("button-green-active")){
            btn.classList.remove("button-green-active");
        }
    }

    const own_btn = document.getElementById("toggleInstrument"+instrument);
    own_btn.classList.add("button-green-active");
}

/**
 * Updates an instrument setting by accessing the endpoint.
 * Manages the success/error response logging.
 * 
 * @param {String} endpoint_uri The endpoint URI of the update operation
 * @param {dict} parameters The parameters to attach to the URI (GET)
 * @param {String} title The title of the change operation for logging purposes
 * @param {Status} expected The expected Status upon success
 * @returns true if the instrument update was successful, false otherwise
 */
async function changeInstrumentSetting(endpoint_uri, parameters, title, expected){
    try {
        const url = new URL(endpoint_uri, window.location.origin);
        Object.entries(parameters).forEach(([k, v]) => {
            url.searchParams.set(k, v);
        })

        const data = await fetch_json(url);

        if (data.status === Status.ERROR) {
            logMessage("Fehler beim Wechseln von " + title + " \u{1F6A8}", "DarkOrange");
            logMessage(data.message, "red");
            return false;
        } else if (data.status === expected) {
            logMessage(title + " aktualisiert: " + Object.entries(parameters).map(([k, v]) => v).join(";"));
            return true;
        }

    } catch (err) {
        logMessage("Netzwerkfehler beim Wechseln von " + title + ": " + err, "red");
        return false;
    }
}

/**
 * Sets the instrument of the sequencer and updates buttons accordingly
 * @param {*} instrument The GM instrument number
 */
async function setInstrument(instrument) {
    if (changeInstrumentSetting("/sequencer/instrument", {"channel" : instrument}, "Instrument", Status.INSTRUMENT_CHANGED)){
        setInstrumentButton(instrument);
    }
}

/**
 * Updates the speed text to match the speed sliders value.
 */
function updateSpeedText() {
    document.getElementById("speedValue").textContent = document.getElementById("speedRange").value;
}

/**
 * Updates the sequencers playing speed or loads the configs playing speed
 * @param {boolean} set_default set true if the default (config) speed should be loaded instead of using the sliders value 
 */
async function updateSpeed(set_default=false) {
    const slider = document.getElementById("speedRange");
    const speedValue = document.getElementById("speedValue");

    const settings = await readSettings();
    if (set_default){
        let speed = settings["bpm_playing_speed"];
        slider.value = Number(speed);
        speedValue.textContent = speed;
    } else {
        settings["bpm_playing_speed"] = Number(slider.value);
        if (changeInstrumentSetting("/sequencer/speed",{"bpm" : slider.value}, "Geschwindikeit", Status.SPEED_CHANGED)){
            updateSpeedText();
        }
    }
}

/**
 * Checks the current status of the DMI and updates the buttons & messages accordingly.
 */
async function checkDmiStatus() {
    let dashboard_is_dead = false;
    while (true) {
        try {
            const dmi_data = await fetch_json("/status?service=dmi")
            const seq_data = await fetch_json("/status?service=seq")

            setSequencerButtonState(seq_data.status === Status.ACTIVE);
            setDMIButtonState(dmi_data.status === Status.ACTIVE);

            if (dmi_data.status === Status.DISCONNECTED && Status.current_dmi_status === Status.ACTIVE) {
                showNotification("Der Arduino wurde getrennt. Die Blockerkennung wurde gestoppt.");
            } 

            document.getElementById("seq_state").textContent = "Sequencer: "+seq_data.status;
            document.getElementById("dmi_state").textContent = "Blockerkennung: "+dmi_data.status;

            Status.current_dmi_status = dmi_data.status;
            Status.current_seq_status = seq_data.status;
        } catch (err) {
            if (!dashboard_is_dead) {
                logMessage("Fehler beim Dashboard \u{1F4F4}", "orange");
                logMessage(
                    "Der Status des DMI konnte nicht abgefragt werden.\n"+
                    "Dieses Problem tritt auf, wenn das Python Programm im Hintergrund nicht mehr läuft.", "red");
                showNotification("Das Dashboard konnte den lokalen Server nicht erreichen. Läuft das Python Programm?",9000);
                dashboard_is_dead = true;
            }
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

