/**
 * http://usejsdoc.org/
 */

const spawn = require('child_process').spawn;
const readline = require('readline');
const rpnd = require('../rpnd');
const fs = require('fs');
var args = [
  '-F', 'json',
  '-R', 0
];

var config;

const handlers = {
  'Acurite tower sensor': (event) => {
    return {
      'name': 'txr592',
      'id': event.id,
      'topic': config.device.txr592.topic + event.id,
      'data': {
        'temprature': event.temperature_C,
        'humidty': event.humidity
      }
    };
  },
  'HIDEKI TS04 sensor': (event) => {
    return {
      'name': 'ts04',
      'id': event.channel,
      'topic': config.device.ts04.topic + event.channel,
      'data': {
        'temprature': event.temperature_C,
        'humidty': event.humidity
      }
    };
  },
  'ZAP': (event) => {
    var idx = Math.floor(event.num_rows / 2);
    var code = false;
    if (idx > 1) {
      code = config.device.ZAP.codes[event.codes[idx]];
      if (!code) {
        code = {
          'topic': config.device.ZAP.learn_topic,
          'data': event.codes[idx],
          "id": "learn"
        };
      }
      code.name = 'zap';
    }
    return code;
  },
  'RF-tech': (event) => {
    return false;
  },
  'default': (event) => {
    var data = JSON.stringify(event);
    rpnd.log('Unhandled event: ' + data);
    return {
      'name': 'unhandled',
      'topic': 'ken/rt433/unhandled',
      'data': data
    };
  }
};

var Mrt433 = {};

Mrt433.status = {
  'mode': 'starting',
  'device': {}
};

Mrt433.uciConfig = (uciConf) => {
  if (uciConf.rt433 && !uciConf.rt433.disabled && uciConf.rt433.protocols_enabled) {
    config = {
      device_path: uciConf.rt433.device_path || '',
    };
    config.device = {};
    if (uciConf.rt433.protocols_enabled.includes('txr592')) {
      config.device.txr592 = {
        topic: uciConf.sys.root_topic + uciConf.rt433.txr592_topic + '/'
      };
      rpnd.debugObj('config.device.txr592', config.device.txr592);
      args = args.concat(['-R', '40']);
      Mrt433.status.device.txr592 = {};
    }

    if (uciConf.rt433.protocols_enabled.includes('ts04')) {
      config.device.ts04 = {
        topic: uciConf.sys.root_topic + uciConf.rt433.ts04_topic + '/'
      };
      args = args.concat(['-R', '42']);
      Mrt433.status.device.ts04 = {};
    }
    if (uciConf.rt433.protocols_enabled.includes('zap')) {
      config.device.ZAP = {
        learn_topic: uciConf.rt433.zap_learn_topic && uciConf.sys.root_topic + 'zap/' + (uciConf.rt433.zap_learn_topic),
        codes: {}
      };
      ([].concat(uciConf.rt433_zap_code || [])).forEach((code) => {
        config.device.ZAP.codes[code.code] = {
          topic: (code.abolute_topic == '1' ? '' : (uciConf.sys.root_topic + 'zap/')) + code.topic,
          data: code.value,
          id: code.code
        };
      });
      args = args.concat(['-X', 'ZAP:OOK_PWM:272:852:14000:4000,bits=25,repeats>=3']);
      Mrt433.status.device.zap = {};
    }
  }
  rpnd.debugObj('rt433 args', args);
  return (args.length > 2) && config;
}


Mrt433.run = () => {
  rpnd.info('M-Rt433 starting');

  const proc = spawn('rtl_433', args);

  const rl = readline.createInterface({
    input: proc.stdout,
    output: proc.stdin
  });

  var lastEvent = '';

  rl.on('line', (data) => {
    // ignore repeat events
    if (lastEvent !== data) {
      lastEvent = data;

      var event;

      try {
        event = JSON.parse(data);
      } catch (err) {
        event = {
          'err': err,
          'data': data
        };
      }
      var msg = (handlers[event.model] || handlers.default)(event);
      rpnd.debugObj('rtl_433 msg', msg);
      if (msg) {
        Mrt433.status.device[msg.name][msg.id] = {
          topic: msg.topic,
          msg: msg.data
        };
        rpnd.mqtt.publish(msg.topic, String(msg.data));
      }
    }
  });

  proc.on('exit', (code, signal) => {
    Mrt433.status.mode = 'Rt433 down';
    rpnd.warn('Exit code', code, signal);
    setTimeout(() => {
      Mrt433.run();
    }, 10000);
  });
  Mrt433.status.mode = 'running';
}
Mrt433.priority = 80;

module.exports = Mrt433;
