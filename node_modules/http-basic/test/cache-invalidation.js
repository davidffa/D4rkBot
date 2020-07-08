'use strict';

var assert = require('assert');
var request = require('../');
var http = require('http');
var rimraf = require('rimraf');
var path = require('path');
var InvalidationFailureCache = require('../test-fixture/invalidation-failure-cache');

rimraf.sync(path.resolve(__dirname, '..', 'cache'));

var PORT = 3294;

var cacheControlServer = http.createServer(function(req, res){
  
  if(req.headers["x-please-fail"]){
    res.statusCode = 500;
    res.end('oops');
  } else {
    res.statusCode = 200;
    if(req.method === "GET"){
      res.setHeader('cache-control','public,max-age=60');
      res.end('These are my favourite things');
    } else {
      res.end();
    }
  }
  
});

function resourceUri(traceId) {
  
  return 'http://localhost:'+PORT+'/collection-'+traceId;
  
}

function shouldNotBeCached(traceId, cache) {
  request('GET', resourceUri(traceId), {cache: cache}, function (err, res) {
    if (err) throw err;

    console.log('response ' + traceId + '.2 (should no longer be cached)');
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    res.body.resume();
  });
  
}

function shouldStillBeCached(traceId, cache) {
  request('GET', resourceUri(traceId), {cache: cache}, function (err, res) {
    if (err) throw err;

    console.log('response ' + traceId + '.2 (should still be cached)');
    assert(res.statusCode === 200);
    assert(res.fromCache === true);
    res.body.resume();
  });
  
}

function arrange(traceId, description, cache, callback) {
  request('GET', resourceUri(traceId), {cache: cache}, function (err, res) {
    if (err) throw err;

    console.log('response ' + traceId + '.0 ' + description);
    assert(res.statusCode === 200);
    assert(res.fromCache === undefined);
    assert(res.fromNotModified === undefined);
    res.body.on('data', function () {});
    res.body.on('end', function () {
      setTimeout(callback, 25);
    } );
  });
  return {
    
    assertIsNotCached: function() { shouldNotBeCached(traceId, cache); },
    assertIsCached: function() { shouldStillBeCached(traceId, cache); }
    
  };
  
}

function invalidationScenario(traceId, method, cacheType, isDuplex) {

  var scenario = arrange(traceId, '(populate memory cache prior to ' + method + ')', cacheType, function() {
            
    var options = {
      cache: cacheType,
      headers: { 'content-type': 'text/plain' }
    };   
    var req = request(method, resourceUri(traceId), options, function (err, res) {
      if (err) throw err;
          
      console.log('response '+traceId+'.1 ('+method+' invalidates ' + cacheType + ' cache)');
      res.body.on('data', function() {});
      res.body.on('end', function() {
        
        setTimeout(scenario.assertIsNotCached, 25);

      });
      
    });
    if(isDuplex){
      req.end('hello world');
    }

  });
  
}

function invalidationScenario__failedUnsafeRequest(traceId, method, cacheType, isDuplex) {

  var scenario = arrange(traceId, '(populate memory cache prior to attempting ' + method + ')', cacheType, function() {
        
    var options = {
      cache: cacheType,
      headers: { 'content-type': 'text/plain', 'x-please-fail': 'true' }
    };        
    var req = request(method, resourceUri(traceId), options, function (err, res) {
      if (err) throw err;
          
      console.log('response '+traceId+'.1 ('+method+' fails, so does not invalidate ' + cacheType + ' cache)');
      res.body.on('data', function() {});
      res.body.on('end', function() {
        
        setTimeout(scenario.assertIsCached, 25);

      });
      
    });
    if(isDuplex){
      req.end('hello world');
    }

  });
  
}

function invalidationScenario__failedCacheInvalidation(traceId, method, cacheObject, isDuplex, ignoreFailedInvalidation) {
  
  var scenario = arrange(traceId, '(populate memory cache prior to attempting ' + method + ')', cacheObject, function() {
        
    var options = {
      cache: cacheObject,
      headers: { 'content-type': 'text/plain' }
    };
    if(typeof ignoreFailedInvalidation === "boolean"){
      options.ignoreFailedInvalidation = ignoreFailedInvalidation;
    }
    var req = request(method, resourceUri(traceId), options, function (err, res) {
      if (ignoreFailedInvalidation && err) throw err;
         
      console.log('response '+traceId+'.1 (Cache invalidation fails after ' + method + ')');
      res.body.on('data', function() {});
      res.body.on('end', function() {
        
        setTimeout(scenario.assertIsCached, 25);

      });
      
    });
    if(isDuplex){
      req.end('hello world');
    }

  });
  
}


cacheControlServer.listen(PORT, function onListen() {

  // unsafe methods should invalidate the cache  
  invalidationScenario('P', 'POST', 'memory', true);
  invalidationScenario('Q', 'POST', 'file', true);
  invalidationScenario('R', 'PUT', 'memory', true);
  invalidationScenario('S', 'PUT', 'file', true);
  invalidationScenario('T', 'DELETE', 'memory', false);
  invalidationScenario('U', 'DELETE', 'file', false);
  // if the DELETE fails, the cache should not be invalidated
  invalidationScenario__failedUnsafeRequest('V', 'DELETE', 'memory', false);
  // if the cache fails to invalidate, should throw an error
  invalidationScenario__failedCacheInvalidation('W', 'DELETE', new InvalidationFailureCache(), false, false);
  // if the cache fails to invalidate, but the ignoreFailedInvalidation option is set, should still be cached
  invalidationScenario__failedCacheInvalidation('X', 'DELETE', new InvalidationFailureCache(), false, true);
  
});

cacheControlServer.unref();
