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
    
    // Handle event style messages
    if (data.type === "event") {
        let body = data.body

        if (data.name === "active") {
            logMessage(body.service + " wurde gestartet.", Emojis.success);
            if (body.service == "DMI"){
                setDMIStateText(true);
                setDMIButtonState(true);
            } else if (body.service == "Sequencer"){
                setSequencerStateText(true);
                setSequencerButtonState(true);
            }
        }

        if (data.name === "inactive") {
            logMessage(body.service + " wurde beendet.", Emojis.success);
            if (body.service == "DMI"){
                setDMIStateText(false);
                setDMIButtonState(false);
            } else if (body.service == "Sequencer"){
                setSequencerStateText(false);
                setSequencerButtonState(false);
            }
        }

        if (data.name === "warning") {
            logMessage("Warnung beim " + body.service + ":\n" + body.message, Emojis.alert, "orange");
        }

        if (data.name === "error") {
            if (body.service == "DMI") {
                setDMIButtonState(false);
                setDMIStateText(false);
                logMessage("Fehler beim " + body.service + ":\n" + body.message, Emojis.error, "red");
                showNotification("Die Blockerkennung konnte nicht gestartet werden.");
            }
        }

        if (data.name === "disconnected") {
            setDMIButtonState(false);
            setDMIStateText(false);
            logMessage("Verbindungsabbruch:\n" + body.message, Emojis.alert, "red");
            showNotification("Der Arduino wurde getrennt. Die Blockerkennung wurde gestoppt.");
        }
    }
};

ws.onopen = () => {
    logMessage("Dashboard gestartet", Emojis.wave);
    logMessage("Drücke auf \"Blockerkennung Starten\" oder \"Sequencer Starten\" um loszulegen.", Emojis.notes); 
};
ws.onerror = (e) => {
    logMessage("Beim Dashboard ist ein Fehler aufgetreten: " + e , Emojis.error,"red");
};

// On page load, everything is stopped
stopSequencer();
stopDMI();