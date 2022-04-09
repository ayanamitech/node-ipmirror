/**
  blacklist.js - Helper library to maintain a small list of IP blacklist

  Instead of using key-value databases or something like sqlite,
  we build and maintain the database that is consisted of a plain json file.

  Designed to behave in a non-blocking I/O manner for listing / unlisting ip to blacklist
**/

const fs = require('fs');

const timeNow = () => { return Math.round(new Date() / 1000); };

const daysToSecond = (d) => { return d * 24 * 60 * 60; };

class IPBlacklist {
  constructor(abuseCount, unbanPeriod, dblocation) {
    // Directory to save JSON database
    this.dblocation = dblocation || './blacklist.json';
    // Ban after this accumulated report
    this.abuseCount = abuseCount || 3;
    // Unban after this period in days
    this.unbanPeriod = unbanPeriod || 30;
    // Safety check for writing file to disk since we don't resolve promises
    this.onWrite = false;
    this.blacklist = this.loadBlackList();
    // Run the cron job to unban IP addresses, runs every 1 hour for default
    setInterval(() => {
      this.unbanCron();
    }, 3600000);
  }

  // Load blacklist to memory in a synchronous manner
  loadBlackList() {
    try {
      const db = fs.readFileSync(this.dblocation, 'utf8');
      return JSON.parse(db);
    } catch (error) {
      return [];
    }
  }

  // Get blacklist stats for specific ip
  getStatus(ip) {
    const ipLookup = this.blacklist.find(i => i.ip === ip);
    if (ipLookup && ipLookup.count > this.abuseCount) {
      return true;
    }
    return false;
  }

  // Sync database with local storage
  updateDatabase() {
    // Safety check for writing a file to disk since we don't resolve promises
    if (!this.onWrite) {
      this.onWrite = true;
      fs.writeFile(this.dblocation, JSON.stringify(this.blacklist, null, 2), (err) => {
        if (err) throw err;
        this.onWrite = false;
      });
    }
  }

  // Register an IP address to the blacklist
  registerBlacklist(ip) {
    const index = this.blacklist.findIndex(object => {
      return object.ip === ip;
    });

    // If abuse record exists
    if (index !== -1) {
      this.blacklist[index].timestamp = timeNow();
      this.blacklist[index].count = this.blacklist[index].count + 1;
      this.updateDatabase();
      return;
    }

    // Create new abuse record
    this.blacklist.push({
      ip,
      timestamp: timeNow(),
      count: 1
    });
    this.updateDatabase();
  }

  // Unregister an IP address to the blacklist
  unregisterBlacklist(ip) {
    const index = this.blacklist.findIndex(object => {
      return object.ip === ip;
    });

    // If abuse record exists
    if (index !== -1) {
      this.blacklist = this.blacklist.filter(b => b.ip !== ip);
      this.updateDatabase();
    }
  }

  // Remove blacklisted IPs after unbanPeriod
  unbanCron() {
    this.blacklist = this.blacklist.filter(b => b.timestamp > timeNow() - daysToSecond(this.unbanPeriod));
    this.updateDatabase();
  }
}

module.exports = IPBlacklist;
