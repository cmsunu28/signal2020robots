imp.enableblinkup(true);

// These constants may be different for your servo
const SERVO_MIN = 0.03;
const SERVO_MAX = 0.1;

// unique servo l/r/s positions
const SERVO_L = 0.5;
const SERVO_R = 0.7;
const SERVO_0 = 0.6;

local scaledStop = SERVO_0 * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;

// Create global variable for the pin to which the servo is connected
// then configure the pin for PWM
servo1 <- hardware.pin7;
servo1.configure(PWM_OUT, 0.02, SERVO_MIN);

servo2 <- hardware.pin8;
servo2.configure(PWM_OUT, 0.02, SERVO_MIN);

servo3 <- hardware.pin9;
servo3.configure(PWM_OUT, 0.02, SERVO_MIN);


// Define a function to control the servo.
// Just go a little bit around
function setServo1(value) {
    local scaledValue = value * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;
    servo1.write(scaledValue);
    imp.sleep(0.05);
    servo1.write(scaledStop);
}
function setServo2(value) {
    local scaledValue = value * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;
    servo2.write(scaledValue);
    imp.sleep(0.05);
    servo1.write(scaledStop);
}
function setServo3(value) {
    local scaledValue = value * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;
    servo3.write(scaledValue);
    imp.sleep(0.05);
    servo1.write(scaledStop);
}

// these make it go around and around
function setServo1cont(value) {
    local scaledValue = value * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;
    servo1.write(scaledValue);
}
function setServo2cont(value) {
    local scaledValue = value * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;
    servo2.write(scaledValue);
}
function setServo3cont(value) {
    local scaledValue = value * (SERVO_MAX - SERVO_MIN) + SERVO_MIN;
    servo3.write(scaledValue);
}

function dirServo(sv) {
    local a=split(sv,",");
    local v=0.6;
    if (a[1]=="l") {
        v=0.7;
    }
    else if (a[1]=="r") {
        v=0.5;
    }
    if (a[0]=="1") {
        server.log("1: "+v);
        setServo1(v.tofloat());
    }
    else if (a[0]=="2") {
        server.log("2: "+v);
        setServo2(v.tofloat());
    }
    else if (a[0]=="3") {
        server.log("3: "+v);
        setServo3(v.tofloat());
    }

}


setServo1(SERVO_0);
setServo2(SERVO_0);
setServo3(SERVO_0);

agent.on("set.servo", setServo2);
agent.on("dir.servo", dirServo)
