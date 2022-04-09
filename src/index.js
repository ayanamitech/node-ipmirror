const process = require('process');
const fastify = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyStatic = require('fastify-static');
const fastifyMulti = require('fastify-multipart');
const path = require('path');
const qs = require('qs');
const isIP = require('net').isIP;
const geoip = require('geoip-lite');
const fs = require('fs');
const util = require('util');
const { pipeline } = require('stream');
const pump = util.promisify(pipeline);

const { timeFromFile } = require('./libs');
const checkSyncClone = require('./syncClone');
const updateDBfromMaxmind = require('./syncMaxmind');
const IPBlacklist = require('./blacklist');

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

const IPMirror = (config) => {
  const app = fastify({
    querystringParser: str => qs.parse(str)
  });
  // Define CORS for requests from browser
  app.register(fastifyCors, () => {
    return (req, callback) => {
      const corsOptions = {
        origin: req.headers.origin || '*',
        credentials: true,
        methods: ['GET, POST, OPTIONS'],
        headers: ['DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type']
      };
      callback(null, corsOptions);
    };
  });
  // Serve static data files
  app.register(fastifyStatic, {
    root: path.join(__dirname + '/node_modules/geoip-lite/data')
  });
  app.register(fastifyMulti);
  app.get('/', { schema: {
    querystring: {
      ip: {
        type: 'string'
      }
    }
  }}, (req, reply) => {
    const ipAddress = req.headers['x-real-ip'] || req.raw.connection.remoteAddress;
    const checkQuery = isIP(req.query.ip) ? req.query.ip : ipAddress;
    const geoInfo = geoip.lookup(checkQuery) || {};
    geoInfo.ip = checkQuery;
    geoInfo.userAgent = req.headers['user-agent'];
    geoInfo.syncedDate = global.syncedDate;
    geoInfo.maxmind = 'Database by MaxMind https://www.maxmind.com/';
    reply.send(geoInfo);
  });
  app.get('/json', { schema: {
    querystring: {
      ip: {
        type: 'string'
      }
    }
  }}, (req, reply) => {
    const ipAddress = req.headers['x-real-ip'] || req.raw.connection.remoteAddress;
    const checkQuery = isIP(req.query.ip) ? req.query.ip : ipAddress;
    const geoInfo = geoip.lookup(checkQuery) || {};
    geoInfo.ip = checkQuery;
    geoInfo.userAgent = req.headers['user-agent'];
    geoInfo.syncedDate = global.syncedDate;
    geoInfo.maxmind = 'Database by MaxMind https://www.maxmind.com/';
    reply.send(geoInfo);
  });
  // (Optional) Handle geoip database upload from remote location
  if (config.password) {
    const blacklist = new IPBlacklist();
    app.post('/upload', async (req, reply) => {
      const ipAddress = req.headers['x-real-ip'] || req.raw.connection.remoteAddress;
      // Check if the authorization header exists
      if (blacklist.getStatus(ipAddress) || req.headers.authorization !== config.password) {
        blacklist.registerBlacklist(ipAddress);
        reply.code(403).send({error: 'unauthenticated'});
        return;
      }
      if (!req.isMultipart()) {
        reply.code(400).send({error: 'not multipart'});
        return;
      }

      const parts = req.files();

      for await (const part of parts) {
        await pump(part.file, fs.createWriteStream('./node_modules/geoip-lite/data/' + part.filename));
      }
      geoip.reloadDataSync();
      global.syncedDate = timeFromFile();
      reply.code(200).send({ syncedDate: global.syncedDate });
      console.log('Updated DB to', global.syncedDate, 'by', ipAddress);
    });
  }
  // Listen fastify on port
  app.listen(config.port || 3000, config.listen || '0.0.0.0', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('IPMirror Server is now listening on', address);
  });
  // Sync geoip data with other ipmirror instance
  if (config.clone) {
    checkSyncClone(config.clone, geoip.reloadDataSync());
    // Update geoIP DB from remote server every 24 hours
    setInterval(() => {
      checkSyncClone(config.clone, geoip.reloadDataSync());
    }, config.interval || 86400000);
  // If api key from maxmind exists, try syncing data with maxmind
  } else if (config.api) {
    updateDBfromMaxmind(config.api, geoip.reloadDataSync());
    // Update geoIP DB from Maxmind every 24 hours
    setInterval(() => {
      updateDBfromMaxmind(config.api, geoip.reloadDataSync());
    }, config.interval || 86400000);
  } else {
    // If remote geoip raw server nor api key isn't available, listen on file changes instead
    geoip.startWatchingDataUpdate();
  }
};

module.exports = IPMirror;
