"use strict";

require('newrelic');
var pg = require('pg');
var equal = require('deep-equal');
// var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var request = require('request');

var _ = require('lodash');
var bodyParser = require('body-parser');
var express = require('express');
// var request = require('superagent');
var LineBot = require('line-bot-sdk');
var client = LineBot.client({
  channelID: '1472984528',
  channelSecret: 'ef0e7b0d4396b8a410ee0a04a5bdbf9d',
  channelMID: 'u21e6de33e562aaa212082702d3957721'
});

var macs = [];

function compareWithOldMacs(newMacs){

  if(equal(newMacs, macs)){
    console.log('same macs');
  }else {
    console.log('old macs:', macs)

    console.log('not the same, new macs:', JSON.stringify(newMacs));

    macs = newMacs;

    //broadcast by line id

    getAlluserIDs(userList=>{
      console.log("allusers:",userList)
      broadcastUpdatedInfo(userList);
    });
  }
}
// console.log('broadcast to:'+'userMid;' + JSON.stringify(nameList));

function broadcastUpdatedInfo(userList){
  const macInfoString = JSON.stringify(macs);
  for (const user of userList){
    console.log('broadcast to:'+ user.id +";info:"+macInfoString);
    client.sendText(user.id, macInfoString);
  }
}

function sendBackMacInfoWhenAddingFriend(userMid){
  const macInfoString = JSON.stringify(macs);
  console.log('send back to:'+ userMid +";info:"+macInfoString);
  client.sendText(userMid, macInfoString);
}

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false, limit: 2 * 1024 * 1024 }));
app.use(bodyParser.json({ limit: 2 * 1024 * 1024 }));

app.post('/callback', function (req, res) {
  console.log(req.body.result);

  var receives = client.createReceivesFromJSON(req.body);
  _.each(receives, function(receive){

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

    if(receive.isMessage()){

      if(receive.isText()){

        if(receive.getText()==='me'){
          client.getUserProfile(receive.getFromMid())
            .then(function onResult(res){
              if(res.status === 200){
                var contacts = res.body.contacts;
                if(contacts.length > 0){
                  client.sendText(receive.getFromMid(), 'Hi!, you\'re ' + contacts[0].displayName);
                }
              }
            }, function onError(err){
              console.error(err);
            });
        } else {
          console.log('echo:'+ clientMid + ";content:"+receive.getText());
          client.sendText(receive.getFromMid(), receive.getText());
        }

      }else if(receive.isImage()){

        client.sendText(receive.getFromMid(), 'Thanks for the image!');

      }else if(receive.isVideo()){

        client.sendText(receive.getFromMid(), 'Thanks for the video!');

      }else if(receive.isAudio()){

        client.sendText(receive.getFromMid(), 'Thanks for the audio!');

      }else if(receive.isLocation()){

        client.sendLocation(
            receive.getFromMid(),
            receive.getText() + receive.getAddress(),
            receive.getLatitude(),
            receive.getLongitude()
          );

      }else if(receive.isSticker()){

        // This only works if the BOT account have the same sticker too
        client.sendSticker(
            receive.getFromMid(),
            receive.getStkId(),
            receive.getStkPkgId(),
            receive.getStkVer()
          );

      }else if(receive.isContact()){

        client.sendText(receive.getFromMid(), 'Thanks for the contact');

      }else{
        console.error('found unknown message type');
      }

      // Todo: will change here
      sendBackMacInfoWhenAddingFriend(clientMid);

    }else if(receive.isOperation()){

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
      //4 : add or unblock, 8:block
      // console.log('type:', receive.getResult().content.opType);

      insertUserID(clientMid);
      sendBackMacInfoWhenAddingFriend(clientMid);

    }else {

      console.error('invalid receive type');

    }

  });

  res.send('ok');
});

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port'));
});

grabAppleData();

setInterval(function(){
  console.log('start');

  grabAppleData();

  console.log('end');
}, 12 * 60* 1000); //15 min

process.on('SIGINT', function() {
  process.exit();
});

function grabAppleData(){

  request({
      method: 'GET',
      url: 'http://www.apple.com/tw/shop/browse/home/specialdeals/mac'
  }, function(err, response, body) {
      if (err) {
        return console.error(err);
      }

      var $ = cheerio.load(body);

      const newMacs = [];

      $('.refurb-list .box-content table').each(function(i, elem) {

        const firstRow = $(this).find('.product');

        const imageColumn = firstRow.find(".image img");
        const imageSrc = imageColumn.attr('src');

        const specsTitleColumn = firstRow.find(".specs h3");
        let specsTitleDesc = specsTitleColumn.text();
        specsTitleDesc  = specsTitleDesc.trim();
        // console.log('title desc:' + specsTitleDesc+";end;");

        const specsTotalColumn = firstRow.find(".specs");
        let specsTotalDesc = specsTotalColumn.text();
        // console.log('before desc:' + specsTotalDesc +";end;");
        let specsDetailDesc  = specsTotalDesc.replace(specsTitleDesc,'');
        specsDetailDesc = specsDetailDesc.trim();
        // console.log('desc detail:'+specsDetailDesc+";end;");

        const purchaseInfoColumn = firstRow.find(".purchase-info .price");
        let price = purchaseInfoColumn.text();
        price = price.trim();

        const mac = {imageURL:imageSrc, specsTitle: specsTitleDesc , specsDetail:specsDetailDesc, price};

        newMacs.push(mac);

      });

      compareWithOldMacs(newMacs);

  });
}

console.log('pg_url:', process.env.DATABASE_URL);

getAlluserIDs(s=>console.log("all user:",s));

function getAlluserIDs(handler){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    client.query('SELECT id FROM apple_table', function(err, result) {
      if (err) {
        console.error(err); //response.send("Error " + err);
      } else {
        // if(result.rows.length>0){
        //   console.log('first user:', result.rows[0]); // anonymous { id: 'abc' }?? node 6.x bug
        // }
        // response.render('pages/db', {results: result.rows} );
        handler(result.rows)
      }
    });
  });
}

function insertUserID(userID){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    // try insert
    client.query(`INSERT INTO apple_table(id) VALUES('${userID}')`, function(err, result) {

      if (err) {
        console.error(err); //response.send("Error " + err);
      } else {
        console.log('insert ok');
      }

      done();

    });
  });
}
