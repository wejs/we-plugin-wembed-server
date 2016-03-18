
var us = {};

us.isValidUrl = function isValidUrl(s) {
  return (s.indexOf('http://')>-1 || s.indexOf('https://')>-1);
};

us.getPageProvider = function getPageProvider(url) {
  console.log('us.parseYouTubeUr:',us.parseYouTubeUr);

  if(us.parseYouTubeUrl(url)){
    return {
      provider: 'youtube'
    };
  }else if(us.parseVimeoUrl(url) ){
    return 'vimeo';
  }
  return 'site';
};

us.getMetadataFromUrl = function getPageProvider(url) {
  var metadata = null;

  // if is Youtube page
  metadata = us.parseYouTubeUrl(url);
  if(metadata){
    return {
      provider: 'youtube',
      pageId: metadata,
      type: 'video'
    };
  }

  // if is vimeo
  metadata = us.parseVimeoUrl(url);
  if(metadata){
    return {
      provider: 'vimeo',
      pageId: metadata,
      type: 'video'
    };
  }

  // default is site withouth id
  return {
    provider: 'site',
    pageId: null,
    type: 'page'
  };
};


us.parseVideoUrl = function parseVideoUrl(url) {
  var id;
  id = us.parseYouTubeUrl(url);
  if(id){
    return {
      provider: 'youtube',
      id: id
    };
  }
  id = us.parseVimeoUrl(url);
  if( id ){
    return {
      provider: 'vimeo',
      id: id
    };
  }
  return false;
};

us.parseYouTubeUrl =function parseYouTubeUrl(url) {
  //var re = /\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/)?([a-z0-9_\-]+)/i;
  var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  return (url.match(p)) ? RegExp.$1 : false;
};

us.parseVimeoUrl = function parseVimeoUrl(str) {
  var re = /\/\/(?:www\.)?vimeo.com\/([0-9a-z\-_]+)/i;
  var matches = re.exec(str);
  if (matches) { return matches[1]; }
  return null;
};

module.exports = us;