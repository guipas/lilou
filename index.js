const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

const runCommand = require('./lib/runCommand');
const colors = require('./lib/colors');
const cleanString = require('./lib/cleanString');

const job = process.argv[2];

console.log('----')
console.log('argv: ', process.argv);
console.log('running job', job);
console.log('----');

(async () => {

  if (job) {
    const jobFile = path.resolve(__dirname, 'jobs', `${job}.json`);

    if (fs.existsSync(jobFile)) {
      const jobConfig = JSON.parse(fs.readFileSync(jobFile));

      // console.log('jobs: ', jobConfig);
      const defers = [];
      let j = 0;

      for (const job in jobConfig.commands) {
        const maybeCommand = jobConfig.commands[job];
        const mainCommand = Array.isArray(maybeCommand) ? maybeCommand : maybeCommand.command;
        const preCommands = !Array.isArray(maybeCommand) && Array.isArray(maybeCommand.pre) ? maybeCommand.pre : [];
        const color = colors[j % colors.length];
        const log = (...args) => console.log(chalk[color](...args));
        const error = (...args) => console.log(chalk.red(...args));

        log(`[${job}]`, preCommands.length > 0 ? `${preCommands.length} pre jobs` : `No pre job`);

        let i = 1;
        for (const pre of preCommands) {
          log(`[${job}] [pre] ---`);
          log(`[${job}] [pre] running pre job ${i++}`);
          await runCommand({
            command: pre,
            logger: {
              log: (...args) => log(`[${job}] [pre] `, ...args.map(a => cleanString(a))),
              error: (...args) => error(`[${job}] [pre]`, ...args.map(a => cleanString(a))),
            },
            defaultSpawnOptions: jobConfig.defaultSpawnOptions || {},
          })
        } 

        // console.log('trying to spawn', command);
        defers.push(
          runCommand({
            command: mainCommand,
            logger: {
              log: (...args) => log(`[${job}] `, ...args.map(a => cleanString(a))),
              error: (...args) => error(`[${job}] `, ...args.map(a => cleanString(a))),
            },
            defaultSpawnOptions: jobConfig.defaultSpawnOptions || {},
          })
          .finally(() => {
            log(`[${job}] exited `);
          })
        );

        j++;
      }

      await Promise[jobConfig.exitStrategy || 'all'](defers);
    }
    
  }
  
})()
.then(() => {
  console.log('finished')
  process.exit(0);
})
.catch(e => {
  console.error(e);
  process.exit(1);
})
