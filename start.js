const process = require('process');
const IPMirror = require('./index');

// load config from .env
require('dotenv').config();

const config = {
  address: process.env.ADDRESS,
  port: process.env.PORT,
  clone: process.env.DB_SERVER,
  api: process.env.LICENSE_KEY,
  interval: process.env.DB_INTERVAL,
  password: process.env.PASSWORD
};

IPMirror(config);
