const projectPath = process.cwd();
const deleteDir = require('rimraf');
const testTools = require('we-test-tools');
const path = require('path');
const We = require('we-core');

let we;

before(function(callback) {
  this.slow(100);

  testTools.copyLocalSQLiteConfigIfNotExists(projectPath, function() {
    we = new We();

    testTools.init({}, we);

    we.bootstrap({
      i18n: {
        directory: path.join(__dirname, 'locales'),
        updateFiles: true
      },
      themes: {
        enabled: [
          'we-theme-site-wejs'
        ],
        app: 'we-theme-site-wejs'
      }
    } , function (err, we) {
      if (err) {
        console.log('Error on bootstrap:', err);
        return callback(err);
      }

      if (!we.plugins['we-plugin-wembed-server'])
        we.plugins['we-plugin-wembed-server'] = we.plugins.project;

      we.startServer(function(err) {
        if (err) throw err;
        callback();
      });
    });
  });
});

//after all tests
after(function (callback) {
  we.db.defaultConnection.close();

  let tempFolders = [
    projectPath + '/files/config',
    projectPath + '/files/sqlite',
    projectPath + '/database.sqlite',

    projectPath + '/files/public/min',

    projectPath + '/files/public/project.css',
    projectPath + '/files/public/project.js',
    projectPath + '/config/local.js',
  ];

  we.utils.async.each(tempFolders, function(folder, next){
    deleteDir( folder, next);
  }, function(err) {
    if (err) throw new Error(err);
    callback();
  })

});


