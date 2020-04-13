const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const job = process.argv[2];

console.log('argv', process.argv);
console.log('job', job);

(async () => {

  if (job) {
    const jobFile = path.resolve(__dirname, 'jobs', `${job}.json`);

    if (fs.existsSync(jobFile)) {
      const jobList = JSON.parse(fs.readFileSync(jobFile));

      console.log('jobs: ', jobList);
      const defers = [];

      for (const job in jobList.commands) {
        const command = jobList.commands[job];
        console.log('trying to spawn', command);
        defers.push(new Promise((res, rej) => {
          const x = Reflect.apply(spawn, null, command);
          x.stderr.on('data', (chunk) => {
            console.log(`[${job}]`, chunk.toString().replace(/\n$/, ''));
          })
          x.stdout.on('data', (chunk) => {
            console.log(`[${job}]`, chunk.toString().replace(/\n$/, ''));
          })
          x.on('error', rej);
          x.on('close', res);
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
