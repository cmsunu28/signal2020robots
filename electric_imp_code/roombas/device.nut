server.log("Device Started");

baudPin <- hardware.pin1;

vacuumState<-0;

baudPin.configure(DIGITAL_OUT,1);

// Alias UART to which Arduino is connected and configure UART
local roomba = hardware.uart57;

function parseData() {
    local b=roomba.read();
    while (b != -1) {
        // As long as UART read value is not -1, we're getting data
        server.log(b);
        b = roomba.read();
    }
}

roomba.configure(19200, 8, PARITY_NONE, 1, NO_CTSRTS, parseData);

imp.sleep(1);

roomba.flush();

server.log("wakeup started");

function roombaSetup() {
    baudPin.write(1);
    imp.sleep(3);
    baudPin.write(0);
    imp.sleep(0.2);
    baudPin.write(1);
    imp.sleep(0.2);
    baudPin.write(0);
    imp.sleep(0.2);
    baudPin.write(1);
    imp.sleep(0.2);
    baudPin.write(0);
    imp.sleep(0.2);
    baudPin.write(1);
    imp.sleep(0.2);
    roomba.write(128);
    imp.sleep(0.2);
    roomba.write(131);
    
    server.log("wakeup sent");
    
    // wait half a second
    imp.sleep(0.5);
    
    // blink the light to show that it works
    lightTest();
}

function lightTest() { // turns light on for 2 seconds then off for 2 seconds
  roomba.write(139);
  roomba.write(0x03);
  roomba.write(0x01);
  roomba.write(255);
  imp.sleep(0.2);
  roomba.write(139);
  roomba.write(0x03);
  roomba.write(0x00);
  roomba.write(0x00);
  imp.sleep(0.2);
}

function leds(ledparams) {
    local ledarray=split(ledparams,",");
    if (ledarray[0]=="o") {
        // turn on all orange lights
        roomba.write(139);
        roomba.write(48); //00110000
        roomba.write(100);
        roomba.write(255);
    }
    else if (ledarray[0]=="r") {
        // turn on all red lights
        roomba.write(139);
        roomba.write(48);
        roomba.write(255);
        roomba.write(255);
    }
    else if (ledarray[0]=="g") {
        roomba.write(139);
        roomba.write(48); //00110000
        roomba.write(0);
        roomba.write(255);
    }
    else if (ledarray[0]=="s") {
        // turn lights off
        roomba.write(139);
        roomba.write(48); //00110000
        roomba.write(0);
        roomba.write(0);
    }
    else {
        roomba.write(139);
        roomba.write(ledarray[0].tointeger());
        roomba.write(ledarray[1].tointeger());
        roomba.write(ledarray[2].tointeger());
    }
}

function statusLED(c) { // defaults to full intensity
    if (c=="g") { // green
        server.log("green");
        roomba.write(139);
        roomba.write(0x45);
        roomba.write(0x01,0x00);
        roomba.write(255);

    }
    else if (c=="r") { // red
        server.log("red");
        roomba.write(139);
        roomba.write(0x45);
        roomba.write(0x00,0x01);
        roomba.write(255);
    }
    else if (c=="o") { // orange
        server.log("orange");
        roomba.write(139);
        roomba.write(0x45);
        roomba.write(0x01,0x01);
        roomba.write(255);
    }
    else { // off
        server.log("off");
        roomba.write(139);
        roomba.write(0x45);
        roomba.write(00);
        roomba.write(0x00);
    }
}

function drive(velocity, radius) {
  roomba.write(137);
  roomba.write((velocity & 0xff00) >> 8);
  roomba.write(velocity & 0xff);
  roomba.write((radius & 0xff00) >> 8);
  roomba.write(radius & 0xff);
}


function vacuumOn() {
  roomba.write(138);
  roomba.write(11);
  vacuumState=1;
}

function vacuumOff() {
  roomba.write(138);
  roomba.write(0x00);
  vacuumState=0;
}

function toggleVacuum() {
  if (vacuumState) {
    vacuumOff();
  }
  else {
    vacuumOn();
  }
}

function driveDir(d) {
    server.log("driving");
    server.log(d);
    if (d=="f") {
        drive(50,0);
        server.log("forward");
    }
    else if (d=="b") {
        drive(-50,0);
        server.log("back");
    }
    else if (d=="l") {
        drive(50,-10);
        server.log("left");
    }
    else if (d=="r") {
        drive(50,10);
        server.log("right");
    }
    // else if (d=="v") {
    //     toggleVacuum();
    //     server.log("toggling vacuum");
    // }
    else {
        drive(0,0);
        server.log("stop");
    }
}

roombaSetup();

agent.on("roomba.drive",driveDir)
agent.on("roomba.led", leds)

