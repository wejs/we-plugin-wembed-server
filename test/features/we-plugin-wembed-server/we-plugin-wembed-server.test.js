var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;
var agent;

describe('we-plugin-wembed-serverFeature', function() {
  var salvedUser, salvedUserPassword, authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      // login user and save the browser
      authenticatedRequest = request.agent(http);
      authenticatedRequest.post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err) {
        done(err);
      });
    })
  });

  describe('API', function () {
    it ('get /api/v1/json?url=https://www.youtube.com/watch?v=1G4isv_Fylg should '+
      'get data and save in db', function (done) {

      request(http)
      .get('/api/v1/json?url=https://www.youtube.com/watch?v=1G4isv_Fylg')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          console.error(res.text);
          throw err;
        }

        assert(res.body.wembed.images.length <= 3);

        we.utils.async.eachSeries(res.body.wembed.images, function (r, next) {

          request(http)
          .get(r.urls.original.replace(we.config.hostname, ''))
          .expect(200)
          .end(function (err, res) {
            if (err) {
              we.log.error(res.text);
              return next(err);
            }

            next();
          });
        }, done);
      });
    });

    it ('get /api/v1/embed?url=https://www.youtube.com/watch?v=1G4isv_Fylg should get embed in html', function (done) {

      request(http)
      .get('/api/v1/embed?url=https://www.youtube.com/watch?v=1G4isv_Fylg')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          console.error(res.text);
          throw err;
        }

        assert(res.text);
        assert(res.text.indexOf('www.youtube.com') > -1);

        done();
      });
    });
  });
});