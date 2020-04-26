const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const job = process.argv[2];

console.log('----')
console.log('argv: ', process.argv);
console.log('running job', job);
console.log('----')

function cleanString (str) {
  const replacements = [
    [/\n+$/, ''],
    ['\033c', '']
  ];

  let cleanedString = str.toString();
  for (const replacement of replacements) {
    cleanedString = cleanedString.replace(...replacement);
  }

  return cleanedString;
}

function runCommand ({logger, command, defaultSpawnOptions}) {
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

(async () => {

  if (job) {
    const jobFile = path.resolve(__dirname, 'jobs', `${job}.json`);

    if (fs.existsSync(jobFile)) {
      const jobList = JSON.parse(fs.readFileSync(jobFile));

      console.log('jobs: ', jobList);
      const defers = [];

      for (const job in jobList.commands) {
        const maybeCommand = jobList.commands[job];
        const command = Array.isArray(maybeCommand) ? maybeCommand : maybeCommand.command;
        const pres = !Array.isArray(maybeCommand) && Array.isArray(maybeCommand.pre) ? maybeCommand.pre : [];

        console.log(`[${job}]`, pres.length > 0 ? `${pres.length} pre jobs` : `No pre job`);

        let i = 1;
        for (const pre of pres) {
          console.log(`[${job}] running pre job ${i++}`);
          await runCommand({
            command: pre,
            logger: {
              log: (...args) => console.log(`[${job}] [pre] `, ...args.map(a => cleanString(a))),
              error: (...args) => console.error(`[${job}] [pre]`, ...args.map(a => cleanString(a))),
            },
            defaultSpawnOptions: jobList.defaultSpawnOptions || {},
          })
        } 

        // console.log('trying to spawn', command);
        defers.push(runCommand({
          command,
          logger: {
            log: (...args) => console.log(`[${job}] `, ...args.map(a => cleanString(a))),
            error: (...args) => console.error(`[${job}] `, ...args.map(a => cleanString(a))),
          },
          defaultSpawnOptions: jobList.defaultSpawnOptions || {},
        }));
      }

      await Promise.all(defers);
    }

  }

})()
.catch(e => {
  console.error(e);
  process.exit(1);
})
