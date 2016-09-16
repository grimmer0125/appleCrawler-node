# appleCrawler

[![Build Status](https://travis-ci.org/grimmer0125/appleCrawler-node.svg?branch=master)](https://travis-ci.org/grimmer0125/appleCrawler-node)

Use "request" + "cheerio" to grab the content of http://www.apple.com/tw/shop/browse/home/specialdeals/mac, then use Line to broadcast the information. Actually this project is more like a scraper but not change the repo name to keep the consistence.

## Steps for development:

1. (Optional) Install the latest version of Node.js from [https://nodejs.org/en/](https://nodejs.org/en/)
2. Go to the project root folder.
3. Type `npm install` to install npm dependencies.
4. (Optional) Change the enviornment PORT to what you want. This is the server's port and default is `5000`.
4. Setup credentials for Line Bot. Also you need to fill your server's Domain name to Line Developer Center so that your Line BOT can receive messages. Otherwise this Line bot only can send. It means your Local server/developement always can send messanges only. (Line server can not reach localhost) 
5. (Optional) Setup credentials forTwilio.
6. Setup Postgresql database. If you use Heroku on production, you can follow [https://devcenter.heroku.com/articles/getting-started-with-nodejs#provision-a-database](https://devcenter.heroku.com/articles/getting-started-with-nodejs#provision-a-database). Once you have setup, setup the enviorment DATABASE_URL to yours. E.g., postgres://yourPostgresURL. If you do not specify DATABASE_URL, it will look for the DB on the same machine and use login user account, since `"start": "DATABASE_URL=postgres:///$(whoami) node index.js"`. 
7. 6. Run `npm start` to launch the application.

## How to setup enviornment variable in Node.js, there are several ways. 
1. Unix/Linux way: use Export.
2. Package.json way: "start": "PORT=1234 node server.js",
3. Heroku way (need to use heroku local): [https://devcenter.heroku.com/articles/getting-started-with-nodejs#define-config-vars](https://devcenter.heroku.com/articles/getting-started-with-nodejs#define-config-vars)

## Fill the credentials of Line Bot API

~~~ javascript
const client = LineBot.client({
  channelID: '<your channel ID>',
  channelSecret: '<your channel secret>',
  channelMID: '<your channel MID>'
});
~~~

## (Optional) Fill the credentials of Twilio API (when reaching the maximal number of the friends of Line Bot, send the alarm)

~~~ javascript
const accountSid = 'Twilio Account SID';
const authToken = 'Twilio API Token';
const twilioClient = require('twilio')(accountSid, authToken);

twilioClient.messages.create({
    to: 'your phone number',
    from: 'your Twilio number',
    body: 'Line bot has problems !!',
  }, function (err, message) {
    console.log(message.sid);
  });
~~~  

##

## License

appleCrawler-node is released under the Apache 2.0 license.
