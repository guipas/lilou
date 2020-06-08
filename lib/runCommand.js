const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

module.exports = function runCommand ({logger, command, defaultSpawnOptions}) {
  const cmd = command;
  cmd[2] = { ...defaultSpawnOptions, ...cmd[2] };
  const child = Reflect.apply(spawn, null, cmd);

  child.stderr.on('data', (chunk) => {
    if (logger && logger.error) {
      logger.error(chunk);
    }
  })
  child.stdout.on('data', (chunk) => {
    if (logger && logger.log) {
      logger.log(chunk)
    }
  })
  

  return {
    child,
    promise: new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    })
  }
}