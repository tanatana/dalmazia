'use strict'

const noble = require('noble')
let cancelScanning = null;
const outputRate = 33; // percent

function sleep(msec) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, msec);
  });
}

class MoskitoAdapter {
  constructor() {
    this.throttle = new Buffer(1);
    this.yawing = new Buffer(1);
    this.throttleCh = null;
    this.yawingCh = null;
    this.eventCounter = 0;
    this.invertOutputRate = Math.floor(100 / outputRate)

    this.scanningOutputTimer = null;
    this.scanningTimeOutTimer = null;
    noble.on('scanStart', () => {
      console.log('scan start');
    })
    noble.on('scanStop', () => {
      console.log('scan stop');
    })
  }

  async initConnect(peripheral) {
    return new Promise((resolve, reject) => {
      peripheral.connect((err) => {
        if (err !== undefined) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async initDiscoverAllServicesAndCharacteristics(peripheral) {
    return new Promise((resolve, reject) => {
      peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
        if (err !== null) {
          reject(err);
          return;
        }

        characteristics.forEach((characteristic) => {
          if (characteristic.uuid  === '75b64e5100104ed1921a476090d80ba7') {
            this.throttleCh = characteristic;
          } else if (characteristic.uuid  === '75b64e5100214ed1921a476090d80ba7') {
            this.yawingCh = characteristic;
          }
        });
        if (this.throttleCh == null || this.yawingCh == null) {
          reject('error: cannot find target characteristic');
          return;
        }
        resolve('ready!');
      });
    });
  }

  async init() {
    return new Promise((resolve, reject) => {
      noble.on('discover', async (p) => {
        if (p.advertisement === undefined) {
          return;
        }
        if (p.advertisement.localName !== 'TobyRich Moskito') {
          return;
        }
        clearInterval(this.scanningOutputTimer);
        clearTimeout(this.scanningOutputTimer);
        noble.stopScanning();

        try {
          await this.initConnect(p);
        } catch(e) {
          reject(`initConnect: ${e}`);
        }
        let message = '';
        try {
          message = await this.initDiscoverAllServicesAndCharacteristics(p);
        } catch(e) {
          reject(`initDiscoverAllServicesAndCharacteristics: ${e}`);
        }

        resolve(message);
      });

      noble.startScanning();
      this.scanningOutputTimer = setInterval(() => {
        console.log('scanning...')
      }, 1500)
      this.scanningTimeOutTimer = setTimeout(() => {
        clearInterval(this.scanningOutputTimer);
        noble.stopScanning();
        reject('scanning timeout')
      }, 30 * 1000)
    });
  }

  setThrottle(power) {
    if (power > 255) {
      power = 255;
    } else if (power < 0) {
      power = 0;
    }
    this.throttle.fill(power);
    this.throttleCh.write(this.throttle, false)

    if (this.eventCounter % this.invertOutputRate == 0) {
      console.log(`[frame ${this.eventCounter}] setThrottle: ${power}`);
    }
    this.eventCounter += 1;
  }

  setYawing(yawing) {
    if (yawing > 255) {
      yawing = 255;
    } else if (yawing < 0) {
      yawing = 0;
    }
    this.yawing.fill(yawing);
    this.yawingCh.write(this.yawing, false)

    if (this.eventCounter % this.invertOutputRate == 0) {
      console.log(`[frame ${this.eventCounter}] setYawing: ${yawing}`);
    }
    this.eventCounter += 1;
  }
}

exports.MoskitoAdapter = MoskitoAdapter
