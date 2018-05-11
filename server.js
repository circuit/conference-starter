'use strict';

const schedule = require('node-schedule');
const EventEmitter = require('events');
const emitter = new EventEmitter();
const circuit = require('./circuit');
const webserver = require('./webserver');

webserver(emitter);

(async () => {
  try {
    await circuit.init();

    emitter.on('schedule', data => {
      const date = new Date(data.date);
      const job = schedule.scheduleJob(date, async () => {
        await circuit.startConference(data.conv, true)
      });
    });
  } catch (err) {
    console.error(err);
  }
})();
