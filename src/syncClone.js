const fs = require('fs');
const axios = require('axios');
const { parseSyncedTime, timeFromFile } = require('./libs');

// wget, curl replacement in axios
const downloadFromClone = async (url, file) => {
  try {
    const writer = fs.createWriteStream('./node_modules/geoip-lite/data/' + file);
    const response = await axios({
      url: url + '/' + file,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        console.error(err);
        reject();
      });
    });
  } catch (error) {
    console.error(error);
  }
};

const updateDBfromClone = async (remoteServer) => {
  // Update file from remote server (To save hardware resources, spawn another server to update geoip from MaxMind)
  const syncFiles = global.fileList.map((files) => {
    return downloadFromClone(remoteServer , files);
  });
  await Promise.all(syncFiles);
};

const compareWithClone = async (url) => {
  try {
    global.syncedDate = timeFromFile();
    const response = await axios({
      url: url + '/city.checksum',
      method: 'GET',
      responseType: 'arraybuffer'
    });
    const serverDate = parseSyncedTime(response.data);
    global.onSync = (global.syncedDate !== serverDate) ? false : true;
  } catch (error) {
    console.error(error);
    throw new Error('Error while fetching checksum');
  }
};

const checkSyncClone = async (url, callback) => {
  await compareWithClone(url);
  if (!global.onSync) {
    console.log('DB sync started');
    await updateDBfromClone(url);
    if (callback) {
      callback();
    }
    global.syncedDate = timeFromFile();
  }
  console.log('DB on sync');
};

module.exports = checkSyncClone;
