const db = require('../../lib/db');
var chai = require('chai');

chai.should();

// db.getAlluserIDs(userList => {
//   if (userList.length >= 500) {
//     sendLineBotAlert();
//   }
//   // console.log("allusers:",userList)
//   broadcastUpdatedInfo(userList, newMacs);
// });

// describe('User', function() {
//   describe('#save()', function() {
//     it('should save without error', function(done) {
//       var user = new User('Luna');
//       user.save(function(err) {
//         if (err) throw err;
//         done();
//       });
//     });
//   });
// });

// var assert = require('chai').assert;
describe('Test DB helpers', function() {
  describe('Get all user-ids', function() {
    it('should be an array', function(done) {

      db.getAlluserIDs(userList => {

        userList.should.be.a('array');

        // if (userList.length >= 500) {
        //   sendLineBotAlert();
        // }

        // console.log("allusers:",userList)
        // broadcastUpdatedInfo(userList, newMacs);
        done();
      });


      // assert.equal(-1, [1,2,3].indexOf(5));
      // assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});
