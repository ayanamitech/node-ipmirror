const process = require('process');
const axios = require('axios');
const geoip = require('geoip-lite');
const fs = require('fs');
const FormData = require('form-data');
const { timeFromFile, timeFromRemote } = require('../src/libs');
const updateDBfromMaxmind = require('../src/syncMaxmind');

// load config from .env
require('dotenv').config();

global.syncedDate = 20190828;
global.onSync = false;

global.fileList = [
  'city.checksum',
  'country.checksum',
  'geoip-city-names.dat',
  'geoip-city.dat',
  'geoip-city6.dat',
  'geoip-country.dat',
  'geoip-country6.dat'
];

const config = {
  clone: process.env.DB_SERVER,
  api: process.env.LICENSE_KEY,
  password: process.env.PASSWORD
};

if (!(config.clone && config.api && config.password)) {
  throw new Error('Config Error');
}

const readFileToArray = () => {
  const files = global.fileList.map((f) => {
    const file = fs.readFileSync('./node_modules/geoip-lite/data/' + f);
    return {
      filename: f,
      file: file
    };
  });
  return files;
};

const uploadToIPMirror = async (remote, password) => {
  try {
    const files = readFileToArray();
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('files[' + i + ']', files[i].file, { filename: files[i].filename, contentType: 'binary/octect-stream' });
    }
    const raw = await axios({
      url: remote + '/upload',
      method: 'POST',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers : {
        ...data.getHeaders(),
        authorization: password,
      },
      data : data
    });
    const date = raw.data.syncedDate;
    return date;
  } catch (error) {
    console.error(error);
    throw new Error('Error while updating remote DB');
  }
};

const uploadToServer = async () => {
  const remoteDate = await timeFromRemote(config.clone);
  await updateDBfromMaxmind(config.api, geoip.reloadDataSync());
  const maxmindDate = timeFromFile();
  if (maxmindDate > remoteDate) {
    console.log('Uploading', maxmindDate, 'DB to', config.clone);
    const newRemoteDate = await uploadToIPMirror(config.clone, config.password);
    console.log('Previous DB:', remoteDate, 'New DB:', newRemoteDate);
  }
  console.log('Remote server is up to date!');
};

uploadToServer();
