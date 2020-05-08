const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

module.exports = function runCommand ({logger, command, defaultSpawnOptions}) {
  return new Promise((res, rej) => {
    const cmd = command;
    cmd[2] = { ...defaultSpawnOptions, ...cmd[2] };
    const x = Reflect.apply(spawn, null, cmd);

    x.stderr.on('data', (chunk) => {
      if (logger && logger.error) {
        logger.error(chunk);
      }
    })
    x.stdout.on('data', (chunk) => {
      if (logger && logger.log) {
        logger.log(chunk)
      }
    })
    x.on('error', rej);
    x.on('close', res);
  });
}