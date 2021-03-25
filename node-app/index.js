const http = require('http');

const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

const serve = serveStatic('./public');

const server = http.createServer((req, res) => {
  const done = finalhandler(req, res);
  serve(req, res, done);
});

const port = process.env.PORT || 5000;
server.listen(port);
console.log(`Server listening on port ${port}`);
