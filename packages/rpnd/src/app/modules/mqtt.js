/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd')
const mqtt = require('mqtt');
const fs = require('fs');

var Mmqtt = {};

var client,
  subscriptions = [],
  config,
  status = {
    'link': 'down',
    'sent': 0,
    'recieved': 0,
  };

var connected = () => {
  return client && client.connected;
}


Mmqtt.uciConfig = (uciConf) => {
  if (uciConf.mqtt && !uciConf.mqtt.disabled) {
    config = {
      url: uciConf.mqtt.url,
      opts: {
        username: uciConf.mqtt.username,
        password: uciConf.mqtt.password,
        client_id: uciConf.mqtt.client_id || 'rpnd_' + uciConf.sys.node_id
      },
      status_topic: uciConf.sys.root_topic + uciConf.mqtt.status_topic,
      status_up: 'UP',
      status_down: 'DOWN'
    };
    if (config.status_topic) {
      config.opts.will = {
        topic: config.status_topic,
        payload: config.status_down,
        retain: true
      };
    }
  }
  return config;
}

Mmqtt.run = function() {
  rpnd.info('M-Mqtt starting');
  client = mqtt.connect(config.url, config.opts);

  var procMsg = (topic, payload) => {
    status.recieved++;
    subscriptions.forEach(function(sub) {
      if (topic === sub.topic) {
        sub.listener(topic, payload);
      }
    });
  }

  client.on('message', procMsg);

  client.on('connect', function(connack) {
    status.link = 'connected';
    rpnd.info('Mqttt.connected ');
    Mmqtt.publish(config.status_topic, config.status_up, {
      retain: true
    });
    subscriptions.forEach(function(sub) {
      client.subscribe(sub.topic);
    });
  });

  client.on('close', function() {
    status.link = 'closed';
    rpnd.info('Mqttt.closed ');
    if (client.disconnected) {
      client.reconnect();
    }
  });

  const mqttInFilePath = '/tmp/rpnd/mqtt-in';
  fs.writeFileSync(mqttInFilePath, '', {
    'encoding': 'utf8'
  });
  fs.watch(mqttInFilePath, {
    'persistent': false,
    'recursive': false,
    'encoding': 'utf8'
  }, (event, trigger) => {
    var msg = fs.readFileSync(mqttInFilePath, {
      'encoding': 'utf8'
    }).split(':');
    rpnd.debug('mqtt-in-file', msg);
    if (msg.length == 2) procMsg(msg[0], msg[1]);
    else rpnd.warn('Invalid messag in ' + mqttInFilePath);
  });

};

Mmqtt.subscribe = function(topic, listener) {
  subscriptions.push({
    'topic': topic,
    'listener': listener
  });
  if (connected) {
    client.subscribe(topic);
  }
};

Mmqtt.publish = function(topic, message, options) {
  status.sent++;
  client.publish(topic, message, options || {
    'retain': false
  });
};

Mmqtt.status = status;

Mmqtt.priority = 90;


module.exports = Mmqtt;
