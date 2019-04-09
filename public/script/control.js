'use strict'

let controlCanvas = document.getElementById('control');
const socket = io.connect('http://localhost:3000');
const debugThrottle = document.getElementById('debugThrottle');
const debug = false;
let throttle = 0;
let yawing = 0;
const throttleControlInterval = 750;
const yawingControlInterval = 750;
const throttleMinInterval = 120;
const yawingMinInterval = 120;
const yawingPlay = 20;

const logging = (...args) => {
  if (debug) {
    console.log(...args)
  }
};

// ------------------------
//
// emitter
// ------------------------
const throttleEmitTimer = setInterval(() => {
  socket.emit('throttle', throttle);
}, throttleControlInterval);

const yawingEmitTimer = setInterval(() => {
  socket.emit('yawing', yawing);
}, yawingControlInterval);

// ------------------------
//
// Calculator
// ------------------------
const calcThrottleFromForce = (force) => {
  let powerCoefficient = force - 1.0;
  if (powerCoefficient > 1.0) {
    powerCoefficient = 1.0;
  }
  const maxPower = 255;
  let powerLimit = 216;
  if (highPowerMode) {
    powerLimit = 255;
  }
  return Math.floor(powerCoefficient * powerLimit);
};

const calcYawingFromDiffX = (diffX) => {
  if (diffX > yawingPlay) {
    return 0x80;
  } else if (diffX < yawingPlay * -1){
    return 0x7f;
  }
  return 0
}

// ------------------------
//
// Mouse Control
// ------------------------
let baseClientX = null;
let baseClientY = null;
let highPowerMode = false;
let killSwitch = false;

let mouseMoveLockTimer = null;
const mouseMoveHandler = (e) => {
  if (mouseMoveLockTimer != null) {
    return;
  }
  if (baseClientX === null || baseClientY === null) {
    return;
  }
  const diffX = baseClientX - e.clientX;
  const diffY = baseClientY - e.clientY;
  yawing = calcYawingFromDiffX(diffX);
  if (mouseMoveLockTimer != null ) {
    return;
  }
  socket.emit('yawing', yawing);
  mouseMoveLockTimer = setTimeout(() => {
    mouseMoveLockTimer = null;
  }, yawingMinInterval);
}

const mouseDownHandler = (e) => {
  baseClientX = e.clientX;
  baseClientY = e.clientY;
}

const mouseUpHandler = (e) => {
  baseClientX = null;
  baseClientY = null;
  throttle = 0;
  yawing = 0;
}

let mouseForceChangeLockTimer = null;
const mouseForceWillBeginHandler = (e) => {
  // cancel system default behavior
  e.preventDefault();
}

const mouseForceChangedHandler = (e) => {
  if (killSwitch) {
    throttle = 0;
    return;
  }
  throttle = calcThrottleFromForce(e.webkitForce);
  if (mouseForceChangeLockTimer != null) {
    return;
  }
  mouseForceChangeLockTimer = setTimeout(() => {
    mouseForceChangeLockTimer = null;
    debugThrottle.textContent = throttle;
    socket.emit('throttle', throttle);
  }, throttleMinInterval);
}

const keyUpHandler = (e) => {
  if (e.key === 'Shift') {
    highPowerMode = false;
    logging(`highPowerMode: ${highPowerMode}`);
  }
  if (e.code === 'Space') {
    killSwitch = false;
    logging(`killSwitch: ${killSwitch}`);
  }
}
const keyDownHandler = (e) => {
  if (e.key === 'Shift') {
    highPowerMode = true;
    logging(`highPowerMode: ${highPowerMode}`);
  }
  if (e.code === 'Space') {
    killSwitch = true;
    logging(`killSwitch: ${killSwitch}`);
  }
}

// Setup mousemove handler
const mouseEventThrottlingInterval = 200
let mouseMoveThrottling = false
controlCanvas.addEventListener('mousemove', (e) => {
  if (mouseMoveThrottling) {
    return
  }
  mouseMoveThrottling = true
  setTimeout(()=>{
      mouseMoveThrottling = false
  }, mouseEventThrottlingInterval)
  mouseMoveHandler(e)
});
controlCanvas.addEventListener('mousedown', mouseDownHandler);
controlCanvas.addEventListener('mouseup', mouseUpHandler);
controlCanvas.addEventListener('webkitmouseforcewillbegin ', mouseForceWillBeginHandler);
controlCanvas.addEventListener('webkitmouseforcechanged', mouseForceChangedHandler);
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// Trigger update control size onresize
let resizeTimer = null;
const setControlSize = (innerHeight, innerWidth) => {
    controlCanvas.width = innerWidth;
    controlCanvas.height = innerHeight;
    controlCanvas.style.width = innerWidth;
    controlCanvas.style.height = innerHeight;
}

window.onresize = (...data) => {
  if (resizeTimer != null) {
    clearTimeout(resizeTimer);
  }

  resizeTimer = setTimeout(()=>{
    resizeTimer = null;
    const {innerHeight, innerWidth} = window;
    setControlSize(innerHeight, innerWidth);
  }, 250)
};

// initial setup for control size
const {innerHeight, innerWidth} = window;
setControlSize(innerHeight, innerWidth);

// ------------------------
//
// Controller view
// ------------------------

const ctx = controlCanvas.getContext('2d');
setInterval(() => {
  const {innerHeight, innerWidth} = window;
  ctx.beginPath();
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.fill();
  if (baseClientX === null || baseClientY === null) {
    return;
  }
  const startRad = 120;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgb(99, 99, 99)";
  ctx.beginPath()
  // throttle gudie
  ctx.arc(baseClientX, baseClientY, 62, startRad * Math.PI / 180, (startRad + 255) * Math.PI / 180, false)
  // horizontal line
  ctx.moveTo(baseClientX + yawingPlay, baseClientY)
  ctx.lineTo(baseClientX - yawingPlay, baseClientY)
  // vertical line
  ctx.moveTo(baseClientX, baseClientY + yawingPlay)
  ctx.lineTo(baseClientX, baseClientY - yawingPlay)
  ctx.stroke();

  // yaw
  ctx.beginPath();
  ctx.moveTo(baseClientX, baseClientY);
  if (0x4f < yawing && yawing <= 0x7f) {
    ctx.arc(baseClientX, baseClientY, yawingPlay, 345 * Math.PI / 180, 375 * Math.PI / 180, false)
  } else if (0x80 <= yawing && yawing < 0xb0) {
    ctx.arc(baseClientX, baseClientY, yawingPlay, 165 * Math.PI / 180, 195 * Math.PI / 180, false)
  }
  ctx.fillStyle = "rgb(0, 33, 152)"
  ctx.fill();
  ctx.closePath();
  ctx.stroke();


  // throttle
  ctx.beginPath()
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgb(255, 66, 66)";
  ctx.arc(baseClientX, baseClientY, 60, startRad * Math.PI / 180, (startRad + throttle) * Math.PI / 180, false)
  ctx.stroke();
}, 16)
