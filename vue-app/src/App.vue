<template>
  <div id="app">
    <img class="logo" src="./assets/clock.png">
    <h1>Circuit Conference Starter</h1>
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <p>Enter conversation ID and date/time for your meeting and make sure the bot (conference.starter@bot.com) is a member of the conversation. The bot will then start the conference at the given time and dial out the conversation members.</p>
        <p>Circuit system: {{system}}</p>
      </div>
    </div>
    <form @submit.prevent="handleSubmit">
      <p v-if="errors.length">
        <b>Please correct the following error(s):</b>
        <ul>
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </p>

      <p v-if="message">
        <b>{{ message }}</b>
      </p>

      <div class="form-group row">
        <div class="col-md-4 offset-md-4">
          <input v-model="data.conv" class="form-control form-control-sm" type="text" placeholder="Conversation ID" id="conv" name="conv">
        </div>
      </div>
      <div class="form-group row">
        <div class="col-md-4 offset-md-4">
          <date-picker v-model="data.date" type="datetime" format="yyyy-MM-dd HH:mm:ss" lang="en" id="date" name="date"></date-picker>
        </div>
      </div>
      <div class="form-group row justify-content-center">
        <div class="col-3">
          <button type="submit" class="btn btn-success btn-sm">Submit</button>
        </div>
      </div>
    </form>

    <h3>What is this?</h3>
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <p>This is a prototype app that uses the Circuit JS SDK to start a conference at a given time and dial out the members.</p>
        <p>In a real deployment of this app, the administrator would integrate exchange (or similar) to automatically schedule the meetings rather than manually adding them.</p>
        <p>The core functionality of this app is not the scheduling part, but the bot starting the conference.</p>
      </div>
    </div>

    <h3>Technical details</h3>
    <h5>Scheduling portal</h5>
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <p>This portal to enter meetings is using <a href="https://vuejs.org/v2/guide/installation.html">vue2</a> with <a href="https://mengxiong10.github.io/vue2-datepicker/">vue2-datepicker</a>. The entered information is then passed to the scheduler module.</p>
      </div>
    </div>
    <h5>Scheduler</h5>
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <p>The scheduler is using <a href="https://www.npmjs.com/package/node-schedule">node-schedule</a> and calls the conference bot at the given time.</p>
      </div>
    </div>
    <h5>Conference Bot</h5>
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <p>The Conference Bot starts the conference and dials out participants. This is not possible in node since node does not support WebRTC. The two options are electron, or headless chrome. There are a couple of electron bot examples already available on <a href="https://github.com/circuit">github.com/circuit</a>, so this bot is using headless chrome using <a href="https://github.com/GoogleChrome/puppeteer">puppeteer</a> instead.</p>
      </div>
    </div>
    <ul>
      <li><a href="http://github.com/circuit/conference-starter/" target="_blank">view on github</a></li>
      <li><a href="http://github.com/circuit-sdk/" target="_blank">circuit-sdk</a></li>
    </ul>
    <div>
  </div>
  </div>
</template>

<script>
import DatePicker from 'vue2-datepicker'

export default {
  name: 'app',
  components: { DatePicker },
  data () {
    return {
      data: {
        conv: null,
        date: null
      },
      system: null,
      message: null,
      errors: []
    }
  },
  created: function () {
    fetch('/system')
      .then(response => response.json())
      .then(data => {
        this.system = data.system;
      });
  },
  methods: {
    checkForm: function (e) {
      if (this.data.conv && this.data.date) {
        return true;
      }
      this.errors = [];
      if (!this.data.conv) {
        this.errors.push('Conversation ID is required.');
      }
      if (!this.data.date) {
        this.errors.push('Date is required.');
      }
      e.preventDefault();
    },
    handleSubmit: function (e) {
      this.message = null;

      fetch('/schedule', {
        method: 'post',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({data: this.data})
      })
      .then(response => {
        this.message = 'Meeting scheduled.';
        this.data.conv = null;
        this.data.date = null;
      })
      .catch(err => {
        console.log('Request failed', err);
      });
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 40px;
}

h1, h2, h3 {
  margin-top: 20px;
  margin-bottom: 20px;
  font-weight: normal;
}

.logo {
  height: 150px;
}

form {
  margin-bottom: 50px;
}
.mx-input {
  height: 31px!important;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
