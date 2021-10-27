import https from 'https';
import http, { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';

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

    const data: Buffer[] = [];

    const req = request({
      host: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname + requestUrl.search,
      headers: {
        'User-Agent': 'D4rkBot (Discord Bot)',
        ...options?.headers
      },
      method: options?.method
    }, (res) => {
      res
        .on('data', d => data.push(d))
        .on('error', err => reject(err))
        .once('end', () => {
          resolve(new Response(data, res.headers, res.statusCode))
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
  response: Buffer;
  headers: IncomingHttpHeaders
  status?: number;
}

export class Response {
  private readonly data: ResponseData;

  constructor(data: Buffer[], headers: IncomingHttpHeaders, status?: number) {
    this.data = {
      response: Buffer.concat(data),
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

  get buffer(): Buffer {
    return this.data.response;
  }

  public text(encoding: BufferEncoding = 'utf8'): Promise<string> {
    return new Promise((resolve) => {
      resolve(this.data.response.toString(encoding));
    });
  }

  public json(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        resolve(JSON.parse(this.data.response.toString()));
      } catch (err) {
        reject(err);
      }
    });
  }
}