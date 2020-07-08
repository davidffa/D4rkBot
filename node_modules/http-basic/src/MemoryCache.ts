'use strict';

import {PassThrough} from 'stream';
import Response = require('http-response-object');
import concat = require('concat-stream');
import {Headers} from './Headers';
import {ICache} from './ICache';
import {CachedResponse} from './CachedResponse';

interface StoredResponse {
  statusCode: number,
  headers: Headers,
  body: Buffer,
  requestHeaders: Headers,
  requestTimestamp: number
}

export default class MemoryCache {
  private readonly _cache: {[url: string]: StoredResponse} = {};
  
  getResponse(url: string, callback: (err: null | Error, response: null | CachedResponse) => void): void {
    const cache = this._cache;
    if (cache[url]) {
      const body = new PassThrough();
      body.end(cache[url].body);
      callback(null, {
        statusCode: cache[url].statusCode,
        headers: cache[url].headers,
        body: body,
        requestHeaders: cache[url].requestHeaders,
        requestTimestamp: cache[url].requestTimestamp
      });
    } else {
      callback(null, null);
    }
  }

  updateResponseHeaders(url: string, response: Pick<CachedResponse, 'headers' | 'requestTimestamp'>) {
    this._cache[url] = {
      ...this._cache[url],
      headers: response.headers,
      requestTimestamp: response.requestTimestamp
    };
  }

  setResponse(url: string, response: CachedResponse): void {
    const cache = this._cache;
    response.body.pipe(concat((body) => {
      cache[url] = {
        statusCode: response.statusCode,
        headers: response.headers,
        body: body,
        requestHeaders: response.requestHeaders,
        requestTimestamp: response.requestTimestamp
      };
    }));
  }

  invalidateResponse(url: string, callback: (err: NodeJS.ErrnoException | null) => void) {
    const cache = this._cache;
    delete cache[url];
    callback(null);
  }
}
