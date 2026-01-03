/**
 * Helper function for redirecting upon first load to the setup page
 */
async function redirect_first(){
    const settings = await readSettings();
    if (settings["show_tutorial"]){
        window.location.replace("/setup");
    } 
}

/**
 * Helper function to create selector options
 * @param {*} data The data to create options from (List)
 * @param {*} type COM or MIDI
 * @param {*} selector The select element to use
 * @param {*} proposal_text The proposal text element to use
 * 
 */
async function createSelectorOptions(data, type, selector, proposal_text){
    data.forEach(port => {
        console.log(port);

        const option = document.createElement("option");

        let name, candidate = false;
        if (type === "COM"){
            option.value = port.device;
            name = port.device + " - " + port.description;
            candidate = port.runnable === true;
        } else if (type === "MIDI"){
            option.value = port.index;
            name = port.index + " - " + port.name;
            candidate = port.candidate === true;
        } else {
            name = JSON.stringify(port);
            console.warn("Unknown port type for selector options:", type);
        }

        if (candidate) {
            option.textContent = Emojis.star +" " + name + " " + Emojis.star; // star for candidate
            option.selected = (type === "COM") ? true : (port.index === 0);
            proposal_text.innerHTML += "<b>" + name + "</b><br>";
        } else {
            option.textContent = name;
        }

        selector.appendChild(option);
    });
}

/**
 * Fetches and displays the system test results
 */
async function getSystestResults(){
    const systest = await fetch_json("http://localhost:8000/systest");
    const textbox = document.querySelector("#systest_results");
    const textbox_proposal = document.querySelector("#systest_results_proposal");
    const midi_textbox_proposal = document.querySelector("#midi_results_proposal");
    const loader = document.querySelector("#systest_loading");
    const save_button = document.querySelector("#save_button");

    const form = document.querySelector("#setup_form");
    const select_port = document.querySelector("#select_port");
    const select_midi = document.querySelector("#select_midi");

    createSelectorOptions(systest.COM, "COM", select_port, textbox_proposal);
    createSelectorOptions(systest.MIDI, "MIDI", select_midi, midi_textbox_proposal);

    textbox.innerHTML = "Wähle hier den passenden Anschluss, an dem der Arduino verbunden ist. Unser Systemtest empfiehlt diesen Anschluss: ";
    if (textbox_proposal.innerHTML === ""){
        textbox.innerHTML = "Wähle hier den passenden Anschluss, an dem der Arduino verbunden ist.";
        textbox_proposal.innerHTML = "<b>"+Emojis.alert+" Es wurde kein passender Anschluss gefunden.<br>Manuelles Testen notwendig!</b>";
        textbox_proposal.style.color = "red";
    }

    textbox_proposal.style.display = "block";
    save_button.style.display = "block";
    midi_textbox_proposal.style.display = "block";
    form.style.display = "block";
    loader.style.display = "none";

}

async function saveSetup() {
    const select_port = document.querySelector("#select_port");
    const select_midi = document.querySelector("#select_midi");

    console.log(select_port.value, select_midi.value);
    writeSingleSetting("arduino_port", select_port.value);
    writeSingleSetting("midi_device_id", Number(select_midi.value));

    window.location.replace("/dashboard");
}