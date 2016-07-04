require('newrelic');
var equal = require('deep-equal');
var Nightmare = require('nightmare');

var _ = require('lodash');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('superagent');
var LineBot = require('line-bot-sdk');
var client = LineBot.client({
  channelID: '1472984528',
  channelSecret: 'ef0e7b0d4396b8a410ee0a04a5bdbf9d',
  channelMID: 'u21e6de33e562aaa212082702d3957721'
});

// var nameList = ['jhon','fill','vikash','jammy','tumblr','kamal'];
// console.log(nameList.indexOf( 'kamal' )); // Print 5

const midList = [];
var macs = [];

// console.log('broadcast to:'+'userMid;' + JSON.stringify(nameList));

function broadcastUpdatedInfo(){
  const macInfoString = JSON.stringify(macs);
  for (const userMid of midList){
    console.log('broadcast to:'+ userMid +";info:"+macInfoString);
    client.sendText(userMid, macInfoString);
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
    if( midList.indexOf(clientMid) < 0 ){
      midList.push(clientMid);
    }

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

      sendBackMacInfoWhenAddingFriend(clientMid);

    }else if(receive.isOperation()){

      console.log('found operation');

      // until 20160705, https://developers.line.me/bot-api/api-reference#receiving_operations
      // shows that there are 3 cases, add as a friend, block, canceling block,

      // for add as a friend case. should handle excluding the other cases later.
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

// below is crawler part
let nightmare = Nightmare({
  openDevTools: true,
  // show: true
});

function grabAppleData(){
  nightmare
    .goto('http://www.apple.com/tw/shop/browse/home/specialdeals/mac')
    .wait('.refurb-list')
    .evaluate(function () {

      const newMacs = [];

      let tables = document.querySelectorAll(".refurb-list .box-content table");
      for (const table of tables){
        const firstRow = table.querySelector(".product");

        const imageColumn = firstRow.querySelector(".image img");
        const imageSrc = imageColumn.src;

        const specsTotalColumn = firstRow.querySelector(".specs"); //how to remove title part ?
        const specsTotalDesc = specsTotalColumn.innerText;
        // const specsTitleColumn = firstRow.querySelector(".specs a");
        // const specsTitle = specsTitleColumn .innerText;

        const purchaseInfoColumn = firstRow.querySelector(".purchase-info .price"); //multiple span?
        const price = purchaseInfoColumn.innerText;

        const mac = {imageURL:imageSrc, specs:specsTotalDesc, price};

        newMacs.push(mac);
      }

      // here is in brwoser/window scope, can not access macs

      return newMacs;

    })
    // .end()
    .then(function (result) {

      if(equal(result, macs)){
        console.log('same macs');
      }else {
        console.log('old macs:', macs)

        console.log('not the same, new macs:',result);

        macs = result;

        //broadcast by line id
        broadcastUpdatedInfo();
      }
    })
    .catch(function (error) {
      console.error('Search failed:', error);
    });
}

grabAppleData();

setInterval(function(){
  console.log('start');

  grabAppleData();

  // test2後的下一次出現test1 等超過10s !!!, even if interval = 5*1000
  // var seconds = 10;
  // var waitTill = new Date(new Date().getTime() + seconds * 1000);
  // while(waitTill > new Date())
  // {
  //
  // }

  console.log('end');
}, 15 * 60* 1000); //15 min

process.on('SIGINT', function() {
  process.exit();
});
