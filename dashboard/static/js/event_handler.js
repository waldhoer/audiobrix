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
