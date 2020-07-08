'use strict';

import * as fs from 'fs';
import {resolve} from 'path';
import {createHash} from 'crypto';
import Response = require('http-response-object');
import {ICache} from './ICache';
import {CachedResponse} from './CachedResponse';

function jsonParse(data: string, cb: (err: Error | null, result?: any) => void): void {
  let result = null;
  try {
    result = JSON.parse(data);
  } catch (ex) {
    return cb(ex);
  }
  cb(null, result);
}

export default class FileCache implements ICache {
  private readonly _location: string;
  constructor(location: string) {
    this._location = location;
  }

  getResponse(url: string, callback: (err: null | Error, response: null | CachedResponse) => void) {
    const key = resolve(this._location, this.getCacheKey(url));

    fs.readFile(key + '.json', 'utf8', function (err, data) {
      if (err && err.code === 'ENOENT') return callback(null, null);
      else if (err) return callback(err, null);
      jsonParse(data, (err, response) => {
        if (err) {
          return callback(err, null);
        }
        const body = fs.createReadStream(key + '.body');
        response.body = body;
        callback(null, response);
      });
    });
  }

  setResponse(url: string, response: CachedResponse): void {
    const key = resolve(this._location, this.getCacheKey(url));
    let errored = false;

    fs.mkdir(this._location, function (err) {
      if (err && err.code !== 'EEXIST') {
        console.warn('Error creating cache: ' + err.message);
        return;
      }
      response.body.pipe(fs.createWriteStream(key + '.body')).on('error', (err: NodeJS.ErrnoException) => {
        errored = true;
        console.warn('Error writing to cache: ' + err.message);
      }).on('close', function () {
        if (!errored) {
          fs.writeFile(key + '.json', JSON.stringify({
            statusCode: response.statusCode,
            headers: response.headers,
            requestHeaders: response.requestHeaders,
            requestTimestamp: response.requestTimestamp
          }, null, '  '), function (err) {
            if (err) {
              console.warn('Error writing to cache: ' + err.message);
            }
          });
        }
      });
    });
  }

  updateResponseHeaders(url: string, response: Pick<CachedResponse, 'headers' | 'requestTimestamp'>) {
    const key = resolve(this._location, this.getCacheKey(url));
    fs.readFile(key + '.json', 'utf8', function (err, data) {
      if (err) {
        console.warn('Error writing to cache: ' + err.message);
        return;
      }
      let parsed = null;
      try {
        parsed = JSON.parse(data);
      } catch (ex) {
        console.warn('Error writing to cache: ' + ex.message);
        return;
      }
      fs.writeFile(key + '.json', JSON.stringify({
        statusCode: parsed.statusCode,
        headers: response.headers,
        requestHeaders: parsed.requestHeaders,
        requestTimestamp: response.requestTimestamp
      }, null, '  '), function (err) {
        if (err) {
          console.warn('Error writing to cache: ' + err.message);
        }
      });
    });
  }

  invalidateResponse(url: string, callback: (err: NodeJS.ErrnoException | null) => void): void {
    const key = resolve(this._location, this.getCacheKey(url));
    fs.unlink(key + '.json', (err?: NodeJS.ErrnoException | null) => {
      if (err && err.code === 'ENOENT') return callback(null);
      else callback(err || null);
    });  
  }

  getCacheKey(url: string): string {
    const hash = createHash('sha512');
    hash.update(url);
    return hash.digest('hex');
  }
}
