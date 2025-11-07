ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Handle OSC stlye messages
    if ('address' in data && 'data' in data){
        msg = data.data; // UDPClient adds this additional layer
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
    }
    
    console.log(data);
    // Handle event style messages
    if (data.type === "event") {
        let body = data.body
        
        if (data.name === "active") {
            logMessage("\u{1F973}" +body.service + " wurde gestartet.");
            if (body.service == "DMI"){
                setDMIStateText(true);
                setDMIButtonState(true);
            } else if (body.service == "Sequencer"){
                setSequencerStateText(true);
                setSequencerButtonState(true);
            }
        }

        if (data.name === "inactive") {
            logMessage("\u{1F973}" +body.service + " wurde beendet.");
            if (body.service == "DMI"){
                setDMIStateText(false);
                setDMIButtonState(false);
            } else if (body.service == "Sequencer"){
                setSequencerStateText(false);
                setSequencerButtonState(false);
            }
        }

        if (data.name === "warning") {
            logMessage("WARNUNG:" + body.service + body.message, "orange");
        }

        if (data.name === "error") {
            if (body.service == "DMI") {
                setDMIButtonState(false);
                setDMIStateText(false);
                logMessage("ERROR: " + body.service + body.message, "red");
                showNotification("Die Blockerkennung konnte nicht gestartet werden.");
            }
        }

        if (data.name === "disconnected") {
            setDMIButtonState(false);
            setDMIStateText(false);
            logMessage("DISCONNECTED: " + body.service + body.message, "orange");
            showNotification("Der Arduino wurde getrennt. Die Blockerkennung wurde gestoppt.");
        }
    }
};

ws.onopen = () => {
    logMessage("Dashboard gestartet\u{1F44B}"); // winking hand
    logMessage("Drücke \"Start\" um loszulegen.\u{1F3B6}"); // musical notes
};
ws.onerror = (e) => {
    logMessage("Beim Dashboard ist ein Fehler aufgetreten: " + e , "red");
};
