const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const adapters = require('./lib/adapters')

const app = express();
const server = http.Server(app);
const io = socketio(server);
let adapter = null;

async function main() {
  if (process.argv.length === 3) {
    switch (process.argv[2]) {
      case 'moskito':
        adapter = new adapters.Moskito();
        try {
          await adapter.init();
        } catch(e) {
          console.error(e);
          process.exit(1);
        }
        break;
      default:
        adapter = new adapters.Stdout();
    }
  } else {
    adapter = new adapters.Stdout();
  }

  app.use(express.static('public'));

  io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      console.log(data);
    });
    socket.on('yawing', (val) => {
      adapter.setYawing(val);
    });
    socket.on('throttle', (val) => {
      adapter.setThrottle(val);
    });
  });

  console.log('start server on http://localhost:3000');
  server.listen(3000);
}

main();
