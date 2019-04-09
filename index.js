'use strict'

const noble = require('noble');
let cancelScanning;

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

noble.on('discover', (p) => {
  if (p.advertisement !== undefined) {
    if (p.advertisement.localName === 'TobyRich Moskito') {
      clearTimeout(cancelScanning);
      noble.stopScanning();
      console.log(p.advertisement.localName);
      p.connect((err) => {
        console.log('connect error', err);
        p.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
          console.log(`error: '${err}'`);
          // console.log(services)
          // console.log('================')
          // console.log(characteristics)
          let throttleCh = null;
          let yawingCh = null;
          characteristics.forEach((characteristic) => {
            if (characteristic.uuid  === '75b64e5100104ed1921a476090d80ba7') {
              throttleCh = characteristic;
            } else if (characteristic.uuid  === '75b64e5100214ed1921a476090d80ba7') {
              yawingCh = characteristic;
            }
          })
          if (throttleCh == null || yawingCh == null) {
            console.log('error: cannot find target characteristic');
            return
          }
          console.log(throttleCh, yawingCh);
          let throttle = new Buffer(1);
          console.log('======================');
          for (let i = 0; i < 400; i += 1) {
            (async () => {
              await sleep(40 * i);
              let c = Math.sin(2*Math.PI/24*i)
              let diff = Math.floor(120 * c)
              let power = 130 + diff
              throttle.fill(power);
              throttleCh.write(throttle, false)
              console.log(throttle);
            })()
          }
        });
      });
    }
  }
});
noble.on('scanStart', () => {
  console.log('scan start');
})
noble.on('scanStop', () => {
  console.log('scan stop');
})
noble.startScanning();

cancelScanning = setInterval(() => {
  console.log('scanning...')
}, 1500)
setTimeout(() => {
  clearInterval(cancelScanning);
  noble.stopScanning();
}, 25000)
