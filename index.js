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

// var macs = [];

function compareWithOldMacs(newMacs){

  getAllappleInfo(macs=>{
    if(equal(newMacs, macs)){
      console.log('same macs:', macs);
    }else {
      console.log('old macs:', macs)

      //to udpate
      if(macs.length==0){
        console.log('try to insert apple info');
        insertAppleInfo(newMacs);
        // need to insert
      } else {
        console.log('try to update apple info');
        udpateAppleInfo(newMacs);
      }

      // for testing for xxx's line
      // sendBackMacInfoWhenAddingFriend('xxxx');

      //broadcast by line id, need to recover when not testing
      getAlluserIDs(userList=>{
        // console.log("allusers:",userList)
        broadcastUpdatedInfo(userList, newMacs);
      });
    }
  });
}
// console.log('broadcast to:'+'userMid;' + JSON.stringify(nameList));

function summaryInfoFromStoredMacs(linebackHandler, macs ){

  const action = (macList)=>{
    let summaryStr = `蘋果特價品更新:`+'\n\n';

    const numberOfMacs = macList.length;
    for (let i =0; i<numberOfMacs; i++){
      const mac = macList[i];
      summaryStr += `${i+1}. ${mac.specsTitle}. ${mac.price} http://www.apple.com${mac.specsURL}`+'\n\n';
    }
    console.log('new summary macs:', summaryStr);

    linebackHandler(summaryStr);
  };

  if(macs === null){
    getAllappleInfo(finalMacs=>{
      action(finalMacs);
    });
  }else {
    action(macs);
  }
}

function broadcastUpdatedInfo(userList, newMacs){
  summaryInfoFromStoredMacs(macInfoString=>{
    for (const user of userList){
      console.log('broadcast to:'+ user.id);
      client.sendText(user.id, macInfoString);
    }
  }, newMacs);
}

function sendBackMacInfoWhenAddingFriend(userMid){
  summaryInfoFromStoredMacs(macInfoString=>{
    console.log('send back to:'+ userMid);
    client.sendText(userMid, macInfoString);
  }, null);
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

        const specsURLColumn = firstRow.find(".specs h3 a");
        let specsURL = specsURLColumn.attr('href');
        // console.log('url:', specsURL);
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

        const mac = {imageURL:imageSrc, specsURL, specsTitle: specsTitleDesc , specsDetail:specsDetailDesc, price};

        newMacs.push(mac);

      });

      compareWithOldMacs(newMacs);

  });
}

console.log('pg_url:', process.env.DATABASE_URL);

// getAlluserIDs(s=>console.log("all user:",s));

function getAlluserIDs(handler){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    client.query('SELECT id FROM user_table', function(err, result) {
      if (err) {
        console.error('get all user id fail:'+err); //response.send("Error " + err);
      } else {
        // if(result.rows.length>0){
        //   console.log('first user:', result.rows[0]); // anonymous { id: 'abc' }?? node 6.x bug
        // }
        // response.render('pages/db', {results: result.rows} );
        handler(result.rows)
      }

      done();
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
    //`` means string
    client.query(`INSERT INTO user_table(id) VALUES('${userID}')`, function(err, result) {

      if (err) {
        console.error('insert user id fail:'+err); //response.send("Error " + err);
      } else {
        console.log('insert ok');
      }

      done();

    });
  });
}

function getAllappleInfo(handler){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    client.query('SELECT product_info FROM special_product_table', function(err, result) {
      if (err) {
        console.error('get all apple info fail,'+err);
      } else {

        handler(result.rows)
      }

      done();
    });
  });
}

// udpateAppleInfo(); // for testing

function udpateAppleInfo(info){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    const infoJSONStr = JSON.stringify(info);

    client.query(`UPDATE special_product_table SET product_info = '${infoJSONStr}'`, function(err, result) {

      if (err) {
        console.error('update info fail:',err);
      } else {
        // console.log('update info ok');
        // handler();
      }

      done();
    });
  });
}

function insertAppleInfo(info){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    const infoJSONStr = JSON.stringify(info);

    client.query(`INSERT INTO special_product_table(product_info) VALUES('${infoJSONStr}')`, function(err, result) {
      if (err) {
        console.error('insert info fail:',err);
      } else {
        // console.log('update info ok');
        // handler();
      }

      done();
    });
  });
}
