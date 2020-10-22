/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd');

var rpio;
try {
	rpio = require('rpio');
} catch (e) {
	rpnd.log('M-rpio - disabled - rpio not available')
	return;
}

var Mrpio = {};
var config;
var status = {
	pins: {}
};

Mrpio.uciConfig = (uciConf) => {
	if (uciConf.gpio && uciConf.gpio_pin && !uciConf.gpio.disabled) {
		config = {
			debounce: uciConf.gpio.debounce || 0,
			pins: []
		};
		([].concat(uciConf.gpio_pin)).forEach((pin) => {
			var pin = {
				number: pin.number,
				direction: pin.direction,
				topic: uciConf.sys.root_topic + uciConf.gpio.topic_prefix + '/' + pin.topic,
				levels: [pin.level_low, pin.level_high],
				opts: {
					edge: { 'UP': rpio.POLL_HIGH, 'DOWN': rpio.POLL_LOW, 'BOTH': rpio.POLL_BOTH } [pin.edge] || rpio.POLL_BOTH,
					debounce: pin.debounce || config.debounce,
					initial_level: { 'HIGH': rpio.HIGH, 'LOW': rpio.LOW } [pin.initial_level] || rpio.LOW,
					pull: { 'UP': rpio.PULL_UP, 'DOWN': rpio.PULL_DOWN, 'NONE': rpio.PULL_OFF } [pin.pull] || rpio.PULL_OFF,
				},
			}
			config.pins.push(pin);
		});
	}
	return config;
}

Mrpio.run = () => {
	rpnd.info('M-Rpio starting');

	rpio.init({
		gpiomem: false,
		mapping: 'physical',
		mock: undefined
	});

	config.pins.forEach((pin) => {
		try {
			if (pin.direction == 'OUT')
				pin.gpio = rpio.open(pin.number, rpio.OUTPUT, pin.opts.initial_level);
			else
				pin.gpio = rpio.open(pin.number, rpio.INPUT, pin.opts.pull);
		} catch (e) {
			rpnd.warn('Rpio: Can not initialize pin : ' + e.message);
			pin.direction = 'disabled';
		}
		var psts = {
			direction: pin.direction,
			level: '',
			cmd: '',
		}
		status.pins[pin.number] = psts;
		switch ('' || pin.direction) {
			case 'IN':
				var readPin = () => {
					var value = rpio.read(pin.number);
					psts.level = String(value);
					value = ((pin.levels && pin.levels[value]) || value);
					rpnd.mqtt.publish(pin.topic, '' + value);
					psts.cmd = String(value);
				}
				readPin();
				rpio.poll(pin.number, readPin, pin.opts.edge);
				break;
			case 'OUT':
				var writePin = (topic, payload) => {
					psts.cmd = String(payload);
					switch ('' + payload) {
						case (pin.levels && pin.levels[0]) || '0':
						case '0':
							rpio.write(pin.number, rpio.LOW);
							psts.level = String(rpio.LOW);
							break;
						case (pin.levels && pin.levels[1]) || '1':
						case '1':
							rpio.write(pin.number, rpio.HIGH);
							psts.level = String(rpio.HIGH);
							break;
						default:
							rpnd.warn('Undefined level : ' + payload);
					}
				}
				rpnd.mqtt.subscribe(pin.topic, writePin);
				break;
			case 'NONE':
				break;
			default:
				rpnd.warn(`Rpio: Pin ${pin.number} invalid direction - ${pin.direction}`);
		}
	});
};

Mrpio.status = status;

Mrpio.priority = 60;

module.exports = Mrpio;
