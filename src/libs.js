const fs = require('fs');
const axios = require('axios');

const parseSyncedTime = (buffer) => {
  try {
    // Parse latest synced time from buffer
    // Expected string from buffer: 564ad6a48e935b31381e6225dd2ca4056724909bf88264ed662e5e77ccf397d0  GeoLite2-City-CSV_20220329.zip
    const readFile = buffer.toString().split('\n')[0];
    const latestTime = readFile.split(' ')[2].replace('GeoLite2-City-CSV_', '').replace('.zip', '');
    return Number(latestTime);
  } catch (error) {
    return global.syncedDate;
  }
};

const timeFromFile = () => {
  try {
    const content = fs.readFileSync('./node_modules/geoip-lite/data/city.checksum');
    return parseSyncedTime(content);
  } catch (error) {
    return global.syncedDate;
  }
};

const timeFromRemote = async (remote) => {
  try {
    const raw = await axios.get(remote);
    const result = raw.data.syncedDate;
    return result;
  } catch (error) {
    console.error('Failed to fetch syncedDate from remote server');
    return global.syncedDate;
  }
};

module.exports = {
  parseSyncedTime,
  timeFromFile,
  timeFromRemote
};
