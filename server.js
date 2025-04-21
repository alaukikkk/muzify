// server.js
const fs = require('fs');
const https = require('https');
const path = require('path');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https
    .createServer(
      {
        key: fs.readFileSync(path.join(__dirname, 'key_no_passphrase.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
      },
      (req, res) => {
        handle(req, res);
      }
    )
    .listen(3000, (err) => {
      if (err) throw err;
      console.log('> Ready on https://localhost:3000');
    });
});
