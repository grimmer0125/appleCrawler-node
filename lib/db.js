var pg = require('pg');

console.log('pg_url:', process.env.DATABASE_URL);

exports.getAlluserIDs = function(handler){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    console.log('db: get all user ids');

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

exports.insertUserID = function(userID){
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

exports.getAllappleInfo = function(handler){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    if(err){
      console.log('can not connect,',err);
      return;
    }

    console.log('db: get All apple Info');

    client.query('SELECT product_info FROM special_product_table', function(err, result) {
      if (err) {
        console.error('get all apple info fail,'+err);
      } else {
        if(result.rows.length>0){
          // console.log('DB have non empty apple info');
          handler(result.rows[0].product_info)
        } else {
          console.log('DB have no apple info');

          handler([]);
        }
      }

      done();
    });
  });
}

// updateAppleInfo(); // for testing

exports.updateAppleInfo = function(info){
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

exports.insertAppleInfo = function(info){
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
