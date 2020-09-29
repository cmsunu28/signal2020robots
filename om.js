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

const commands=["l","r","f","b","w","a","s","d"]
const commandTranslator={
  "w":"f",
  "a":"l",
  "s":"b",
  "d":"r",
  "f":"f",
  "b":"b",
  "l":"l",
  "r":"r"
}
let newCommands=[];

app.post('/twilio', (req, res) => {
  let n = req.body.Body[0].toLowerCase();
  console.log(n);
  let twiml = new MessagingResponse()
  if (n) {
     if (commands.includes(n)) {
      twiml.message(`Sending command ${commandTranslator[n]}!`)
      // actually send to Electric Imp
      driveRoomba(hostname,commandTranslator[n]);
    }
    else {
      twiml.message("Send commands to control Nom the Robot!\n L: Turn Left\n R: Turn Right\n F: Go forward\n B: Go backwards\nYou can also use WASD.")
    }
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

// also make an overlay you can put into OBS

app.get('/current-time',(req,res)=>{
  res.send(`${robotName},${secondsInCountdown}`);
})

app.get('/current-commands',(req,res)=>{
  res.send(newCommands.toString());
  newCommands=[];
})

app.get('/overlay-timer',(req, res)=> {
  res.render('roomba-overlay');
});

app.get('/overlay-commands',(req, res)=> {
  res.render('roomba-commands');
});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});


// twitch stuff
const tmi = require('tmi.js');
// const http = require('http'); // since we already have this for the express stuff, we are commenting it out
// however, if copy-paste just the twitch code, you will need to uncomment it

const hostname=process.env.ROOMBA_OM_API_URL;
const port=443;

const args=process.argv;
const channelname=args[2];
const robotName=args[3];
const channel='#'+channelname;

const countdownTime=args[4];
var secondsInCountdown=countdownTime;
var roombaState=1;
// 1: game is on
// 2: game is not on

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
  client.say(channel,`DRIVE THE ROBOT UNTIL TIME RUNS OUT! You can write F, L, B, R for forward, left, back, and right. WASD will also work.`);
  console.log("start countdown");
  countdown = setInterval(countdownLoop,1000); // Starts the game
}



// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim().toLowerCase();

  var a=commandName.split(' ')
  if (roombaState) {
    let n=a[0][0];
    if (commands.includes(n)) {
      driveRoomba(hostname,commandTranslator[n]);
      console.log(n)
    }
    else {
      driveRoomba(hostname,'s');
    }
    if (a[0]==='!help') {
      client.say(channel,`DRIVE THE ROBOT UNTIL TIME RUNS OUT! You can write F, L, B, R for forward, left, back, and right. WASD will also work.`);
    }
  }
}

// roomba stuff

function driveRoomba(url,n) {
  newCommands.push(n);
  http.get(url+'?drive='+n, res => {
    let data = ""

    res.on("data", d => {
      data += d
    })
    res.on("end", () => {
      console.log(data)
    })
  })
}

function countdownLoop() {
  if (secondsInCountdown>10) {
    if (secondsInCountdown%5==0) {
      client.say(channel,`${secondsInCountdown} seconds left`);
    }
  }
  else {
    if (secondsInCountdown>0) {
      client.say(channel,`${secondsInCountdown} seconds left`);
    }
    else {
      driveRoomba(hostname,'s');
      roombaState=0;
      clearInterval(countdown);
    }
  }
  secondsInCountdown--;
}
