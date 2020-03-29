'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const logger = new console.Console({
  stdout: process.stdout,
  stderr: process.stderr
});


const tmpPath = '/tmp/rpnd';
const statuspath = tmpPath + '/status';
const confpath = tmpPath + '/config';

const args = process.argv.slice(2);
const logmode = {
  quiet: args.includes('-q'),
  error: !args.includes('-q'),
  warn: (args.includes('-w') || args.includes('-i') || args.includes('-d')) && !args.includes('-q'),
  info: (args.includes('-i') || args.includes('-d')) && !args.includes('-q'),
  debug: args.includes('-d') && !args.includes('-q'),
  monitor: args.includes('-m'),
};


var RPND = {};

RPND.tmpPath = tmpPath;

RPND.log = (...a) => {
  if (!logmode.quiet) logger.log(...a);
}

RPND.info = (...a) => {
  if (logmode.info) logger.log(...a);
}

RPND.warn = (...a) => {
  if (logmode.warn) logger.warn(...a);
}

RPND.error = (...a) => {
  if (logmode.warn) logger.error(...a);
}

RPND.debug = (...a) => {
  if (logmode.debug) logger.debug(...a);
}
RPND.debugObj = (caption, obj) => {
  if (logmode.debug) {
    logger.log(caption);
    logger.dir(obj, {
      depth: 8
    });
  }
}


RPND.status = {
  'rpnd': {
    'mode': 'starting'
  },
}

var updateStatus = () => {
  try {
    fs.writeFileSync(statuspath, JSON.stringify(RPND.status) + '\n');
  } catch (e) {
    RPND.log('Status file error', e);
    sint.cancel();
  }
}

RPND.mods = [];

module.exports = RPND

RPND.start = () => {

  RPND.info('Main starting');

  fs.mkdirSync(tmpPath, {
    recursive: true
  });

  const uciConfig = require('./config-uci').loadConfig();

  var modsAvailable = fs.readdirSync(path.dirname(require.main.filename) + '/modules').filter(fn => fn.endsWith('.js')).map(m => m.slice(0, -3));
  var modsEnabled = ['mqtt', 'idle'].concat(uciConfig.rpnd.modules_enabled || []);
  modsEnabled = (modsEnabled || modsAvailable).filter(value => modsAvailable.includes(value));

  var modsLoaded = [];

  RPND.debug('Mods Enabled', modsEnabled);
  for (var modName of modsEnabled) {
    RPND.info('Load ' + modName);
    modsLoaded.push({
      name: modName,
      mod: require('./modules/' + modName)
    });
  }

  modsLoaded = modsLoaded.sort((a, b) => (b.mod.priority || 0) - (a.mod.priority || 0));

  RPND.debugObj('Uci Config...', uciConfig);

  var config = {
    sys: uciConfig.sys
  };
  config.sys.mods_enabled = modsEnabled.join(', ');

  for (var unit of modsLoaded) {
    var modConfig = unit.mod.uciConfig && unit.mod.uciConfig(uciConfig);
    if (modConfig) {
      config[unit.name] = modConfig;
      RPND.info('Config ' + unit.name);
      RPND.mods.push(unit.name);
      RPND[unit.name] = unit.mod;
      RPND.status[unit.name] = unit.mod.status || 'unavailable';
    }
  }
  RPND.status.rpnd.mods_loaded = RPND.mods.join(', ');
  updateStatus();

  try {
    fs.writeFileSync(confpath, JSON.stringify(config, null, 1) + '\n');
  } catch (e) {
    RPND.log('Config file error', e);
  }

  RPND.debugObj('Configured...', config);

  for (var modName of RPND.mods) {
    RPND.info('Run ' + modName);
    RPND[modName].run(RPND);
  }

  RPND.info('Running!');
  if (logmode.monitor) RPND.log('\x1b[2J');
  var sint = setInterval(() => {
    if (logmode.monitor) {
      RPND.log('\x1b[?25l\x1b[1;1H');
      RPND.log(util.inspect(RPND.status, {
        depth: 8,
        colors: true
      }).replace(/\n/g, '\x1b[0K\n'));
    }
    updateStatus();
  }, 1000);

  if (logmode.monitor) {
    process.on('SIGINT', () => {
      logger.log('\x1b[?25h\x1b[39m');
      process.exit();
    });
  }
  RPND.status.rpnd.mode = 'running';

  var exit = (reason) => {
    RPND.status.rpnd.mode = reason;
    updateStatus();
    process.exit();
  }
  process.on('SIGTERM', (() => exit('terminated')));
  process.on('SIGINT', (() => exit('interupted')));
}

if (require.main === module) RPND.start();
