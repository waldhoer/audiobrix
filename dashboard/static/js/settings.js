let settings = null;
let descriptions = null;

/**
 * Converts the value to the type of the original value.
*/
function convertToType(value, originalType) {
    switch (originalType) {
        case "number":
            return Number(value); 
        case "boolean":
            return value.toLowerCase() === "true"; 
        default:
            return value;
    }
}

/**
 * Returns the appropriate HTML form input type for the given value.
*/
function getInputType(value) {
    switch (typeof value) {
        case "number":
            return "number";
        case "boolean":
            return "checkbox";
        default:
            return "text";
    }
}

/**
 * Reads the settings from the config file
 * @returns The current settings from the config file
 */
async function readSettingsDescriptions() {
    try {
        const response = await fetch("http://localhost:8000/config_dscr");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching file:", error);
        return null;
    }
}

/**
 * Saves the current table settings by reading values from the input fields
 */
function saveTableSettings() {
    const newSettings = {};
    Object.keys(settings).forEach(name => {
        const settingInput = document.getElementById("setting_" + name);
        if (!settingInput){
            console.log("Hidden property \"" + name + "\" not updated. This may be intentional.");
            return;
        } 
        let value = (settingInput.type === "checkbox") ? String(settingInput.checked) : settingInput.value;
        value = convertToType(value, typeof settings[name]);
        newSettings[name] = value;
    });
    console.log("Saving settings:", newSettings);

    writeSettings(newSettings);

    changeInstrumentDevice();
}

/**
 * Copies the default value of a setting into the input field
 * @param {*} name The name of the setting
 */
function copyDefaultValue(name){
    console.log("Copying default value for setting:", name);
    const settingInput = document.getElementById("setting_" + name);
    let value = descriptions[name]["default"] || "";
    
    if (settingInput.type === "checkbox") {
        settingInput.checked = (String(value).toLowerCase() === "true");
    } else {
        settingInput.value = convertToType(value, typeof settings[name]);
    }
}

/**
 * Fetches and displays the system test results
 */
async function getSystestResults(){
    const systest = await fetch_json("http://localhost:8000/systest");
    const textbox = document.querySelector("#systest_results");
    const textbox_proposal = document.querySelector("#systest_results_proposal");
    const loader = document.querySelector("#systest_loading");

    const form = document.querySelector("#setup_form");
    const select = document.querySelector("#select_port");
    
    systest.COM.forEach(port => {
        console.log(port);

        const option = document.createElement("option");
        option.value = port.device;

        let name = port.device + " - " + port.description;

        if (port.candidate === true) {
            option.textContent = "\u{2B50} " + name + " \u{2B50}"; // star for candidate
            option.selected = true;
            textbox_proposal.innerHTML += "<b>\u{2B50} " + name + " \u{2B50}</b>";
        } else {
            option.textContent = name;
        }

        select.appendChild(option);
    });
    textbox.innerHTML = "Wähle hier den passenden Anschluss, an dem der Arduino verbunden ist. Unser Systemtest empfiehlt diesen Anschluss: ";
    textbox_proposal.style.display = "block";
    form.style.display = "block";
    loader.style.display = "none";
}

/**
 * Loads the current table settings and draws the (converted) values into the table
 */
async function loadTableSettings() {
    const tbody = document.getElementById("settingsTableBody");
    descriptions = await readSettingsDescriptions();
    settings = await readSettings();
    const systest = await fetch_json("http://localhost:8000/systest");

    console.log("Loaded settings:", settings);

    Object.entries(settings).forEach(([name, value]) => {
        const row = document.createElement("tr");

        // Draw name cell
        const cellName = document.createElement("td");
        cellName.textContent = name;

        // Draw description cell
        const cellDescription = document.createElement("td");
        const cellDescriptionText = document.createElement("p");
        const cellSystestText = document.createElement("p");

        // Skip all settings that do not have any description - This only affects the settings table, not the settings in general!
        if (!(name in descriptions)){
            console.info("Settings Property \"" + name + "\" was not loaded into Settings screen due to missing description. This may be intentional.");
            return;
        } 

        cellDescriptionText.textContent = descriptions[name]["text"] || "No description available.";
        
        if ("systest" in descriptions[name]){
            let suggestions = systest[descriptions[name]["systest"]]
            if (suggestions.length == 0){
                cellSystestText.textContent += "\u{26A0} Auf dem Gerät wurde keine COM Verbindung gefunden!";
            } else {
                cellSystestText.innerHTML += "\u{26A0} Verfügbar:<br>" + suggestions.join("<br>"); 
            }
        }
        cellSystestText.style.color = "blue";
        cellSystestText.style.margin = 0;
        cellDescriptionText.style.margin = 0;
        
        cellDescription.appendChild(cellDescriptionText);
        cellDescription.appendChild(cellSystestText);

        // Draw standard value cell
        const cellStandard = document.createElement("td");

        let link = document.createElement("p");
        link.textContent = descriptions[name]["default"] || "N/A";
        link.addEventListener("click", () => copyDefaultValue(name));
        link.title = "Klicke um den Standard für \"" + name + "\" zu übernehmen.";
        link.style.cursor = "pointer";
        link.style.textDecoration = "underline";
        link.style.margin = "0";
        cellStandard.appendChild(link);

        // Draw value cell with input field
        const cellValue = document.createElement("td");
        const valueInput = document.createElement("input");
        valueInput.type = getInputType(settings[name]);
        valueInput.value = convertToType(value, settings[name]);
        if (valueInput.type === "checkbox") {
            valueInput.checked = Boolean(value);
        }
        valueInput.id = "setting_" + name;
        cellValue.appendChild(valueInput);
        
        // Border style controls
        cellName.classList.add("setting-row");
        cellDescription.classList.add("setting-row-mid");
        cellStandard.classList.add("setting-row-mid");
        cellValue.classList.add("setting-row");

        row.appendChild(cellName);
        row.appendChild(cellDescription);
        row.appendChild(cellStandard);
        row.appendChild(cellValue);

        tbody.appendChild(row);
    });
}