'user strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const config = require('./config_override.json') || require('./config.json');
const credentials = config.credentials[process.env.CIRCUIT_SYSTEM || config.system || 'sandbox'];
const publicCredentials = {
  domain: credentials.domain,
  client_id: credentials.client_id
};

let browser;
let accessToken;

// hashtable of active pages, indexed by convId
const pages = {};

/**
 * Initialize module. Launches browser instance and logs on
 * client to Circuit to obtain access token.
 */
async function init() {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--auto-open-devtools-for-tabs',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--mute-audio',
      '--use-fake-device-for-media-stream',
      //'--unsafely-treat-insecure-origin-as-secure',
      //'--ignore-certificate-errors',
      //'--allow-running-insecure-content'
    ]
  });

  const page = await browser.newPage();

  await page.goto(`file:${path.join(__dirname, 'index.html')}`);

  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

  accessToken = await page.evaluate(async credentials => {
    let client;
    let user;
    try {
      Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
      client = new Circuit.Client(credentials);
      user = await client.logon();
      return client.accessToken;
    } finally {
      user && await client.logout();
    }
  }, credentials);

  await page.close();

  console.log('Initialized circuit module');
}

/**
 * Start conference and optionally dial out participants
 *
 * @param {String} convId
 * @param {Boolean} dialout True if users are to be dialed out
 */
async function startConference(convId, dialout) {
  const page = await browser.newPage();
  pages[convId] = page;

  // Use an html page since about:blank will not allow sessionStorage etc,
  // at the same time use the html file to load Circuit from unpkg
  await page.goto(`file:${path.join(__dirname, 'index.html')}`);

  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  page.on('close', msg => console.log('Page closed'));

  const result = await page.evaluate(async ({ publicCredentials, accessToken, convId, dialout }) => {
    let client;
    let call;

    Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

    try {
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

      const jobDone = () => {
        return new Promise((resolve, reject) => {
          let logoutInProgress = false;

          //Circuit.supportedEvents.forEach(e => client.addEventListener(e, evt => console.log(`${e} ${evt.reason} ${evt.call && evt.call.state}`)));

          client.addEventListener('callStatus', e => {
            if (!e.call || !call || e.call.callId !== call.callId) {
              return;
            }

            if (logoutInProgress) {
              console.log('logout in progress, skip event');
              return;
            }

            const joinedParticipants = e.call.participants.filter(p => !!p.pcState.established);
            if (joinedParticipants.length >= 2) {
              logoutInProgress = true;
              console.log(`Leave conference and logout since two users joined. callId: ${e.call.callId}`);
              client.leaveConference(e.call.callId)
                .then(() => client.logout())
                .then(resolve)
                .catch(reject);
            }

            if (e.reason === 'droppedRemotely') {
              logoutInProgress = true;
              // Bot was dropped, logout
              client.logout()
                .then(resolve)
                .catch(reject);
            }
          });

          client.addEventListener('callEnded', e => {
            if (!e.call || !call || e.call.callId !== call.callId) {
              return;
            }
            client.logout()
              .then(resolve)
              .catch(reject);
          });
        });
      }

      // Create new client instance and login
      client = new Circuit.Client(publicCredentials);
      const user = await client.logon({accessToken: accessToken});

      // Get conversation
      const conv = await client.getConversationById(convId);

      // Check if call hasn't yet been started
      call = await client.findCall(conv.rtcSessionId);
      if (call) {
        return;
      }

      // Get other participant userIds
      const res = await client.getConversationParticipants(convId);
      const participants = res.participants
        .filter(p => p.userId !== user.userId)
        .map(p => p.userId);

      const jobDonePromise = jobDone();

      // Start conference
      call = await client.startConference(convId);
      console.log(`Started conference on ${conv.topic || conv.topicPlaceholder}`);

      // Mute fake audio being streamed
      await client.mute(call.callId);

      if (dialout) {
        // Wait a second. Backend needs that time to ensure participants are called out.
        await sleep(1000);

        // Dial out users
        const promises = participants.map(p => client.addParticipantToCall(call.callId, { userId: p }));
        await Promise.all(promises);

        // Wait until job is done (two users joined, bot is dropped or call ended)
        await jobDonePromise;
      }

      // Return data about the call
      return {
        callId: call.callId,
        dialoutCount: dialout ? participants.length : 0
      }
    } catch (err) {
      console.log(err);
    }
  }, { publicCredentials, accessToken, convId, dialout });

  delete pages[convId];
  await page.close();

  return result;
}

/**
 * Leave started conference
 *
 * @param {String} convId
 */
async function leaveConference(convId) {
  const page = pages[convId];
  if (!page) {
    // Page already closed
    return;
  }

  await page.evaluate(async ({ publicCredentials, accessToken, convId }) => {
    console.log(`Requested to leave conference. convId: ${convId}`);

    Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

    // Create new client instance and login
    client = new Circuit.Client(publicCredentials);
    const user = await client.logon({accessToken: accessToken});

    // Get conversation to get callId (rtcSessionId)
    const conv = await client.getConversationById(convId);
    await client.leaveConference(conv.rtcSessionId);
  }, { publicCredentials, accessToken, convId });
}

/**
 * Close all pages and browser instance
 */
async function close() {
  const promises = Object.keys(pages).map(convId => pages[convId].close());
  await Promise.all(promises);
  await browser.close();
}

module.exports = {
  init,
  startConference,
  leaveConference,
  close
}