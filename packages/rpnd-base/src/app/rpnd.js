'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const logger = new console.Console({
	stdout: process.stdout,
	stderr: process.stderr
})

const tmpPath = '/tmp/rpnd'
const statusPath = tmpPath + '/status'
const confPath = tmpPath + '/config'

const args = process.argv.slice(2)
const logMode = {
	quiet: args.includes('-q'),
	error: !args.includes('-q'),
	warn: (args.includes('-w') || args.includes('-i') || args.includes('-d')) && !args.includes('-q'),
	info: (args.includes('-i') || args.includes('-d')) && !args.includes('-q'),
	debug: args.includes('-d') && !args.includes('-q'),
	monitor: args.includes('-m')
}

var RPND = {}

RPND.tmpPath = tmpPath

RPND.log = (...a) => {
	if (!logMode.quiet) logger.log(...a)
}

RPND.info = (...a) => {
	if (logMode.info) logger.log(...a)
}

RPND.warn = (...a) => {
	if (logMode.warn) logger.warn(...a)
}

RPND.error = (...a) => {
	if (logMode.warn) logger.error(...a)
}

RPND.debug = (...a) => {
	if (logMode.debug) logger.debug(...a)
}

RPND.debugObj = (caption, obj) => {
	if (logMode.debug) {
		logger.log(caption)
		logger.dir(obj, {
			depth: 8
		})
	}
}

RPND.status = {
	'rpnd': {
		'mode': 'starting'
	}
}

var updateStatus = () => {
	try {
		fs.writeFileSync(statusPath, JSON.stringify(RPND.status) + '\n')
	} catch (e) {
		RPND.log('Status file error', e)
	}
}

RPND.mods = []

module.exports = RPND

RPND.start = () => {
	RPND.info('Main starting')

	fs.mkdirSync(tmpPath, {
		recursive: true
	})

	const uciConfig = require('./config-uci').loadConfig()

	RPND.debugObj('Uci Config...', uciConfig)

	var modsAvailable = fs.readdirSync(path.dirname(require.main.filename) + '/modules').filter(fn => fn.endsWith('.js')).map(m => m.slice(0, -3))
	RPND.debug('Mods available', modsAvailable)
	var modsEnabled = [] //['mqtt', 'idle'].concat(uciConfig.rpnd.modules_enabled || [])

	for (let mod in uciConfig) {
		if (uciConfig[mod].disabled != 1 && modsAvailable.includes(mod)) {
			modsEnabled.push(mod)
		}  
	}
	RPND.debug('Mods Enabled', modsEnabled)

	var modsLoaded = []

	for (var modName of modsEnabled) {
		RPND.info('Load ' + modName)
		modsLoaded.push({
			name: modName,
			mod: require('./modules/' + modName)
		})
	}

	modsLoaded = modsLoaded.sort((a, b) => (b.mod.priority || 0) - (a.mod.priority || 0))
	RPND.debug('Mods Loaded', modsLoaded)

	var config = {
		rpnd: uciConfig.rpnd
	}
	config.rpnd.mods_enabled = modsEnabled.join(', ')

	for (var unit of modsLoaded) {
		var modConfig = unit.mod.uciConfig && unit.mod.uciConfig(uciConfig)
		if (modConfig) {
			config[unit.name] = modConfig
			RPND.info('Config ' + unit.name)
			RPND.mods.push(unit.name)
			RPND[unit.name] = unit.mod
			RPND.status[unit.name] = unit.mod.status || 'unavailable'
		}
	}
	RPND.status.rpnd.mods_loaded = RPND.mods.join(', ')
	updateStatus()

	try {
		fs.writeFileSync(confPath, JSON.stringify(config, null, 1) + '\n')
	} catch (e) {
		RPND.log('Config file error', e)
	}

	RPND.debugObj('Configured...', config)

	for (var modNme of RPND.mods) {
		RPND.info('Run ' + modNme)
		RPND[modNme].run(RPND)
	}

	RPND.info('Running!')
	if (logMode.monitor) RPND.log('\x1b[2J')
	setInterval(() => {
		if (logMode.monitor) {
			RPND.log('\x1b[?25l\x1b[1;1H')
			RPND.log(util.inspect(RPND.status, {
				depth: 8,
				colors: true
			}).replace(/\n/g, '\x1b[0K\n'))
		}
		updateStatus()
	}, 1000)

	if (logMode.monitor) {
		process.on('SIGINT', () => {
			logger.log('\x1b[?25h\x1b[39m')
			process.exit()
		})
	}
	RPND.status.rpnd.mode = 'running'

	var exit = (reason) => {
		RPND.status.rpnd.mode = reason
		updateStatus()
		process.exit()
	}
	process.on('SIGTERM', () => exit('terminated'))
	process.on('SIGINT', () => exit('interrupted'))
}

if (require.main === module) RPND.start()
