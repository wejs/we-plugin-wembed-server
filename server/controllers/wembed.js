/**
 * wembled Controller
 */
const validUrl = require('valid-url');

module.exports = {
  /**
   * Generate one site embled for url passed in ?url='site'
   *
   * /api/v1/:wembedType(embed|json)
   */
  getEmbed (req, res) {
    const plugin = req.we.plugins['we-plugin-wembed-server'];
    const sucessReponse = plugin.getWembedSucessReponse;

    let siteUrl = req.query.url;

    if (!siteUrl) {
      return res.badRequest('Url not found');
    }

    siteUrl = plugin.addMethodIfDontHave(siteUrl);

    if (!validUrl.isWebUri(siteUrl)) {
      return res.badRequest('Invalid url');
    }

    req.we.db.models.wembed
    .findOne({
      where: { url: siteUrl },
      include: [{ all: true }]
    })
    .then(function afterFindOne(pageRecord) {
      // if has one page registered on db ...
      if (pageRecord) {
        res.locals.data = pageRecord;

        // check if cache is valid
        let dateNow =  new Date().getTime();
        let timeDiference = dateNow - pageRecord.cacheTime.getTime();
        // if cache is valid return cached page data
        if (timeDiference <= req.we.config.wembed.refreshTime) {
          return sucessReponse(req, res, pageRecord);
        } else {
          plugin.updatePage(req, res, pageRecord, function doneCallback(err, pageRecord) {
            if (err) return res.badRequest(err);

            res.locals.data = pageRecord;
            sucessReponse(req, res);
          });
        }
      } else {
        // else register the page
        plugin.registerPage(req, res, siteUrl, function doneCallback(err, pageRecord) {
          if (err) return res.serverError(err);

          res.locals.data = pageRecord;
          sucessReponse(req, res);
        });
      }

    })
    .catch(res.queryError);
  }
};