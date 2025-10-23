/**
 * Handles the incoming messages (from the DMI) and updates the table
 */
const ws = new WebSocket(`ws://${location.host}/ws`);

let skippedNotes = []; // [["beat", "midi"]] like e.g. [["0","72"]]

/**
 * Assigns the toggle/skip functionality to all cell buttons.
 */
async function setupTableSkip() {
    const settings = await readSettings();
    if (settings.skip) {
        const skipList = settings.skip || [];

        // Load note skips on page load
        skipList.forEach(([beat, note]) => {
            const cell = document.querySelector(`.cell[data-beat="${beat}"][data-row-note="${note}"]`);
            if (cell) {
                cell.classList.add("skipped");
            }
        });
    }
    
    // Add note skip clickables
    document.querySelectorAll(".cell").forEach(cell => {
        cell.addEventListener("click", () => {
            const beat = cell.dataset.beat;
            const note = cell.dataset.rowNote;

            const existingIndex = skippedNotes.findIndex(([b, n]) => b === beat && n === note);

            if (existingIndex >= 0) {
                skippedNotes.splice(existingIndex, 1);
                cell.classList.remove("skipped");
            } else {
                skippedNotes.push([beat, note]);
                cell.classList.add("skipped");
            }

            console.log("Skipped notes:", skippedNotes);
            saveSkipState();
        });
    });
    readSettings();
}

/**
 * Sends a request to save the currently skipped (frontend) notes  
 */
function saveSkipState() {
    try {
        fetch('/skipped', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({skip : skippedNotes})
        });
    } catch (error) {
        console.error("Error fetching file:", error);
    }
}

/**
 * Draws the active (pressed) notes in the table
 * @param {*} msg Message containing the pattern data
 */
function drawActiveNotes(msg){
    for (let beatIndex = 0; beatIndex < msg.data.length; beatIndex++) {
        for (const note in midi_names) {
            const cell = document.querySelector(
            `.cell[data-beat="${beatIndex}"][data-row-note="${note}"]`
            );
            if (!cell) continue;
            if (msg.data[beatIndex].includes(Number(note))) {
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
    const voice = new VF.Voice({ num_beats: 8, beat_value: 4 });
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

setupTableSkip();

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data).data;

    if (msg.type === "pattern") {
        message = "Erkanntes Notenblatt: ";
        msg.data.forEach(list => { 
            message += list.map(n => midiToName(n)).join("+") + "; ";
        });
        logPattern(message);
        drawActiveNotes(msg);
        drawSheet(msg);
    }

    if (msg.type === "step") {
        logStep("Gespielte Note(n): " + msg.data.map(n => midiToName(n)).join("+"));
        drawCurrentNotes(msg);
    }
};

ws.onopen = () => {
    logMessage("Dashboard gestartet\u{1F44B}"); // winking hand
    logMessage("Drücke \"Start\" um loszulegen.\u{1F3B6}"); // musical notes
};
ws.onerror = (e) => {
    logMessage("Beim Dashboard ist ein Fehler aufgetreten: " + e , "red");
};

