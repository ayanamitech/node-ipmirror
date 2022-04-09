# node-ipmirror

[![NPM Package Version](https://img.shields.io/npm/v/node-ipmirror.svg)](https://npmjs.org/package/node-ipmirror)
[![NPM Package Downloads](https://img.shields.io/npm/dm/node-ipmirror.svg)](https://npmjs.org/package/node-ipmirror)
[![Known Vulnerabilities](https://snyk.io/test/github/ayanamitech/node-ipmirror/badge.svg?style=flat-square)](https://snyk.io/test/github/ayanamitech/node-ipmirror)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Javascript implementation of [IP-Mirror](https://github.com/ayanamitech/ipmirror-js) service

## Why node-ipmirror?

Instead of maintaining & syncing geoip database for every project you import, this project aims to provide a self-hosted, Node.js and [fastify](https://www.fastify.io/) powered webserver to provide the latest, accurate IP database originated from [MaxMind](http://maxmind.com/). (In short, it is a server-side implementation of [geoip-lite](https://github.com/geoip-lite/node-geoip), that would help you to use geoip database with lower RAM & disk footprint with like an App built on React Native).

Some examples that work like node-ipmirror

[echoip](https://github.com/mpolden/echoip) - currently running on [ifconfig.co](https://ifconfig.co/)

Instead of serving beautiful, formatted data with a nice frontend, node-ipmirror only provides you with minified JSON object in RESTful API to reduce loads from the hardware.

## How to install

### Requirements

[Node.js](https://nodejs.org/) (LTS version is recommended)

```bash
# Using Ubuntu
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install & Run from source

To build from source,

```bash
$ git clone https://github.com/ayanamitech/node-ipmirror
$ npm i
```

Register & Obtain the license key from [MaxMind](http://maxmind.com/), in order to update with the latest database

Running node-ipmirror with license key

```bash
$ LICENSE_KEY=<Your MaxMind License Key> npm start
```

It is recommended to run a separate node-ipmirror instance, for syncing DB and a read-only cluster to reduce loads while syncing new DB from MaxMind.

For read-only,

```bash
$ DB_SERVER=<reachable http address of your node-ipmirror instance with license key> npm start
```

It is also possible to use [ipmirror.dev](https://ipmirror.dev) to sync the latest DB data

```bash
$ DB_SERVER=https://ipmirror.dev npm start
```
