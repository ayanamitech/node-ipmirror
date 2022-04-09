const childProcess = require('child_process');
const { timeFromFile } = require('./libs');

const runUpdateDB = (MAXMIND_API_KEY) => {
  return new Promise((resolve, reject) => {
    try {
      const process = childProcess.fork('./node_modules/geoip-lite/scripts/updatedb.js', [], { env: { LICENSE_KEY: MAXMIND_API_KEY } });

      let invoked;

      process.on('error', (err) => {
        if (invoked) return;
        invoked = true;
        console.error(err);
        reject(err);
      });

      process.on('exit', (code) => {
        if (invoked) return;
        invoked = true;
        const err = code === 0 ? null : new Error('exit code', code);
        resolve(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const updateDBfromMaxmind = async (MAXMIND_API_KEY, callback) => {
  try {
    await runUpdateDB(MAXMIND_API_KEY);
    if (callback) {
      callback();
    }
    global.syncedDate = timeFromFile();
  } catch (error) {
    console.error(error);
  }
};

module.exports = updateDBfromMaxmind;
