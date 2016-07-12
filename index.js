'use strict';

require('newrelic');

// require the Twilio module and create a REST client
// Twilio Credentials
const accountSid = 'AC83651bf8e21c30b313a44ccb97db3688';
const authToken = 'ee7f411bf34d3424bc8cd4c934193079';
const twilioClient = require('twilio')(accountSid, authToken);

const moment = require('moment');
const equal = require('deep-equal');
const db = require('./lib/db');
const crawler = require('./lib/crawler');

const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
// var request = require('superagent');
const LineBot = require('line-bot-sdk');
const client = LineBot.client({
  channelID: '1472984528',
  channelSecret: 'ef0e7b0d4396b8a410ee0a04a5bdbf9d',
  channelMID: 'u21e6de33e562aaa212082702d3957721',
});

function sendLineBotAlert(){
  twilioClient.messages.create({
    to: '+886963052251',
  	from: "+12016279052",
    body: 'Line bot has problems !!',
  }, function(err, message) {
  	console.log(message.sid);
  });
}

function compareWithOldMacs(newMacs) {
  db.getAllappleInfo(macs => {
    if (equal(newMacs, macs)) {
      console.log('same macs');
    } else {
      console.log('old macs:', macs);

      // to udpate
      if (macs.length === 0) {
        console.log('try to insert apple info');
        db.insertAppleInfo(newMacs);
      } else {
        console.log('try to update apple info');
        db.updateAppleInfo(newMacs);
      }

      // for testing for xxx's line
      // sendBackMacInfoWhenAddingFriend('xxxx');

      // broadcast by line id, need to recover when not testing
      db.getAlluserIDs(userList => {
        if (userList.length >= 500) {
          sendLineBotAlert();
        }
        // console.log("allusers:",userList)
        broadcastUpdatedInfo(userList, newMacs);
      });
    }
  });
}
// console.log('broadcast to:'+'userMid;' + JSON.stringify(nameList));

function summaryInfoFromStoredMacs(linebackHandler, macs) {
  const action = (macList) => {
    let summaryStr = '蘋果特價品更新:' + '\n\n';

    const numberOfMacs = macList.length;
    for (let i = 0; i < numberOfMacs; i++) {
      const mac = macList[i];
      if (i === (numberOfMacs - 1)) {
        summaryStr += `${i + 1}. ${mac.specsTitle}. ${mac.price} http://www.apple.com${mac.specsURL}`;
      } else {
        summaryStr += `${i + 1}. ${mac.specsTitle}. ${mac.price} http://www.apple.com${mac.specsURL}` + '\n\n';
      }
    }
    console.log('new summary macs:', summaryStr);

    linebackHandler(summaryStr);
  };

  if (macs === null) {
    db.getAllappleInfo(finalMacs => {
      action(finalMacs);
    });
  } else {
    action(macs);
  }
}

function broadcastUpdatedInfo(userList, newMacs) {
  summaryInfoFromStoredMacs(macInfoString => {
    for (const user of userList) {
      console.log('broadcast to:' + user.id);
      client.sendText(user.id, macInfoString);
    }
  }, newMacs);
}

function sendBackMacInfoWhenAddingFriend(userMid) {
  summaryInfoFromStoredMacs(macInfoString => {
    console.log('send back to:' + userMid);
    client.sendText(userMid, macInfoString);
  }, null);
}

const app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false, limit: 2 * 1024 * 1024 }));
app.use(bodyParser.json({ limit: 2 * 1024 * 1024 }));

app.post('/callback', function (req, res) {
  console.log(req.body.result);

  var receives = client.createReceivesFromJSON(req.body);
  _.each(receives, function (receive) {
    const clientMid = receive.getFromMid();
    console.log('remote user:', clientMid);
    // if( midList.indexOf(clientMid) < 0 ){
    //   midList.push(clientMid);
    // }

    // no data
    // if(receive.isAddContact){
    //   console.log('is adding contact');
    // }else {
    //   console.log('is not adding contact');
    // }
    // console.log('type:', receive.getResult().content.opType);

    if (receive.isMessage()) {
      if (receive.isText()) {
        if (receive.getText() === 'me') {
          client.getUserProfile(receive.getFromMid())
            .then(function onResult(res) {
              if (res.status === 200) {
                var contacts = res.body.contacts;
                if (contacts.length > 0) {
                  client.sendText(receive.getFromMid(), 'Hi!, you\'re ' + contacts[0].displayName);
                }
              }
            }, function onError(err) {
              console.error(err);
            });
        } else {
          console.log('echo:' + clientMid + ';content:' + receive.getText());
          client.sendText(receive.getFromMid(), receive.getText());
        }
      } else if (receive.isImage()) {
        client.sendText(receive.getFromMid(), 'Thanks for the image!');
      } else if (receive.isVideo()) {
        client.sendText(receive.getFromMid(), 'Thanks for the video!');
      } else if (receive.isAudio()) {
        client.sendText(receive.getFromMid(), 'Thanks for the audio!');
      } else if (receive.isLocation()) {
        client.sendLocation(
            receive.getFromMid(),
            receive.getText() + receive.getAddress(),
            receive.getLatitude(),
            receive.getLongitude()
          );
      } else if (receive.isSticker()) {
        // This only works if the BOT account have the same sticker too
        client.sendSticker(
            receive.getFromMid(),
            receive.getStkId(),
            receive.getStkPkgId(),
            receive.getStkVer()
          );
      } else if (receive.isContact()) {
        client.sendText(receive.getFromMid(), 'Thanks for the contact');
      } else {
        console.error('found unknown message type');
      }

      // Todo: will change here
      sendBackMacInfoWhenAddingFriend(clientMid);
    } else if (receive.isOperation()) {
      console.log('found operation');

      // until 20160705, https://developers.line.me/bot-api/api-reference#receiving_operations
      // shows that there are 3 cases, add as a friend, block, canceling block,

      // for add as a friend case. should handle excluding the other cases later.

      // adding and block will both true , at least  for "line-bot-sdk": "^0.1.4"
      // if(receive.isAddContact){
      //   console.log('is adding contact');
      // }else {
      //   console.log('is not adding contact');
      // }
      // 4 : add or unblock, 8:block <- use this
      // console.log('type:', receive.getResult().content.opType);

      db.insertUserID(clientMid);
      sendBackMacInfoWhenAddingFriend(clientMid);
    } else {
      console.error('invalid receive type');
    }
  });

  res.send('ok');
});

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port'));
});

crawler.grabAppleData(compareWithOldMacs);

setInterval(function () {
  console.log('timer start');

  const currentHour = moment().utcOffset(8).hours();
  if (currentHour >= 8) {
    crawler.grabAppleData(compareWithOldMacs);
  }

  console.log('timer end');
}, 12 * 60 * 1000); // 15 min


process.on('SIGINT', function () {
  process.exit();
});
