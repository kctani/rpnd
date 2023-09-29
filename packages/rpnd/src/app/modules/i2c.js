/**
 * http://usejsdoc.org/
 */

const fs = require('fs')
const rpnd = require('../rpnd')

var i2c
try {
	i2c = require('i2c-bus')
	oled = require('oled-i2c-bus')
} catch (e) {
	rpnd.log(`M-i2c - disabled - i2c-bus not available ${e.message}`)
	return
}


var Mi2c = {}

var config
var status = {
	bus: {}
}

Mi2c.uciConfig = (uciConf) => {

	config = {
		bus: [].concat(uciConf.i2c.bus_enabled || []),
		devices: [],
		topic_prefix: uciConf.i2c.topic_prefix || 'i2c'
	}
	for (i2c_device of [].concat(uciConf.i2c_device || [])) {
		if (i2c_device.bus && i2c_device.address && i2c_device.driver) {
			config.devices.push({
				bus: i2c_device.bus,
				address: i2c_device.address,
				driver: i2c_device.driver,
				topic: uciConf.rpnd.root_topic + config.topic_prefix + '/' + (i2c_device.topic || i2c_device.driver)
			})
		}
	}

	return config
}

Mi2c.run = () => {

	var i2cBus = []
	status.bus = {}
	for (de of fs.readdirSync('/dev', { encoding: 'utf8', withFileTypes: true }).filter(den => den.name.match(/i2c\-.*/))) {
		var nbr = parseInt(de.name.substr(4))
		i2cBus[nbr] = i2c.openSync(parseInt(nbr))
		var adrs = {}
		for (id of i2cBus[nbr].scanSync()) {
			rpnd.debug(`i2c: device adr ${id}`)
			i2cBus[nbr].deviceId(id, (err, inf) => {
				adrs[id.toString(16)] = inf || 'unknown'
			})
		}
		status.bus[nbr] = adrs
	}


	var devices = []

	for (dev of config.devices) {
		var device = {}
		switch (dev.driver) {
			case 'ssd1306':
				device.opts = {
					width: dev.width || 128,
					height: dev.height || 64,
					address: parseInt(dev.address)
				}

				display = new oled(i2cBus[dev.bus], device.opts)
				display.clearDisplay()
				display.turnOnDisplay()

				rpnd.mqtt.subscribe(dev.topic, (topic, data) => {
					var cmd = data.toString()
					rpnd.debug('I2C: oled command', cmd)
					display.invertDisplay(cmd == 'ON')
				})
				device.display = display
				devices.push(device)

				break
			default:
				rpnd.warn(`I2C: unsupported device ${dev.driver}`)
		}
	}



}

Mi2c.status = status

Mi2c.priority = 60

module.exports = Mi2c
