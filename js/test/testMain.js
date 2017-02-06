var chai = require("chai");
var expect = chai.expect;
var nock = require("nock");

var main = require("../main.js");

// Load mock data
var data = require("../mock.json")

///////////////////////////
// TEST SUITE FOR MOCHA
///////////////////////////

describe('testMain', function(){

  // MOCK SERVICE
  var mockService = nock("https://api.github.com")
    .persist() // This will persist mock interception for lifetime of program.
    .get("/repos/testuser/Hello-World/issues")
    .reply(200, JSON.stringify(data.issueList) );

  describe('#findMostFrequentAssignee()', function(){
    // TEST CASE
   	it('should return valid object properties', function(done) {

      main.findMostFrequentAssignee("testuser", "Hello-World").then(function (results)
      {
        expect(results).to.have.property("userName");
        expect(results).to.have.property("count");

        var userName = results.userName;
        var count    = results.count;

        // Call back to let mocha know that test case is done. Need this for asychronous operations.
        done();
      });
    });

    // TEST CASE...
    it('should find octocat with 4 issues assigned', function() {
      // it is also possible to just return a promise, without using done.
      return main.findMostFrequentAssignee("testuser", "Hello-World").then(function (results)
      {
        expect(results.userName).to.equal("octocat");
        expect(results.count).to.equal(4);
      });
    });
  });

  describe('#closedCount()', function() {

    it('should find 4 closed issues', function() {
      return main.countClosed("testuser", "Hello-World").then(function (results)
      {
        expect(results).to.equal(4);
      });
    });

  });

  describe('#titleBodyWordCountRatio()', function() {

    var issue0 = nock("https://api.github.com")
      .get("/repos/testuser/Hello-World/issues/0")
      .reply(200, JSON.stringify(data.issueList[0]) );

    it('ration should be .5 for issue #0', function() {
      return main.titleBodyWordCountRatio("testuser", "Hello-World",0).then(function (results)
      {
        expect(results).to.equal("0.5");
      });
    });

    it('should handle empty body for issue #2', function() {
      return main.titleBodyWordCountRatio("testuser", "Hello-World",2).then(function (results)
      {
        expect(results).to.equal("NA");
      });
    });


  });
});
