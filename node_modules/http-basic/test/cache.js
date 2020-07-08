'use strict';

var assert = require('assert');
var request = require('../');
var FileCache = require('../lib/FileCache').default;
var http = require('http');
var serveStatic = require('serve-static');
var rimraf = require('rimraf');
var path = require('path');
var url = require('url');
var qs = require('querystring');

const cacheDir = path.resolve(__dirname, '..', 'lib', 'cache');
rimraf.sync(cacheDir);


var CACHED_BY_CACHE_CONTROL = 'http://localhost:3293/index.js';
var CACHED_BY_CACHE_CONTROL__MAX_AGE = CACHED_BY_CACHE_CONTROL +'?cache-control='+encodeURIComponent('max-age=60');
var CACHED_BY_CACHE_CONTROL__MAX_AGE_PUBLIC = CACHED_BY_CACHE_CONTROL +'?cache-control='+encodeURIComponent('max-age=60,public');
var CACHED_BY_CACHE_CONTROL__MAX_AGE_PRIVATE = CACHED_BY_CACHE_CONTROL +'?cache-control='+encodeURIComponent('max-age=60,private');
var CACHED_BY_CACHE_CONTROL__LWS = CACHED_BY_CACHE_CONTROL +'?cache-control='+encodeURIComponent('  public  ,  max-age=60  ');


var overrideableHeaders = ['cache-control'];
function overrideHeaders(res, path, stat) {

  var query = qs.parse(url.parse(this.req.url).query);
  overrideableHeaders.forEach(function(header){
    if(header in query) {
      res.setHeader(header,query[header]);
    }
  });
  
}

var cacheControlServer = http.createServer(serveStatic(__dirname, {
  etag: false,
  lastModified: false,
  cacheControl: true,
  maxAge: 5000,
  fallthrough: false,
  setHeaders: overrideHeaders
}));

cacheControlServer.listen(3293, function onListen() {
  request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'memory'}, function (err, res) {
    if (err) throw err;

    console.log('response E (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response F (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 25);
    });
  });

  request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'file'}, function (err, res) {
    if (err) throw err;

    console.log('response G (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL, {cache: 'file'}, function (err, res) {
          if (err) throw err;

          console.log('response H (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 1000);
    });
  });

  request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE, {cache: 'memory'}, function(err, res){
     if (err) throw err;

    console.log('response E.1 ("max-age=60")');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response F.1 ("max-age=60")');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 25);
    });
  });
  
  request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE_PUBLIC, {cache: 'memory'}, function(err, res){
     if (err) throw err;

    console.log('response E.2 ("max-age=60,public)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE_PUBLIC, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response F.2 ("max-age=60,public)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 25);
    });
  });
  
  request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE_PRIVATE, {cache: 'memory'}, function(err, res){
     if (err) throw err;

    console.log('response E.3 ("max-age=60,private)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE_PRIVATE, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response F.3 ("max-age=60,private)');
          assert(res.statusCode === 200);
          assert(!res.fromCache);
          res.body.resume();
        });
      }, 25);
    });
  });
  
  request('GET', CACHED_BY_CACHE_CONTROL__LWS, {cache: 'memory'}, function(err, res){
     if (err) throw err;

    console.log('response E.4 ("  public  ,  max-age=60  ")');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL__MAX_AGE_PUBLIC, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response F.4 ("  public  ,  max-age=60  ")');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === false);
          res.body.resume();
        });
      }, 25);
    });
  });
});

cacheControlServer.unref();


var CACHED_BY_ETAGS = 'http://localhost:4294/index.js';

var etagsServer = http.createServer(serveStatic(__dirname, {
  etag: true,
  lastModified: false,
  cacheControl: false,
  fallthrough: false
}));

etagsServer.listen(4294, function onListen() {
  request('GET', CACHED_BY_ETAGS, {cache: 'memory'}, function (err, res) {
    if (err) throw err;

    console.log('response I (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_ETAGS, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response J (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 25);
    });
  });

  request('GET', CACHED_BY_ETAGS, {cache: 'file'}, function (err, res) {
    if (err) throw err;

    console.log('response K (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_ETAGS, {cache: 'file'}, function (err, res) {
          if (err) throw err;

          console.log('response L (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 1000);
    });
  });
});

etagsServer.unref();


var CACHED_BY_LAST_MODIFIED = 'http://localhost:5295/index.js';

var lastModifiedServer = http.createServer(serveStatic(__dirname, {
  etag: false,
  lastModified: true,
  cacheControl: false,
  fallthrough: false
}));

lastModifiedServer.listen(5295, function onListen() {
  request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'memory'}, function (err, res) {
    if (err) throw err;

    console.log('response M (populate memory cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
    	setTimeout(function () {
        request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'memory'}, function (err, res) {
          if (err) throw err;

          console.log('response N (from memory cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 25);
    });
  });

  request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'file'}, function (err, res) {
    if (err) throw err;

    console.log('response O (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_LAST_MODIFIED, {cache: 'file'}, function (err, res) {
          if (err) throw err;

          console.log('response P (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          assert(res.fromNotModified === true);
          res.body.resume();
        });
      }, 1000);
    });
  });

  const staticKeyCache = new FileCache(cacheDir);
  staticKeyCache.getCacheKey = function (res) {
    return 'static-key';
  };
  request('GET', CACHED_BY_CACHE_CONTROL, {cache: staticKeyCache}, function (err, res) {
    if (err) throw err;

    console.log('response O (populate file cache)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(function () {
        request('GET', CACHED_BY_CACHE_CONTROL + '?a=b', {cache: staticKeyCache}, function (err, res) {
          if (err) throw err;

          console.log('response P (from file cache)');
          assert(res.statusCode === 200);
          assert(res.fromCache === true);
          res.body.resume();
        });
      }, 1000);
    });
  });
});

lastModifiedServer.unref();
