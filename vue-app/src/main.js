import Vue from 'vue'
import App from './App.vue'
import './../node_modules/jquery/dist/jquery.min.js';
import './../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './../node_modules/popper.js/dist/umd/popper.js';

new Vue({
  el: '#app',
  render: h => h(App)
})
