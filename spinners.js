// turns each spinner one at a time for the declared time limit

require('dotenv').config()

// ngrok stuff
const ngrok = require('ngrok');
(async function() {
  const url = await ngrok.connect({authtoken: process.env.NGROK_AUTH_TOKEN, addr:1337, subdomain:process.env.NGROK_SUBDOMAIN});
  // If you don't have a paid, you can use the following instead. Make sure you use the temporary subdomain in your Twilio number's SMS handler.
  // const url = await ngrok.connect({authtoken: process.env.NGROK_AUTH_TOKEN, addr:1337);
})();

// twilio stuff
const http = require('http');
const express = require('express');
const { urlencoded } = require('body-parser');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const Twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const app = express();
app.use(urlencoded({ extended: false }));
app.set('view engine','pug')

const commands=["l","r","s"]

app.post('/twilio', (req, res) => {
  let n = req.body.Body[0].toLowerCase();
  console.log(n);
  let twiml = new MessagingResponse()
  if (n) {
     if (commands.includes(n)) {
      twiml.message(`Sending command ${n}!`)
      // actually send to Electric Imp
      setSpinner(spinnerState,n)
    }
    else {
      twiml.message("Send commands to control the spinners!\n L: Spin Left\n R: Spin Right")
    } 
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

// also make an overlay you can put into OBS
app.get('/overlay-timer',(req, res)=> {
  res.render('spinner-overlay');
});

app.get('/current-time',(req,res)=>{
  res.send(`${spinnerState},${secondsInCountdown}`);
})

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});


// twitch stuff
const tmi = require('tmi.js');
// const http = require('http'); // since we already have this for the express stuff, we are commenting it out
// however, if copy-paste just the twitch code, you will need to uncomment it

const hostname=process.env.SPINNER_API_URL;
const port=443;

const args=process.argv;
const channelname=args[2];
const channel='#'+channelname;

const countdownTime=args[3];
var secondsInCountdown=countdownTime;
var spinnerState=1;
// 1: spin only 1
// 2 spin only 2
// 3 spin only 3

var countdown;

// Define configuration options
const opts = {
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [
    // 'tinychristine','twilio','twilioquest'
    channelname.toString()
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log("connecting to " + channel);
  console.log(`* Connected to ${addr}:${port}`);
  client.say(channel,`CONTROL THE SPINNERS UNTIL TIME RUNS OUT! Each spins one at a time. Write L or R to turn the spinner left or right.`);
  console.log("start countdown");
  countdown = setInterval(countdownLoop,1000); // Starts the game
}



// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim().toLowerCase();

  var a=commandName.split(' ')
  if (spinnerState) {
    if (a[0][0]==='l'||a[0][0]==='r'||a[0][0]==='s') {
      setSpinner(spinnerState,a[0][0]);
      console.log(commandName)
    }  
    else if (a[0]==='!help') {
      client.say(channel,`CONTROL THE SPINNERS UNTIL TIME RUNS OUT! Each spins one at a time. Write L or R to turn the spinner left or right.`);
    }
  }
}

// Spinner stuff

function setSpinner(n,d) {
  http.get(process.env.SPINNER_API_URL+'?dir='+n+','+d, res => {
    let data = ""

    res.on("data", d => {
      data += d
    })
    res.on("end", () => {
      console.log(data)
    })
  })
}

function stopAllSpinners() {
  console.log("stopping all spinners!!");
  client.say(channel,`Time's up!`);
  setSpinner(1,'s');
  setSpinner(2,'s');
  setSpinner(3,'s');
  // spinnerState=0;
}

// Game loops

function countdownLoop() {
  if (secondsInCountdown>5) {
    if (secondsInCountdown%5==0) {
      client.say(channel,`${secondsInCountdown} seconds left`);
    }
  }
  else {
    if (secondsInCountdown>0) {
      client.say(channel,`${secondsInCountdown} seconds left`);
    }
    else {
      stopAllSpinners();
      clearInterval(countdown);
      if (spinnerState==3) {
        spinnerState=0;
      }
      else {
        spinnerState++;
        console.log("switching to spinner "+spinnerState);
        secondsInCountdown=countdownTime;
        countdown = setInterval(countdownLoop,1000);
      }    
    }
  }
  secondsInCountdown--;
}
