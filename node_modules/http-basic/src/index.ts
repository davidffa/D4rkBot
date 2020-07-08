import * as cacheUtils from './cache-utils';
import FileCache from './FileCache';
import MemoryCache from './MemoryCache';
import { Callback } from './Callback';
import {CachedResponse} from './CachedResponse';
import {
  ClientRequest,
  IncomingMessage,
  request as requestHttp,
  RequestOptions
  } from 'http';
import { createGunzip, createInflate } from 'zlib';
import { HttpVerb } from './HttpVerb';
import { ICache } from './ICache';
import { Options } from './Options';
import { parse as parseUrl, resolve as resolveUrl } from 'url';
import { PassThrough } from 'stream';
import { request as requestHttps } from 'https';
import Response = require('http-response-object');
import {URL} from 'url';

const caseless = require('caseless');
const fileCache = new FileCache(__dirname + '/cache');
const memoryCache = new MemoryCache();

function requestProtocol(protocol: string, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest {
  if (protocol === 'http') {
    return requestHttp(options, callback);
  } else if (protocol === 'https') {
    return requestHttps(options, callback);
  }
  throw new Error('Unsupported protocol ' + protocol);
}

function request(method: HttpVerb, url: string | URL, options: Options | null | void, callback: Callback): void | NodeJS.WritableStream;
function request(method: HttpVerb, url: string | URL, callback: Callback): void | NodeJS.WritableStream;
function request(method: HttpVerb, url: string | URL, options?: Options | Callback | null | void, callback?: Callback | null): void | NodeJS.WritableStream {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (options === null || options === undefined) {
    options = {};
  }
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object (or null)');
  }
  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }
  return _request(method, (
    (url && typeof url === 'object') ? url.href : url
  ), options, callback);
}
function _request(method: HttpVerb, url: string, options: Options, callback: Callback): void | NodeJS.WritableStream {
  const start = Date.now();
  if (typeof method !== 'string') {
    throw new TypeError('The method must be a string.');
  }
  if (typeof url !== 'string') {
    throw new TypeError('The URL/path must be a string or a URL object.');
  }

  method = (method.toUpperCase() as any);
  const urlObject = parseUrl(url);

  const protocol = (urlObject.protocol || '').replace(/\:$/, '');
  if (protocol !== 'http' && protocol !== 'https') {
    throw new TypeError('The protocol "' + protocol + '" is not supported, cannot load "' + url + '"');
  }

  const rawHeaders = options.headers || {};
  const headers = caseless(rawHeaders);
  if (urlObject.auth) {
    headers.set('Authorization', 'Basic ' + (Buffer.from(urlObject.auth)).toString('base64'));
  }
  const agent = 'agent' in options ? options.agent : false;

  let cache = options.cache;
  if (typeof cache === 'string') {
    if (cache === 'file') {
      cache = fileCache
    } else if (cache === 'memory') {
      cache = memoryCache;
    }
  }
  if (cache && !(typeof cache === 'object' && typeof cache.getResponse === 'function' && typeof cache.setResponse === 'function' && typeof cache.invalidateResponse === 'function')) {
    throw new TypeError(cache + ' is not a valid cache, caches must have `getResponse`, `setResponse` and `invalidateResponse` methods.');
  }

  const ignoreFailedInvalidation = options.ignoreFailedInvalidation;
  
  if (options.duplex !== undefined && typeof options.duplex !== 'boolean') {
    throw new Error('expected options.duplex to be a boolean if provided');
  }
  const duplex = options.duplex !== undefined ? options.duplex : !(method === 'GET' || method === 'DELETE' || method === 'HEAD');
  const unsafe = !(method === 'GET' || method === 'OPTIONS' || method === 'HEAD');
  
  if (options.gzip) {
    headers.set('Accept-Encoding', headers.has('Accept-Encoding') ? headers.get('Accept-Encoding') + ',gzip,deflate' : 'gzip,deflate');
    return _request(method, url, {
      allowRedirectHeaders: options.allowRedirectHeaders,
      duplex: duplex,
      headers: rawHeaders,
      agent: agent,
      followRedirects: options.followRedirects,
      retry: options.retry,
      retryDelay: options.retryDelay,
      maxRetries: options.maxRetries,
      cache: cache,
      timeout: options.timeout
    }, function (err, res) {
      if (err) return callback(err);
      if (!res) return callback(new Error('Response should not be undefined if there is no error.'));
      const newHeaders = ({...res.headers} as any);
      let newBody = res.body;
      switch (newHeaders['content-encoding']) {
        case 'gzip':
          delete newHeaders['content-encoding'];
          newBody = res.body.pipe(createGunzip());
          break;
        case 'deflate':
          delete newHeaders['content-encoding'];
          newBody = res.body.pipe(createInflate());
          break;
      }
      return callback(err, new Response(res.statusCode, newHeaders, newBody, res.url));
    });
  }
  if (options.followRedirects) {
    return _request(method, url, {
      allowRedirectHeaders: options.allowRedirectHeaders,
      duplex: duplex,
      headers: rawHeaders,
      agent: agent,
      retry: options.retry,
      retryDelay: options.retryDelay,
      maxRetries: options.maxRetries,
      cache: cache,
      timeout: options.timeout
    }, function (err, res) {
      if (err) return callback(err);
      if (!res) return callback(new Error('Response should not be undefined if there is no error.'));
      if (options.followRedirects && isRedirect(res.statusCode)) {
        // prevent leakage of file handles
        res.body.resume();
        if (method === 'DELETE' && res.statusCode === 303) {
          // 303 See Other should convert to GET for duplex
          // requests and for DELETE
          method = 'GET';
        }
        if (options.maxRedirects === 0) {
          const err = new Error('Maximum number of redirects exceeded');
          (err as any).res = res;
          return callback(err, res);
        }
        options = {
          ...options,
          duplex: false,
          maxRedirects: options.maxRedirects && options.maxRedirects !== Infinity ? options.maxRedirects - 1 : options.maxRedirects,
        };
        // don't maintain headers through redirects
        // This fixes a problem where a POST to http://example.com
        // might result in a GET to http://example.co.uk that includes "content-length"
        // as a header
        const headers = caseless(options.headers);
        const redirectHeaders: any = {};
        if (options.allowRedirectHeaders) {
          for (let i = 0; i < options.allowRedirectHeaders.length; i++) {
            const headerName = options.allowRedirectHeaders[i];
            const headerValue = headers.get(headerName);
            if (headerValue) {
              redirectHeaders[headerName] = headerValue;
            }
          }
        }
        options.headers = redirectHeaders;
        const location = res.headers.location;
        if (typeof location !== 'string') {
          return callback(new Error('Cannot redirect to non string location: ' + location));
        }
        return request(duplex ? 'GET' : method, resolveUrl(url, location), options, callback);
      } else {
        return callback(null, res);
      }
    });
  }
  if (cache && method === 'GET' && !duplex) {
    const timestamp = Date.now();
    return cache.getResponse(url, function (err, cachedResponse) {
      if (err) {
        console.warn('Error reading from cache: ' + err.message);
      }
      const isMatch = !!(cachedResponse && cacheUtils.isMatch(rawHeaders, cachedResponse));
      if (cachedResponse && (options.isMatch ? options.isMatch(rawHeaders, cachedResponse, isMatch) : isMatch)) {
        const isExpired = cacheUtils.isExpired(cachedResponse);
        if (!(options.isExpired ? options.isExpired(cachedResponse, isExpired) : isExpired)) {
          const res = new Response(cachedResponse.statusCode, cachedResponse.headers, cachedResponse.body, url);
          (res as any).fromCache = true;
          (res as any).fromNotModified = false;
          return callback(null, res);
        } else {
          if (cachedResponse.headers['etag']) {
            headers.set('If-None-Match', cachedResponse.headers['etag']);
          }
          if (cachedResponse.headers['last-modified']) {
            headers.set('If-Modified-Since', cachedResponse.headers['last-modified']);
          }
        }
      }
      request('GET', url, {
        allowRedirectHeaders: options.allowRedirectHeaders,
        headers: rawHeaders,
        retry: options.retry,
        retryDelay: options.retryDelay,
        maxRetries: options.maxRetries,
        agent: agent,
        timeout: options.timeout
      }, function (err, res) {
        if (err) return callback(err);
        if (!res) return callback(new Error('Response should not be undefined if there is no error.'));
        if (res.statusCode === 304 && cachedResponse) { // Not Modified
          // prevent leakage of file handles
          res.body.resume();
          let resultBody = cachedResponse.body;
          const c = (cache as ICache);
          if (c.updateResponseHeaders) {
            c.updateResponseHeaders(url, {
              headers: res.headers,
              requestTimestamp: timestamp,
            });
          } else {
            const cachedResponseBody = new PassThrough();
            const newResultBody = new PassThrough();
            resultBody.on('data', (data: Buffer) => {
              cachedResponseBody.write(data);
              newResultBody.write(data);
            });
            resultBody.on('end', () => {
              cachedResponseBody.end();
              newResultBody.end();
            });
            resultBody = newResultBody;
            (cache as ICache).setResponse(url, {
              statusCode: cachedResponse.statusCode,
              headers: res.headers,
              body: cachedResponseBody,
              requestHeaders: cachedResponse.requestHeaders,
              requestTimestamp: timestamp,
            });
          }
          const response = new Response(cachedResponse.statusCode, cachedResponse.headers, resultBody, url);
          (response as any).fromCache = true;
          (response as any).fromNotModified = true;
          return callback(null, response);
        }
        // prevent leakage of file handles
        cachedResponse && cachedResponse.body.resume();
        const canCache = cacheUtils.canCache(res);
        if (options.canCache ? options.canCache(res, canCache) : canCache) {
          const cachedResponseBody = new PassThrough();
          const resultResponseBody = new PassThrough();
          res.body.on('data', (data: Buffer) => {
            cachedResponseBody.write(data);
            resultResponseBody.write(data);
          });
          res.body.on('end', function () { cachedResponseBody.end(); resultResponseBody.end(); });
          const resultResponse = new Response(res.statusCode, res.headers, resultResponseBody, url);
          (cache as ICache).setResponse(url, {
            statusCode: res.statusCode,
            headers: res.headers,
            body: cachedResponseBody,
            requestHeaders: rawHeaders,
            requestTimestamp: timestamp,
          });
          return callback(null, resultResponse);
        } else {
          return callback(null, res);
        }
      });
    });
  }

  function attempt(n: number) {
    return _request(method, url, {
      allowRedirectHeaders: options.allowRedirectHeaders,
      headers: rawHeaders,
      agent: agent,
      timeout: options.timeout
    }, function (err, res) {
      let retry = err || !res || res.statusCode >= 400;
      if (typeof options.retry === 'function') {
        retry = options.retry(err, res, n + 1);
      }
      if (n >= (options.maxRetries || 5)) {
        retry = false;
      }
      if (retry) {
        let delay = options.retryDelay;
        if (typeof delay === 'function') {
          delay = delay(err, res, n + 1);
        }
        delay = delay || 200;
        setTimeout(function () {
          attempt(n + 1);
        }, delay);
      } else {
        callback(err, res);
      }
    });
  }
  if (options.retry && method === 'GET' && !duplex) {
    return attempt(0);
  }

  let responded = false;

  let timeout: NodeJS.Timer | null = null;

  const req = requestProtocol(protocol, {
    host: urlObject.hostname,
    port: urlObject.port == null ? undefined : +urlObject.port,
    path: urlObject.path,
    method: method,
    headers: rawHeaders,
    agent: agent
  }, function (res) {
    const end = Date.now();
    if (responded) return res.resume();
    responded = true;
    if (timeout !== null) clearTimeout(timeout);
    const result = new Response(res.statusCode || 0, res.headers, res, url);
    if (cache && unsafe && res.statusCode && res.statusCode < 400){
      (cache as ICache).invalidateResponse(url, (err: Error | null) => {
        if (err && !ignoreFailedInvalidation) {
          callback(new Error('Error invalidating the cache for' + url + ': ' + err.message), result);
        } else {
          callback(null, result);
        }
      });
    } else {
      callback(null, result);
    }
  }).on('error', function (err) {
    if (responded) return;
    responded = true;
    if (timeout !== null) clearTimeout(timeout);
    callback(err);
  });

  function onTimeout() {
    if (responded) return;
    responded = true;
    if (timeout !== null) clearTimeout(timeout);
    req.abort();
    const duration = Date.now() - start;
    const err: any = new Error('Request timed out after ' + duration + 'ms');
    err.timeout = true;
    err.duration = duration;
    callback(err);
  }
  if (options.socketTimeout) {
    req.setTimeout(options.socketTimeout, onTimeout);
  }
  if (options.timeout) {
    timeout = setTimeout(onTimeout, options.timeout);
  }

  if (duplex) {
    return req;
  } else {
    req.end();
  }
  return undefined;
}

function isRedirect(statusCode: number): boolean {
  return statusCode === 301 || statusCode === 302 || statusCode === 303 || statusCode === 307 || statusCode === 308;
}

export default request;
export {HttpVerb};
export {Options};
export {Callback};
export {Response};
export {CachedResponse};
export {ICache};

module.exports = request;
module.exports.default = request;
module.exports.Response = Response;