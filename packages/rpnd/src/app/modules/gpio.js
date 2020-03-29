/**
 * http://usejsdoc.org/
 */

if (process.platform !== 'linux') {
  console.log('M-Gpio not available on this platform');
}
const rpnd = require('../rpnd');

var onoff;
try {
  onoff = require('onoff');
} catch (e) {
  rpnd.log('M-gpio - disabled - onoff not available')
  return;
}

var Mgpio = {};
var pins = [];
var config;

Mgpio.uciConfig = (uciConf) => {
  if (uciConf.gpio && uciConf.gpio_pin && !uciConf.gpio.disabled) {
    config.gpio = {
      debounceTimeout: uciConf.gpio.debounce || 0,
      pins: []
    };
    ([].concat(uciConf.gpio_pin)).forEach((pin) => {
      config.gpio.pins.push({
        number: pin.number,
        direction: pin.direction,
        edge: pin.edge,
        topic: uciConf.rootTopic + uciConf.gpio.topic_prefix + '/' + pin.topic,
        levels: [pin.level_low, pin.level_high],
        opts: {
          debounceTimeout: pin.debounce || config.gpio.debounce
        }
      });
    });
    pins = config.gpio.pins;
  }
  return config;
}

Mgpio.run = () => {
  console.log('M-Gpio starting');

  pins.forEach((pin) => {
    try {
      pin.gpio = new onoff.Gpio(pin.number, pin.direction || 'in', pin.edge || 'none', pin.opts || {});
      switch (pin.direction) {
        case 'in':
          pin.gpio.watch((errv, value) => {
            rpnd.mqtt.publish(pin.topic, '' + ((pin.levels && pin.levels[value]) || value));
          });
          break;
        case 'out':
          rpnd.mqtt.subscribe(pin.topic, (topic, payload) => {
            switch ('' + payload) {
              case (pin.levels && pin.levels[0]) || '0':
              case '0':
                pin.gpio.writeSync(0);
                break;
              case (pin.levels && pin.levels[1]) || '1':
              case '1':
                pin.gpio.writeSync(1);
                break;
              default:
                console.log('Undefined level : ' + payload);
            }
          });
          break;
        default:
      }
    } catch (e) {
      console.log('Can not allocate pin - ' + pin.number);
    }
  });
};

module.exports = Mgpio;
