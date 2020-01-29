const path = require('path');

module.exports = {
  /**
   * Install function run in we.js site install.
   *
   * @param  {Object}   we    we.js object
   * @param  {Function} done  callback
   */
  install (we, done) {
    we.utils.async.series([
      function createTMPFolder (done) {
        let p = path.resolve(process.cwd(), 'files/tmp');
        we.utils.mkdirp(p, done);
      }
    ], done);
  }
};