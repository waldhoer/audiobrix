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
 * Handles the incoming messages (from the DMI) and updates the table
 */
ws = new WebSocket(`ws://${location.host}/ws`);

let settings;

async function initialize(){
    settingsReady = readSettings().then(s => {
        settings = s;
        return settings;
    });

    await generate_table();
    drawSkippedColumns();
}
initialize();

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
    await settingsReady;

    if (instrument == null){
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
    await settingsReady;
    
    const slider = document.getElementById("speedRange");
    const speedValue = document.getElementById("speedValue");

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

// ---------------------------------------------- TABLE GRID DRAWING ----------------------------------------------

/*
We do not draw the table using document.write because the settings reading
requires a delay -> Instead we use the DOM method! Remember this!!
*/
async function generate_table() {
    await settingsReady;
    const midiKeys = Object.keys(midi_names).map(Number);

    // Header
    const tbody = document.getElementById('grid-body');
    const thead = document.getElementById('grid-head');
    tbody.innerHTML = '';
    thead.innerHTML = '';

    const theadRow = document.createElement('tr');
    const emptyTh = document.createElement('th'); 
    theadRow.appendChild(emptyTh);

    // Column Skip Buttons (Table Headers)
    for (let b = 0; b < settings["note_amount"]; b++) {
        const th = document.createElement('th');
        
        th.textContent = b + 1;
        th.style.cursor = "pointer"; 

        if (settings["skipped_cols"].includes(b)) {
            th.style.color = "red";
        }

        th.addEventListener("click", async () => {
            try {
            const index = settings["skipped_cols"].indexOf(b);
            if (index === -1) {
                settings["skipped_cols"].push(b);
                th.style.color="red";
            } else {
                settings["skipped_cols"].splice(index, 1);
                th.style.color="black";
            }
            
            writeSingleSetting("skipped_cols", settings["skipped_cols"]);
            drawSkippedColumns();
            } catch (error) {
                console.error("Error sending index:", error);
            }
        });

        theadRow.appendChild(th);
    }

    thead.appendChild(theadRow);

    // Table Cells
    for (let m = settings["max_note_height"]-1; m >= 0; m--) {
        const midi_note = Object.keys(midi_names)[m];

        const tr = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.className = 'rowlabel';
        labelCell.textContent = midiToName(midi_note);
        tr.appendChild(labelCell);

        for (let b = 0; b < settings["note_amount"]; b++) {
        const td = document.createElement('td');
        const div = document.createElement('div');
        div.className = 'cell';
        div.dataset.rowNote = midi_note;
        div.dataset.beat = b;
        td.appendChild(div);
        tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    if (settings["show_tutorial"]){
        settings["show_tutorial"] = false;
        await writeSettings(settings);

        introJs().setOptions({
        steps: [
            { element: '#grid', intro: 'Hier werden die erkannten Blöcke angezeigt. Durch klicken auf die einzelnen Blöcke können Noten stummgeschaltet werden.' },
            { element: '#dmiButton', intro: 'Hier wird die Notenblockerkennung gestartet und gestoppt. Damit werden die erkannten Blöcke angezeigt.' },
            { element: '#seqButton', intro: 'Hier wird der Sequencer gestartet und gestoppt. Damit werden die Noten abgespielt und hörbar gemacht.' },
            { element: '#instrument_btn', intro: 'Hier kann zwischen unterschiedlichen Instrumenten gewählt werden.' },
            { element: '#speed_slider', intro: 'Hier kann die Geschwindigkeit von links (langsam) nach rechts (schnell) eingestellt werden.' },
            { element: '#settings_btn', intro: 'In den Einstellungen können wichtige Parameter festgelegt werden.' },
            { element: '#toggleDetailsButton', intro: 'Hier kann die detaillierte Ansicht ein- oder ausgeblendet werden.' }
        ],
        showBullets: false,
        showProgress: true,
        nextLabel: 'Weiter',
        prevLabel: 'Zurück',
        doneLabel: 'Fertig 🎉'
        }).start();

    }
}

// ---------------------------------------------- CELL DRAWING ----------------------------------------------

/**
 * Draws the active (pressed) notes in the table
 * @param {*} msg Message containing the pattern data
 */
function drawActiveNotes(msg){
    bar_visualization = settings["full_bar_view"]
    for (let beatIndex = 0; beatIndex < msg.data.length; beatIndex++) {
        let goal_note = msg.data[beatIndex][0];
        for (const note in midi_names) {
            const noteValue = Number(note);
            
            // Decide if full-bar or only one-brick visualisation is used
            trigger = msg.data[beatIndex].includes(noteValue)
            if (bar_visualization){
                trigger = noteValue <= goal_note
            }
                
            const cell = document.querySelector(
            `.cell[data-beat="${beatIndex}"][data-row-note="${note}"]`
            );
            if (!cell) continue;
            if (trigger) {
                cell.classList.add("active");
            } else {
                cell.classList.remove("active");
                cell.classList.remove("current");
            }

        }
    }
}

/**
 * Draws a note sheet from the brick pattern
 * @param {*} msg The message containing the pattern data
 */
async function drawSheet(msg) {
    const VF = Vex.Flow;
    const div = document.getElementById("output");
    div.innerHTML = "";
    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

    renderer.resize(450, 100);
    const context = renderer.getContext();
    const stave = new VF.Stave(0, 0, 449);

    stave.addClef("treble").addTimeSignature("4/4");
    stave.setContext(context).draw();

    const staveNotes = msg.data.map(beat => {
        if (!beat || beat.length === 0) {
            return new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],   // invisible note
                duration: "qr"   // quarter rest
            });
        } else {
            return new VF.StaveNote({
                clef: "treble",
                keys: beat.map(pitch => {
                        // all notes are formatted as e.g. C/3 instead of C3
                        // one octave is added in the note sheet for a better note fit
                        let octave = parseInt(String(midi_names[pitch]).charAt(1)) + 1
                        return String(midi_names[pitch]).charAt(0) + "/" + octave
                    }
                ),
                duration: "q" // one quarter note
            });
        }
    });

    // Format and draw
    const voice = new VF.Voice({ num_beats: settings["note_amount"], beat_value: 4 });
    voice.addTickables(staveNotes);
    new VF.Formatter().joinVoices([voice]).format([voice], 350);
    voice.draw(context, stave);
    }

 /**
 * Draws the currently played notes in the table (overwriting the active color)
 * @param {*} msg The message containing the step and note data
 */
function drawCurrentNotes(msg){
    for (const note of msg.data) {
        document.querySelectorAll(`.cell.current`).forEach(cell => {
            if (Number(cell.dataset.beat) !== msg.step) {
                cell.classList.remove("current");
            }
        });     

        const cell = document.querySelector(`.cell[data-beat="${msg.step}"][data-row-note="${note}"]`);
        if (cell) {
            cell.classList.add("current");
        }   
    }
}

function drawSkippedColumns() {
    if (!settings) return;

    for (let b = 0; b < settings["note_amount"]; b++) {
        const isSkipped = settings["skipped_cols"].includes(b);

        for (const note in midi_names) {
            const cell = document.querySelector(
                `.cell[data-beat="${b}"][data-row-note="${note}"]`
            );
            if (!cell) continue;

            if (isSkipped) {
                cell.classList.add("muted");
                cell.classList.remove("active", "current");
            } else {
                cell.classList.remove("muted");
            }
        }
    }
}
