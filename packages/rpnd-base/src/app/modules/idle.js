/**
 * http://usejsdoc.org/
 */

const fs = require('fs')
const rpnd = require('../rpnd')

var Midle = {}
var config

Midle.status = {
	'uptime': 0,
	'temp': 0.0
}

Midle.uciConfig = (uciConf) => {
	config = {
		pattern: (uciConf.idle && uciConf.idle.pattern) || [1, 19],
		ident_topic: uciConf.rpnd.root_topic + 'ident'
	}
	return config
}

var ledOn = (level) => {
	try {
		fs.writeFileSync('/sys/class/leds/led0/brightness', level ? '0' : '1')
	} catch (e) { }
}

var uptime = 0
var date = new Date(0)

Midle.run = function () {
	rpnd.info('M-Idle starting')
	var ticks = 0
	var level = 0
	var cycle = 0
	var pattern = config.pattern

	setInterval(() => {
		if (ticks > 0) {
			--ticks
		} else {
			level = (level + 1) % 2
			ledOn(level)
			ticks = pattern[cycle]
			cycle = ++cycle % pattern.length
			if (cycle === 0) {
				pattern = config.pattern
				level = 0
			}
		}
		uptime++
	}, 100)

	/*	var procStat = {
			name: '',
			state: '',
			voluntary_ctxt_switches: '',
			nonvoluntary_ctxt_switches: ''
		}; */

	setInterval(() => {
		var temp = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp')
		Midle.status.temp = (temp / 1000).toFixed(1).toString() + '&#176;'
		Midle.status['cpu loadavg'] = fs.readFileSync('/proc/loadavg').toString()

		date.setSeconds(uptime / 10)
		Midle.status.uptime = '' + Math.floor(uptime / 864000) + 'd ' + date.toISOString().substr(11, 8)
	}, 1000)
	rpnd.mqtt.subscribe(config.ident_topic, (topic, payload) => {
		level = 0
		cycle = 0
		ticks = 0
		pattern = Array(20).fill(1)
	})
}

process.on('beforeExit', () => {
	ledOn(false)
})

Midle.priority = -1

module.exports = Midle
