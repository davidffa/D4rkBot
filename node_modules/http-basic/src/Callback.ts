import Response = require('http-response-object');

type Callback = (err: NodeJS.ErrnoException | null, response?: Response<NodeJS.ReadableStream>) => void;
export {Callback};