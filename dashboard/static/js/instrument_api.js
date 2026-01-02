
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