/**
 * Plugin.js file, set configs, routes, hooks and events here
 *
 * see http://wejs.org/docs/we/plugin
 */
const fs = require('fs'),
  path = require('path'),
  request = require('request'),
  cheerio = require('cheerio'),
  uuid = require('uuid'),
  gm = require('gm'),
  mime = require('mime'),
  rmdir = require('rimraf');

const urlService = require('./lib/urlService');

module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

  const we = plugin.we;

  // set plugin configs
  plugin.setConfigs({
    wembed: {
      refreshTime: 3600000,
      filesPath: 'files/public/wembed/images/',
      image: {
        width: 200,
        height: 200,
      }
    }
  });

  // ser plugin routes
  plugin.setRoutes({
    'get /api/v1/:wembedType(embed|json)': {
      controller: 'wembed',
      action: 'getEmbed',
      model: 'wembed',
      permission: true
    }
  });

  plugin.getWembedSucessReponse = function getWembedSucessReponse(req, res) {
    let wembedType = req.params.wembedType;

    // force use of the cors  *
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (wembedType === 'json') {
      return res.send({ wembed: res.locals.data } );
    } else {
      let image;

      if (res.locals.data.dataValues.images && res.locals.data.dataValues.images[0]) {
        image = res.locals.data.dataValues.images[0].toJSON();
      }

      res.send(req.we.view.renderTemplate('wembed/embed', null, {
        page: res.locals.data,
        image: image,
        locals: res.locals,
        we: req.we
      }));
    }
  }

  /**
  * get data and register one page
  */
  plugin.registerPage = function registerPage(req, res, siteUrl, doneCallback) {
    getPageHtml(siteUrl, function (err, $, domain) {
      if (err) {
        we.log.error('Error on getPageHtml:',err);
        return res.notFound('Cant get this page');
      }

      let headTag = $('head');

      let data = {};
      data.title = plugin.getPageTitle(headTag);
      data.description = plugin.getPageDescription($);
      data.url = siteUrl;
      data.cacheTime = new Date();
      data.domain = domain;
      data.images = [];

      let pageUrlMetadata = urlService.getMetadataFromUrl(siteUrl);
      data.provider = pageUrlMetadata.provider;
      data.pageId = pageUrlMetadata.pageId;
      data.pageType = pageUrlMetadata.type;

      let pageRecord;

      req.we.utils.async.series([
        function createPage(done) {
          // save the page on db
          req.we.db.models.wembed
          .create(data)
          .then(function (page) {
            pageRecord = page;
            done();
          })
          .catch((err)=> {
            console.log(err);
            we.log.error('Error on create page:', {
              error: err
            });

            done(err);
          });
        },

        function createDir(done) {
          // create one folder to this page
          let p = path.resolve(we.config.wembed.filesPath, String(pageRecord.id));
          we.utils.mkdirp(p, done);
        },

        function getPageImages(done) {
          // download and save images on db
          plugin.getPageImages($, pageRecord, function (err, imagesRecords) {
            if (err) return done(err);

            pageRecord.addImages(imagesRecords)
            .then(function(){

              imagesRecords.forEach(function (i) {
                i.wembedId = pageRecord.id;
              });

              pageRecord.dataValues.images = imagesRecords;
              done();
            })
            .catch((err)=> {
              plugin.we.log.error('Error on save images:', {
                error: err
              });

              done(err);
            });
          });
        }
      ], function (err) {
        doneCallback(err, pageRecord);
      })
    });
  }

  plugin.updatePage = function updatePage(req, res, pageRecord, doneCallback) {
    const plugin = req.we.plugins['we-plugin-wembed-server'],
      we = req.we;

    let pageFolder = we.config.wembed.filesPath + pageRecord.id;

    // empty the dir
    plugin.emptyDir(pageFolder, function (err) {
      if (err) return doneCallback(err);

      getPageHtml(pageRecord.url, function (err, $) {
        let headTag = $('head');

        pageRecord.title = plugin.getPageTitle(headTag);
        pageRecord.description = plugin.getPageDescription($);
        pageRecord.cacheTime = new Date();

        let pageUrlMetadata = urlService.getMetadataFromUrl(pageRecord.url);
        pageRecord.provider = pageUrlMetadata.provider;
        pageRecord.pageId = pageUrlMetadata.pageId;
        pageRecord.pageType = pageUrlMetadata.type;

        plugin.we.utils.async.series([
          function removeOldImages(done) {
            if (!pageRecord.images) return done();

            pageRecord.removeImages( pageRecord.images )
            .then(function(){
              pageRecord.images = null;
              done();
            })
            .catch(done);
          },
          function (done) {
            // download and save new images
            plugin.getPageImages($, pageRecord, function (err, imagesRecords) {
              if (err) return done(err);
              if (!imagesRecords) return done();
              // get image ids to save in page
              pageRecord.addImages(imagesRecords)
              .then(function () {

                imagesRecords.forEach(function (i) {
                  i.wembedId = pageRecord.id;
                });

                pageRecord.dataValues.images = imagesRecords;
                done();
              }).catch(done);
            });
          },
          function (done) {
            pageRecord.save()
            .then(function() {
              done(null);
            })
            .catch(done);
          }
        ], function (err) {
          doneCallback(err, pageRecord);
        })
      });
    });
  }

  function getPageHtml(url, callback){
    let options = getRequestOptions(url);
    request(options, function (error, response, html) {
      if(error){
        return callback(error);
      }
      callback(null, cheerio.load(html), response.request.uri.host);
    });
  }

  plugin.emptyDir = function emptyDir(dir, callback) {
    rmdir(dir,function (err) {
      if (err) return callback(err);
      we.utils.mkdirp(dir, callback);
    });
  };

  plugin.getPageTitle = function getPageTitle(headTag){
    let title = headTag.find('meta[property="og:title"]').attr('content');
    if (title) return title;

    title = headTag.find('title').text();

    return title;
  }

  plugin.getPageDescription = function getPageDescription($){
    let description = $('meta[property="og:description"]').attr('content');
    if (description) return description;

    description = $('.site-slogan').text();

    return description;
  }


  plugin.getPageImages = function getPageImages($, pageRecord,  callback) {
    const we = plugin.we;

    let image = $('meta[property="og:image"]').attr('content');
    let imagesSrc = [];
    if (image) {
      imagesSrc.push(image);
    } else {
      // TODO get only 3 images
      $('img').each(function() {
        let src = $(this).attr('src');
        // check if has a valid image
        if (/^http?:\/\//.test(src)) {
          imagesSrc.push(src);
        }
      });
      if(imagesSrc.length > 3 ){
        imagesSrc = imagesSrc.splice(0 , 3);
      }
    }

    let imgsPath = we.config.wembed.filesPath + pageRecord.id+'/';
    let imageRecords = [];
    // image order count
    let orderNumber = 0;
    // download every image file
    we.utils.async.each(imagesSrc, function (src, nextImage) {
      let imageFileName = uuid.v1();

      downloadImage(
        src,
        path.resolve(plugin.we.projectPath, imgsPath ,imageFileName),
      function (err, downloadedImage) {
        if (err) {
          we.log.error('Error on download image:',err);
          return nextImage();
        }
        // set image data
        downloadedImage.name = imageFileName;
        downloadedImage.orderNumber = orderNumber;
        orderNumber++;
        // save image on db
        we.db.models.wembedImage
        .create(downloadedImage)
        .then(function (imageRecord) {
          imageRecords.push(imageRecord);
          nextImage();
        })
        .catch(nextImage);
      });

    }, function (err) {
      callback(err, imageRecords);
    });
  }

  function downloadImage(uri, newFilePath, callback){
    try {
      request.head(uri, function(err, res){
        if (err) {
          plugin.we.log.error('Error on download image:',uri,err,res);
          return callback(err);
        }

        let image = {};
        image.mime = res.headers['content-type'];
        image.size = res.headers['content-length'];
        image.extension = mime.getExtension(image.mime);
        image.originalFilename = uri;

        newFilePath =  newFilePath + '.' + mime.getExtension(image.mime);

        let tempFilename = path.resolve(
          plugin.we.projectPath,
          'files/tmp/'+uuid.v1()
        );

        request(uri).pipe(fs.createWriteStream(tempFilename))
        .on('close', function() {
          resizeImage(tempFilename, newFilePath, image , function (err) {
            if (err) return callback(err);

            fs.unlink(tempFilename,function(err){
              // return the callback
              callback(err, image, newFilePath);
            });
          });
        });
      });
    } catch (e) {
      plugin.we.log.error('>> error on download image', e, uri, newFilePath);
      callback();
    }
  }

  /**
   * Resize and return new image size and newPath
   * @param  {string}   originalFile  original file name
   * @param  {object}   cords         cords with cords.width and cords.heigth
   * @param  {Function} callback     return callback(err, filepath)
   */
  function resizeImage(originalFile, newFilePath, image, callback){
    // resize and remove EXIF profile data
    gm(originalFile)
    .resize(
      plugin.we.config.wembed.image.width,
      plugin.we.config.wembed.image.height,
      '^'
    )
    .gravity('Center')
    .crop(
      plugin.we.config.wembed.image.width,
      plugin.we.config.wembed.image.height
    )
    .write(newFilePath, function (err) {
      if (err) return callback(err);
      // delete original file
      callback(err, newFilePath);
    });
  }

  plugin.addMethodIfDontHave = function addMethodIfDontHave(s){
    // if user has not entered http:// https:// or ftp:// assume they mean http://
    if(!/^(http|https):\/\//.test(s)) {
      return 'http://'+s;
    }else{
      return s;
    }
  }

  function getRequestOptions(url){
    return {
      url: url,
      headers: {
        // fake user agent
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:30.0) Gecko/20100101 Firefox/30.0',
        'Accept': '*/*',
        'Content-Type': 'text/html',
        'connection': 'Keep-Alive'
      }
    };
  }

  return plugin;
};