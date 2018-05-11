# conference-starter

> Circuit Conference Starter

Bot that starts a conference and dials out members on a scheduled time.

Consists of:
- Web app to schedule meetings. Uses <a href="https://vuejs.org/v2/guide/installation.html">vue2</a> with <a href="https://mengxiong10.github.io/vue2-datepicker/">vue2-datepicker</a>.
- Webserver to host web app and serve REST endpoints
- Scheduler. Uses <a href="https://www.npmjs.com/package/node-schedule">node-schedule</a>.
- Circuit SDK bot module that starts conference at given time and dials out members. Uses <a href="https://github.com/GoogleChrome/puppeteer">puppeteer</a> to control headless chrome instances so that JS SDK with WebRTC can be used.

## Configuration

Edit `config.json` with `domain`, `client_id` and `client_secret` for your system. Environment variable `SYSTEM` will determine which config to use. If a `config_override.json` is define it is used instead.

Webserver port is taken from `PORT` environment variable, and if not defined from `config.json`.
``` json
// config.json
{
  "credentials": {
    "sandbox": {
      "domain": "circuitsandbox.net",
      "client_id": "<client_id>",
      "client_secret": "<client_secret>"
    },
    "eu": {
      "domain": "eu.yourcircuit.com",
      "client_id": "<client_id>",
      "client_secret": "<client_secret>"
    }
  },
  "webserver": {
    "port": 1337
  },
  "system": "sandbox"
}

```

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080 for development of web app
cd vue-app
npm run dev

# build web app for production with minification
cd vue-app
npm run build
```
