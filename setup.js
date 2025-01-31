#!/usr/bin/env node

/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */

const fs = require('fs');
const proc = require('child_process');
const process = require('process');
const readline = require('readline');

let npm = {};

async function exec(cmd, msg) {
  return new Promise((resolve) => {
    if (msg) process.stdout.write(`Running: ${msg} ...`);
    const t0 = process.hrtime.bigint();
    proc.exec(cmd, (err, stdout, stderr) => {
      // if (err) process.stdout.write(`${err}\n`);
      let json = {};
      try {
        json = JSON.parse(`${stdout}${stderr}`);
      } catch { /**/ }
      const t1 = process.hrtime.bigint();
      const ms = Math.trunc(parseFloat((t1 - t0).toString()) / 1000000);
      if (msg) process.stdout.write(`\r${msg} completed in ${ms.toLocaleString()}ms\n`);
      resolve(json);
    });
  });
}

async function deleteExamples() {
  await exec('find node_modules -type d -name "example*" -exec rm -rf {} \\; 2>/dev/null', 'Deleting module samples');
}

let rl;
async function prompt(question) {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function createModels() {
  process.stdout.write('Configuration file not found: models.json\n');
  process.stdout.write('Creating default configuration\n');
  const cfg = JSON.parse(fs.readFileSync('server/default-models.json').toString());
  fs.writeFileSync('models.json', JSON.stringify(cfg, null, 2));
  process.stdout.write('Default models configuration created\n');
}

async function createConfig() {
  process.stdout.write('Configuration file not found: config.json\n');
  process.stdout.write('Creating default configuration\n');
  const cfg = JSON.parse(fs.readFileSync('server/default-config.json').toString());
  let email = await prompt('Enter default admin user email: ');
  if (!email || email.length < 1) email = 'demo@example.com';
  let passwd = await prompt('Enter default admin user password: ');
  if (!passwd || passwd.length < 1) passwd = 'demo';
  cfg.users.push({ email, passwd, admin: true, mediaRoot: 'media/' });
  process.stdout.write(`Using ${cfg.server.mediaRoot} as image root containing sample images\n`);
  process.stdout.write(`Using ${cfg.server.httpPort} as default HTTP server port\n`);
  process.stdout.write(`Using ${cfg.server.httpsPort} as default HTTPS server port\n`);
  fs.writeFileSync('config.json', JSON.stringify(cfg, null, 2));
  process.stdout.write('Default server configuration created\n');
}

async function main() {
  process.stdout.write('Starting Setup\n');
  const f = './setup.json';
  if (!fs.existsSync('./package.json')) {
    process.stdout.write('Not a project home');
    process.exit(1);
  }

  const p = JSON.parse(fs.readFileSync('./package.json').toString());
  process.stdout.write(`${p.name} server v${p.version}\n`);
  process.stdout.write(`Platform=${process.platform} Arch=${process.arch} Node=${process.version}\n`);
  process.stdout.write('Project dependencies\n');
  process.stdout.write(` production: ${Object.keys(p.dependencies || {}).length}\n`);
  process.stdout.write(` development: ${Object.keys(p.devDependencies || {}).length}\n`);
  process.stdout.write(` optional: ${Object.keys(p.optionalDependencies || {}).length}\n`);
  if (fs.existsSync(f)) npm = JSON.parse(fs.readFileSync(f).toString());

  // npm install
  npm.installProd = await exec('npm install --only=prod --json', 'NPM install production modules');
  npm.installDev = await exec('npm install --only=dev --json', 'NPM install development modules');
  // npm.installOpt = await exec('npm install --only=opt --json', 'NPM install optional modules');

  // npm optimize
  npm.update = await exec('npm update --depth=10 --json', 'NPM update modules');
  npm.dedupe = await exec('npm dedupe --json', 'NPM deduplicate modules');
  npm.prune = await exec('npm prune --json', 'NPM prune unused modules');
  npm.audit = await exec('npm audit fix --force --json', 'NPM audit modules');

  // delete examples
  await deleteExamples();

  // npm analyze
  npm.outdated = await exec('npm outdated --depth=5 --json', 'NPM outdated check');
  process.stdout.write(`NPM indirect outdated modules: ${Object.keys(npm.outdated).length}\n`);
  npm.ls = await exec('npm ls --json', 'NPM list full');
  const meta = npm.prune?.audit?.metadata;
  if (!meta || !meta.dependencies) process.stdout.write('Cannor analyze dependencies\n');
  else process.stdout.write(`Total dependencies: production=${meta?.dependencies || 'N/A'} development=${meta?.devDependencies || 'N/A'} optional=${meta?.optionalDependencies || 'N/A'}\n`);

  // create installation log
  let old = [];
  if (fs.existsSync(f)) old = JSON.parse(fs.readFileSync(f).toString());
  if (!Array.isArray(old)) old = [];
  old.push(npm);
  fs.writeFileSync(f, JSON.stringify(npm, null, 2));
  process.stdout.write('Results written to setup.json\n');

  // check & create default configuration
  if (!fs.existsSync('config.json')) await createConfig();
  else process.stdout.write('Server configuration file found: config.json\n');

  // check & create default models
  if (!fs.existsSync('models.json')) await createModels();
  else process.stdout.write('Model configuration file found: models.json\n');

  process.exit(0);
}

main();

/*
#!/bin/bash
echo updating javascripts
cd assets
curl -L https://raw.githubusercontent.com/markedjs/marked/master/lib/marked.esm.js >marked.esm.js
curl -L https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js >mapquest.js
curl -L https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css >mapquest.css
curl -L https://raw.githubusercontent.com/lokesh/color-thief/master/dist/color-thief.umd.js >color-thief.umd.js
curl -L https://raw.githubusercontent.com/Leaflet/Leaflet.heat/gh-pages/dist/leaflet-heat.js >leaflet-heat.js
curl -L https://raw.githubusercontent.com/anvaka/panzoom/master/dist/panzoom.min.js >panzoom.min.js <-- incompatible
*/
