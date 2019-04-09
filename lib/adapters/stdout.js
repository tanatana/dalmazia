'use strict'

class StdoutAdapter {
  constructor() {
    this.throttleCh = null;
    this.yawingCh = null;
    this.throttleCounter = 0;
    this.yawingCounter = 0;
    this.outputRate = 25; // percent

    console.log('StdoutAdapter ready');
  }

  setThrottle(power) {
    if (power > 255) {
      power = 255;
    } else if (power < 0) {
      power = 0;
    }
    let invertOutputRate = Math.floor(100 / this.outputRate)
    if (this.throttleCounter % invertOutputRate == 0) {
      console.log(`[frame ${this.throttleCounter}] setThrottle: ${power}`);
    }
    this.throttleCounter += 1;
  }

  setYawing(yawing) {
    if (yawing > 255) {
      yawing = 255;
    } else if (yawing < 0) {
      yawing = 0;
    }
    let invertOutputRate = Math.floor(100 / this.outputRate)
    if (this.yawingCounter % invertOutputRate == 0) {
      console.log(`[frame ${this.yawingCounter}] setYawing: ${yawing}`);
    }
    this.yawingCounter += 1;
  }
}

exports.StdoutAdapter = StdoutAdapter
