import Response = require('http-response-object');
import {cachePolicy, isCacheable} from './cache-control-utils';
import {Headers} from './Headers';
import {CachedResponse} from './CachedResponse';

export function isMatch(requestHeaders: Headers, cachedResponse: CachedResponse): boolean {
  let vary = cachedResponse.headers['vary'];
  if (vary && cachedResponse.requestHeaders) {
    vary = '' + vary;
    return vary.split(',').map(function (header) { return header.trim().toLowerCase(); }).every(function (header) {
      return requestHeaders[header] === cachedResponse.requestHeaders[header];
    });
  } else {
    return true;
  }
};
export function isExpired(cachedResponse: CachedResponse): boolean {
  const policy = cachePolicy(cachedResponse);
  if (policy) {
    const time = (Date.now() - cachedResponse.requestTimestamp) / 1000;
    if (policy.maxage !== null && policy.maxage > time) {
      return false;
    }
  }
  if (cachedResponse.statusCode === 301 || cachedResponse.statusCode === 308) return false;
  return true;
};
export function canCache<T>(res: Response<T>): boolean {
  if (res.headers['etag']) return true;
  if (res.headers['last-modified']) return true;
  if (isCacheable(res)) return true;
  if (res.statusCode === 301 || res.statusCode === 308) return true;
  return false;
};
