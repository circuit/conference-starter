'use strict';

const emitter = new EventEmitter();
const circuit = require('./circuit');

(async () => {
  try {
    await circuit.init();

    const convIds = ['00ff03e5-89d7-4318-9ca4-e5f1e6a03178', '80ae9f44-a9a4-4b73-9d82-f40c3f4eb3ce'];
    const promises = convIds.map(convId => circuit.startConference(convId, true));

    // Leave conferences after a minute if nobody joined
    convIds.forEach(convId => {
      setTimeout(() => {
        circuit.leaveConference(convId)
          .catch(console.error);
      }, 60000);
    });

    // Start conferences in parallel to showcase that multiple conferences
    // can be started simultaneously
    const res = await Promise.all(promises);
    res.forEach((r, i) => {
      if (!r) {
        console.error(`Unable to start conference. convId: ${convIds[i]}`)
      } else {
        console.log(`Conference started. ${r.dialoutCount} users dialed out and at least two joined. convId: ${convIds[i]}, callId: ${r.callId}`)
      }
    });

    await circuit.close();
  } catch (err) {
    console.error(err);
  }
})();
