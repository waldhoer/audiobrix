const Emojis = Object.freeze({
    alert: "⚠️",
    wave:"👋",
    success: "✅",
    error: "⛔",
    notes: "🎶",
    star: "⭐"
});
    
/**
 * Fetches a ressource from the given URI and returns the resulting JSON Object.
 * @param {String} uri The uri to fetch
 * @returns The JSON result
 */
async function fetch_json(uri){
    return await (await fetch(uri)).json();
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
 * Writes the given settings to the config file
 * @param {*} settings The settings in JSON format
 */
async function writeSingleSetting(name, setting) {
    try {
        fetch('/config_single', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: name, setting: setting})
        });
    } catch (error) {
        console.error("Error fetching file:", error);
    }
}