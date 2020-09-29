// selects X volunteer names from all the people who write !volunteer


require('dotenv').config()
const tmi = require('tmi.js');
const http = require('http');

const port=443; // for twitch


// ngrok stuff
const ngrok = require('ngrok');
(async function() {
  const url = await ngrok.connect({authtoken: process.env.NGROK_AUTH_TOKEN, addr:1337, subdomain:process.env.NGROK_SUBDOMAIN});
  // If you don't have a paid, you can use the following instead. Make sure you use the temporary subdomain in your Twilio number's SMS handler.
  // const url = await ngrok.connect({authtoken: process.env.NGROK_AUTH_TOKEN, addr:1337);
})();

// server stuff
const express = require('express');
const { urlencoded } = require('body-parser');

const app = express();
app.use(urlencoded({ extended: false }));
app.set('view engine','pug')

// also make an overlay you can put into OBS
app.get('/overlay-vote-count',(req, res)=> {
  res.render('vote-count'); // shows the number of people for team teamName  and the countdown
});

app.get('/overlay-vote-members',(req, res)=> {
  res.render('vote-members'); // shows the actual people for team teamName 
});

app.get('/overlay-vote-winners',(req, res)=> {
  res.render('vote-winners'); // shows the winners pulled from teamName 
});

app.get('/vote-count',(req,res)=>{
  res.send(`${teamName},${allVolunteers.length},${secondsInCountdown}`);
})

app.get('/vote-members',(req,res)=>{
  res.send(`${teamName},${allVolunteers.toString()}`);
})

app.get('/vote-winners',(req,res)=>{
  res.send(`${teamName},${winners.toString()}`);
})

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});


const args=process.argv;
const channelname=args[2];
const channel='#'+channelname;

var teamName=args[3];
var secondsInCountdown=args[4];
var numberOfVolunteers=args[5];

var winners=[];

var allVolunteers=[];

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

// function registerAndConnect() {
  // Create a client with our options
  const client = new tmi.client(opts);

  // Register our event handlers (defined below)
  client.on('message', onMessageHandler);
  client.on('connected', onConnectedHandler);

  // Connect to Twitch:
  client.connect();
// }

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log("connecting to " + channel);
  console.log(`* Connected to ${addr}:${port}`);
  client.say(channel,`Type "!team ${teamName}" if you support team ${teamName}`);
  console.log("start countdown");
  countdown = setInterval(countdownLoop,1000);
}


// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim().toLowerCase();

  if (commandName[0] === '!') {
    var a=commandName.split(' ')
    if (a[0]==='!team' && a[1].toLowerCase()===teamName.toLowerCase()) {
      allVolunteers.push(context.username);
      console.log(context.username);
    }
  } 
}

function updateWinners(n,a) {
  if (a.length>0) {
    if (n>=a.length) {
      for (var x=0;x<a.length;x++) {
        // client.say(channel,`We have selected ${a[x]}`);
        // instead of this, update the endpoint
        console.log(a[x]);
        winners.push(a[x]);
      }
    }
    else {
      for (var x=0;x<n;x++) {
        let r=Math.floor(Math.random()*a.length);
        // client.say(channel,`We have selected ${a[r]}`);
        winners.push(a[r])
      }
      // update the endpoint with winnerArray as a string
      console.log('winners:');
      console.log(winners);
    }
  }
  else {
    console.log('no supporters');
    client.say(channel,`No one wanted to support team ${teamName} :(`);
  }

}

function countdownLoop() {
  if (secondsInCountdown>10) {
    if (secondsInCountdown%5==0) {
      client.say(channel,`${secondsInCountdown} seconds left`);
    }
  }
  else {
    if (secondsInCountdown>=0) {
      client.say(channel,`${secondsInCountdown} seconds left`);
    }
    else {
      client.say(channel,`Time's up!`);
      console.log('voted: ');
      console.log(allVolunteers);
      console.log(allVolunteers.length);
      updateWinners(numberOfVolunteers,allVolunteers);
      clearInterval(countdown);
    }
  }
  secondsInCountdown--;
}
