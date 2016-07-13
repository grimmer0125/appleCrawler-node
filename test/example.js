// const db = require('./lib/db');
//
// db.getAlluserIDs(userList => {
//   if (userList.length >= 500) {
//     sendLineBotAlert();
//   }
//   // console.log("allusers:",userList)
//   broadcastUpdatedInfo(userList, newMacs);
// });


var assert = require('chai').assert;
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});
