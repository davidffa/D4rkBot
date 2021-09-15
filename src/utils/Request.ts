import https from 'https';
import http, { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { Transform } from 'stream';

export type ReqOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Object;
  headers?: OutgoingHttpHeaders;
}

export default function fetch(url: string, options?: ReqOptions): Promise<Response> {
  let requestUrl: URL;

  return new Promise((resolve, reject) => {
    try {
      requestUrl = new URL(url);
    } catch (err) {
      reject(err);
    }

    const request = requestUrl.protocol === 'https:' ? https.request : http.request;

    let response = new Transform();

    const req = request({
      host: requestUrl.host,
      path: requestUrl.pathname + requestUrl.search,
      headers: {
        'User-Agent': 'D4rkBot (Discord Bot)',
        ...options?.headers
      },
      method: options?.method
    }, (res) => {
      res
        .on('data', data => response.push(data))
        .on('error', err => reject(err))
        .once('end', () => {
          resolve(new Response(response, res.headers, res.statusCode))
        });
    });

    req.on('abort', () => reject(new Error('Request aborted!')));
    req.on('error', err => reject(err));

    if (options?.body) {
      const body = JSON.stringify(options.body);

      req.setHeader('Content-Length', body.length);
      req.setHeader('Content-Type', 'application/json');
      req.write(body);
    }

    req.end();
  });
}

interface ResponseData {
  response: Transform;
  headers: IncomingHttpHeaders
  status?: number;
}

export class Response {
  private readonly data: ResponseData;

  constructor(res: Transform, headers: IncomingHttpHeaders, status?: number) {
    this.data = {
      response: res,
      headers,
      status
    };
  }

  get headers() {
    return this.data.headers;
  }

  get status() {
    return this.data.status;
  }

  get text() {
    return this.data.response.read();
  }

  get buffer() {
    return Buffer.from(this.data.response.read());
  }

  get json() {
    try {
      return JSON.parse(this.data.response.read());
    } catch {
      return {};
    }
  }
}