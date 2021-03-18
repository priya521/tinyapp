const { assert } = require('chai');

const { emailLooker } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};


describe('emailLooker', function () {
  it('should return a user with valid email', function () {
      const user = emailLooker("user@example.com", testUsers)
      const expectedOutput = "userRandomID";
      assert.equal(user, expectedOutput);
  });
  it('should return undefined if email is not in database', function () {
      const user = emailLooker("123@123.com", testUsers);
      const expected = undefined;
      assert.equal(user, expected);
  })
});
