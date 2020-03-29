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
        edge: pin.edge,
        topic: uciConf.sys.root_topic + uciConf.gpio.topic_prefix + '/' + pin.topic,
        levels: [pin.level_low, pin.level_high],
        opts: {
          debounce: pin.debounce || config.debounce
        },
      }
      config.pins.push(pin);
    });
  }
  return config;
}

var dir = (d) => {
  switch (d) {
    case 'in':
      return rpio.INPUT;
    case 'out':
      return rpio.OUTPUT;
    default:
      return undefined;
  }
}

Mrpio.run = () => {
  rpnd.info('M-Rpio starting');

  rpio.init({
    gpiomem: true,
    mapping: 'physical',
    mock: undefined
  });

  config.pins.forEach((pin) => {
    try {
      pin.gpio = rpio.open(pin.number, dir(pin.direction) || rpio.INPUT);
    } catch (e) {
      rpnd.warn('Can not initialize pin : ' + e.message);
      pin.direction = 'disabled';
    }
    var psts = {
      direction: pin.direction,
      level: '',
      cmd: '',

    }
    status.pins[pin.number] = psts;
    switch ('' || pin.direction) {
      case 'in':
        var readPin = () => {
          var value = rpio.read(pin.number);
          psts.level = String(value);
          value = ((pin.levels && pin.levels[value]) || value);
          rpnd.mqtt.publish(pin.topic, '' + value);
          psts.cmd = String(value);
        }
        readPin();
        rpio.poll(pin.number, readPin);
        break;
      case 'out':
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
        writePin('', pin.initLevel || '0');
        rpnd.mqtt.subscribe(pin.topic, writePin);
        break;
      case 'none':
        break;
      default:
    }
  });
};

Mrpio.status = status;

Mrpio.priority = 60;

module.exports = Mrpio;
