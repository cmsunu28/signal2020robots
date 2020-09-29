// Log the URLs we need
server.log("drive:  " + http.agenturl() + "?drive=f"); // f, b, l, r

function requestHandler(request, response) {
    try {
        if ("drive" in request.query) {
            local driveDir=request.query.drive;
            server.log(driveDir);
            device.send("roomba.drive", driveDir);
        }
        if ("led" in request.query) {
            local ledparams=request.query.led.tostring();
            server.log(ledparams);
            device.send("roomba.led", ledparams);
        }

        // Send a response back to the browser saying everything was OK.
        response.send(200, "OK");
  } catch (ex) {
        response.send(500, "Internal Server Error: " + ex);
  }
}

// Register the HTTP handler to begin watching for HTTP requests from your browser
http.onrequest(requestHandler);