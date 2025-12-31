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
    74 : "D4",
    76 : "E4",
    77 : "F4"
};


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
 * Starts the DMI using the start endpoint
 */
async function startDMI() {
    try {
        await fetch_json("/start");
    } catch (err) {
        logMessage("Fehler beim Starten des DMI: " + err, "red");
    }
}

/**
* Stops the DMI using the stop endpoint
*/
async function stopDMI() {
    try {
        await fetch("/stop");
    } catch (err) {
        logMessage("Fehler beim Stoppen des DMI: " + err, "red");
    }
}

/**
 * Starts the sequencer using the start endpoint
 */
async function startSequencer() {
    try {
        await fetch_json("/sequencer/start")
    } catch (err) {
        logMessage("Fehler beim Starten des Sequncers: " + err, "red");
    }
}

/**
 * Stops the sequencer using the stop endpoint
 */
async function stopSequencer() {
    try {
        await fetch("/sequencer/stop");
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
        await fetch_json("http://localhost:8000/sequencer/device");
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
        btn.textContent = "⏸️ Sequencer stoppen";
    } else {
        btn.classList.remove("button-red");
        btn.classList.add("button-green");
        btn.textContent = "▶️ Sequencer starten";
    }
}

function setDMIStateText(state){
    document.getElementById("dmi_state").textContent = "Blockerkennung: " + (state ? "Aktiv" : "Inaktiv");
}

function setSequencerStateText(state){
    document.getElementById("seq_state").textContent = "Blockerkennung: " + (state ? "Aktiv" : "Inaktiv");
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
 * @returns true if the instrument update was successful, false otherwise
 */
async function changeInstrumentSetting(endpoint_uri, parameters, title){
    try {
        const url = new URL(endpoint_uri, window.location.origin);
        Object.entries(parameters).forEach(([k, v]) => {
            url.searchParams.set(k, v);
        })

        await fetch_json(url);

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
    if (changeInstrumentSetting("/sequencer/instrument", {"channel" : instrument}, "Instrument")){
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
        if (changeInstrumentSetting("/sequencer/speed",{"bpm" : slider.value}, "Geschwindikeit")){
            updateSpeedText();
        }
    }
}
