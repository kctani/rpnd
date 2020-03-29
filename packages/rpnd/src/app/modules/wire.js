'use strict';

/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd')
const fs = require('fs');
const sysPath = '/sys/bus/w1/devices/';
var config;

if (!fs.existsSync(sysPath)) {
  rpnd.log('Wire not loaded "/sys/bus/w1/devices/" not found');
  return;
}

var Mwire = {};

Mwire.status = {
  mode: 'configured',
  device: {}
};

Mwire.uciConfig = (uciConf) => {
  if (uciConf.wire && !uciConf.wire.disabled) {
    config = {
      poll_time: uciConf.wire.poll_time || 1000,
      devices: []
    };
    ([].concat(uciConf.wire_device || [])).forEach((device) => {
      config.devices.push({
        id: device.id,
        topic: uciConf.sys.root_topic + uciConf.wire.topic + '/' + device.id,
      });
      Mwire.status.device[device.id] = {
        value: 'na',
        type: 'uknown',
        state: 'initialized',
      };
    });
  }
  return config;
}

Mwire.run = function() {
  setInterval(() => {
    var ids = fs.readdirSync(sysPath, {
      withFileTypes: false,
      encoding: 'utf8'
    });
    for (var device of config.devices) {
      var dsts = Mwire.status.device[device.id];
      if (ids.includes(device.id) && dsts && dsts.state != 'offline') {
        fs.readFile(sysPath + device.id + '/w1_slave', 'utf8', (err, data) => {
          if (err) {
            dsts.state = err.message;
            rpnd.error('Device read error:', device, err);
          } else {
            var deviceType = device.id.slice(0, 2);
            switch (deviceType) {
              case '28':
                dsts.state = data.match(/crc.*YES/) ? 'OK' : 'CRC-ERR';
                var temp = '-';
                try {
                  temp = (/t=(.*)/gm).exec(data)[1];
                  temp = temp.slice(0, 2) + '.' + temp.slice(2);
                  dsts.value = temp;
                } catch (e) {
                  dsts.state = 'PARSE-ERR';
                }
                rpnd.mqtt.publish(device.topic, '{"temperature": "' + temp + '", "status": "' + dsts.state + '"}');
                break;
              default:
                dsts.state = 'TYPE-UNKNOWN';
                rpnd.info('M-Wire: Do not know how to handle device type: ' + deviceType);
            }
          }
        });
      } else {
        if (dsts.state != 'NOT-ACTIVE') rpnd.warn('Device not active:', device);
        dsts.state = 'NOT-ACTIVE';
      }
    }
  }, config.poll_time);
  Mwire.status.mode = 'running';
};

module.exports = Mwire;
