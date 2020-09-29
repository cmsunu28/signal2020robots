// Log the URLs we need
server.log("Spin servo 1 left:  " + http.agenturl() + "?dir=1,l");
server.log("Spin servo 2 right: " + http.agenturl() + "?dir=2,r");
server.log("Stop spinning servo 3:  " + http.agenturl() + "?dir=3,0");
// server.log("set:  " + http.agenturl() + "?set=### out of 1000");

function requestHandler(request, response) {
    try {
        if ("dir" in request.query) {
            local setDir=request.query.dir;
            device.send("dir.servo", setDir);
        }
        if ("set" in request.query) {
                local setReq=request.query.set;
                server.log(setReq);
                device.send("set.servo", setReq.tofloat()/1000.0); 
            }
    
        // Send a response back to the browser saying everything was OK.
        response.send(200, "OK");
  } catch (ex) {
        response.send(500, "Internal Server Error: " + ex);
  }
}

// Register the HTTP handler to begin watching for HTTP requests from your browser
http.onrequest(requestHandler);