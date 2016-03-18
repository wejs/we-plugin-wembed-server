var mkdirp = require('mkdirp');

module.exports = {
  /**
   * Install function run in we.js site install.
   *
   * @param  {Object}   we    we.js object
   * @param  {Function} done  callback
   */
  install: function install(we, done) {
    we.utils.async.series([
      function createTMPFolder(done) {
        mkdirp('files/tmp/', done);
      }
    ], done);
  }
};