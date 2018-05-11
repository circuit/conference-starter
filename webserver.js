'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require('serve-static');
const app = express();
const config = require('./config_override.json') || require('./config.json');
const PORT = process.env.PORT || config.webserver.port || 1337;
const SYSTEM = process.env.CIRCUIT_SYSTEM || config.system || 'sandbox';

app.use(express.static(__dirname + '/vue-app'));
app.use(bodyParser.json());

module.exports = emitter => {

  // POST /schedule
  app.post('/schedule', (req, res) => {
    console.log('POST to ' + req.url, req.body.data);
    res.sendStatus(200);
    emitter.emit('schedule', req.body.data);
  });

  // Get /system
  app.get('/system', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ system: SYSTEM }));
  });

  app.listen(PORT, () => console.log(`Started webserver on port ${PORT}`))
}