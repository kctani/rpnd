/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd')

var rpio
try {
	rpio = require('rpio')
} catch (e) {
	rpnd.log('M-rpio - disabled - rpio not available')
}

if (rpio) {
	const PIN = {
		SDA: 2,
		SCL: 3
	}
	var Mrpio = {}
	var config
	var status = {
		pins: {}
	}

	Mrpio.uciConfig = (uciConf) => {
		if (uciConf.gpio && uciConf.gpio_pin && !uciConf.gpio.disabled) {
			config = {
				debounce: uciConf.gpio.debounce || 0,
				pins: []
			}
			if (uciConf.gpio_i2c) {
				config.pins.push({
					number: PIN.SDA,
					direction: 'I2C'
				}, {
					number: PIN.SCL,
					direction: 'I2C'
				})
				config.i2c = {
					mode: 'MQTT',
					topic: uciConf.rpnd.root_topic + uciConf.gpio.topic_prefix + '/' + (uciConf.ic2_topic || 'ic2'),
					baudRate: 10000
				}
			}
			([].concat(uciConf.gpio_pin)).sort((a, b) => a.number >= b.number).forEach((pin) => {
				var ppin = {
					number: pin.number,
					direction: pin.direction,
					topic: uciConf.rpnd.root_topic + uciConf.gpio.topic_prefix + '/' + pin.topic,
					levels: [pin.level_low, pin.level_high],
					opts: {
						edge: { 'UP': rpio.POLL_HIGH, 'DOWN': rpio.POLL_LOW, 'BOTH': rpio.POLL_BOTH }[pin.edge] || rpio.POLL_BOTH,
						debounce: pin.debounce || config.debounce,
						initial_level: { 'HIGH': rpio.HIGH, 'LOW': rpio.LOW }[pin.initial_level] || rpio.LOW,
						pull: { 'UP': rpio.PULL_UP, 'DOWN': rpio.PULL_DOWN, 'NONE': rpio.PULL_OFF }[pin.pull] || rpio.PULL_OFF
					}
				}
				if (config.pins.find(({ number }) => number === ppin.number)) {
					rpnd.warn('Rpio: Duplicate pin defined: ' + ppin.number)
				} else {
					config.pins.push(ppin)
				}
			})
		}
		return config
	}

	Mrpio.run = () => {
		rpnd.info('M-Rpio starting')

		rpio.init({
			gpiomem: false,
			mapping: 'physical',
			mock: undefined
		})

		config.pins.forEach((pin) => {
			try {
				switch (pin.direction || 'N/A') {
					case 'IN':
						pin.gpio = rpio.open(pin.number, rpio.INPUT, pin.opts.pull)
						break
					case 'OUT':
						pin.gpio = rpio.open(pin.number, rpio.OUTPUT, pin.opts.initial_level)
						break
				}
			} catch (e) {
				rpnd.warn('Rpio: Can not initialize pin : ' + e.message)
				pin.direction = 'DISABLED'
			}
			var psts = {
				direction: pin.direction,
				level: '',
				cmd: ''
			}
			status.pins[pin.number] = psts
			switch ('' || pin.direction) {
				case 'IN':
					var readPin = () => {
						var value = rpio.read(pin.number)
						psts.level = String(value)
						value = ((pin.levels && pin.levels[value]) || value)
						rpnd.mqtt.publish(pin.topic, '' + value)
						psts.cmd = String(value)
					}
					readPin()
					rpio.poll(pin.number, readPin, pin.opts.edge)
					break
				case 'OUT':
					var writePin = (topic, payload) => {
						psts.cmd = String(payload)
						switch ('' + payload) {
							case (pin.levels && pin.levels[0]) || '0':
							case '0':
								rpio.write(pin.number, rpio.LOW)
								psts.level = String(rpio.LOW)
								break
							case (pin.levels && pin.levels[1]) || '1':
							case '1':
								rpio.write(pin.number, rpio.HIGH)
								psts.level = String(rpio.HIGH)
								break
							default:
								rpnd.warn('Undefined level : ' + payload)
						}
					}
					rpnd.mqtt.subscribe(pin.topic, writePin)
					break
				case 'I2C':
					psts = 'I2C'
					break
				default:
					rpnd.warn(`Rpio: Pin ${pin.number} invalid direction - ${pin.direction}`)
					psts = pin.direction
			}
		})

		if (config.i2c) {
			rpio.i2cBegin()
			rpio.i2cSetBaudRate(config.i2c.baudRate)
			var i2cWrite = (topic, payload) => {
				rpio.i2cWrite(Buffer.from(payload))
			}
			rpnd.mqtt.subscribe(config.i2c.topic, i2cWrite)
		}
	}

	var i2c = {}
	i2c.begin = rpio.i2cBegin
	i2c.write = rpio.i2cWrite
	i2c.read = rpio.i2cRead

	Mrpio.i2c = i2c

	Mrpio.status = status

	Mrpio.priority = 60

	module.exports = Mrpio
}
