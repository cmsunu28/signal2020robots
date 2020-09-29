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

app.post('/om', (req, res) => {
  let n = req.body.Body[0].toLowerCase();
  console.log(n);
  let twiml = new MessagingResponse()
  if (n) {
     if (commands.includes(n)) {
      twiml.message(`Sending command ${commandTranslator[n]}!`)
      // actually send to Electric Imp
      driveRoomba(om,commandTranslator[n]);
    }
    else {
      driveRoomba(om,'s');
      twiml.message("Send commands to control Nom the Robot!\n L: Turn Left\n R: Turn Right\n F: Go forward\n B: Go backwards\nYou can also use WASD.")
    }
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});


app.post('/nom', (req, res) => {
  let n = req.body.Body[0].toLowerCase();
  console.log(n);
  let twiml = new MessagingResponse()
  if (n) {
     if (commands.includes(n)) {
      twiml.message(`Sending command ${commandTranslator[n]}!`)
      // actually send to Electric Imp
      driveRoomba(nom,commandTranslator[n]);
    }
    else {
      driveRoomba(nom,'s');
      twiml.message("Send commands to control Nom the Robot!\n L: Turn Left\n R: Turn Right\n F: Go forward\n B: Go backwards\nYou can also use WASD.")
    }
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

// also make an overlay you can put into OBS

app.get('/current-time',(req,res)=>{
  res.send(`BOTH ROBOTS,${secondsInCountdown}`);
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

const om=process.env.ROOMBA_OM_API_URL;
const nom=process.env.ROOMBA_NOM_API_URL;

const args=process.argv;

const countdownTime=args[2];
var secondsInCountdown=countdownTime;
var roombaState=1;
// 1: game is on
// 2: game is not on

var countdown;

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
  if (secondsInCountdown<=0) {
    driveRoomba(om,'s');
    driveRoomba(nom,'s');
    roombaState=0;
    clearInterval(countdown);
  }
  secondsInCountdown--;
}



console.log("start countdown");
countdown = setInterval(countdownLoop,1000); // Starts the game
