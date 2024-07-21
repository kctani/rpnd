/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd')
const mqtt = require('mqtt')
const fs = require('fs')

var Mmqtt = {}

var client
var config
var subscriptions = []
var status = {
	'link': 'down',
	'sent': 0,
	'received': 0
}

function connected() {
	return client && client.connected
}

Mmqtt.uciConfig = (uciConf) => {
	if (uciConf.mqtt) {
		config = {
			url: uciConf.mqtt.url,
			opts: {
				username: uciConf.mqtt.username,
				password: uciConf.mqtt.password,
				client_id: uciConf.mqtt.client_id || 'rpnd_' + uciConf.rpnd.node_id
			},
			status_up: 'UP',
			status_down: 'DOWN'
		}
		if (uciConf.mqtt.status_topic) {
			config.opts.will = {
				topic: uciConf.rpnd.root_topic + uciConf.mqtt.status_topic,
				payload: config.status_down,
				retain: true
			}
		}
	}
	return config
}

Mmqtt.run = () => {
	rpnd.info('M-Mqtt starting')
	client = mqtt.connect(config.url, config.opts)

	var procMsg = (topic, payload) => {
		status.received++
		subscriptions.forEach((sub) => {
			if (topic === sub.topic) {
				sub.listener(topic, payload)
			}
		})
	}

	client.on('message', procMsg)

	client.on('connect', (connack) => {
		status.link = 'connected'
		rpnd.info('Mqtt.connected ')
		if (config.opts.will) {
			Mmqtt.publish(config.opts.will.topic, config.status_up, {
				retain: true
			})
		}
		subscriptions.forEach((sub) => {
			client.subscribe(sub.topic)
		})
	})

	client.on('close', () => {
		status.link = 'closed'
		rpnd.info('Mqtt.closed ')
		if (client.disconnected) {
			client.reconnect()
		}
	})

	const mqttInFilePath = '/tmp/rpnd/mqtt-in'
	fs.writeFileSync(mqttInFilePath, '', {
		'encoding': 'utf8'
	})
	fs.watch(mqttInFilePath, {
		'persistent': false,
		'recursive': false,
		'encoding': 'utf8'
	}, (event, trigger) => {
		var msg = fs.readFileSync(mqttInFilePath, {
			'encoding': 'utf8'
		}).split(':')
		rpnd.debug('mqtt-in-file', msg)
		if (msg.length === 2) procMsg(msg[0], msg[1])
		else rpnd.warn('Invalid messag in ' + mqttInFilePath)
	})
}

Mmqtt.subscribe = (topic, listener) => {
	subscriptions.push({
		'topic': topic,
		'listener': listener
	})
	if (connected) {
		client.subscribe(topic)
	}
}

Mmqtt.publish = (topic, message, options) => {
	status.sent++
	client.publish(topic, message, options || {
		'retain': false
	})
}

Mmqtt.status = status

Mmqtt.priority = 90

module.exports = Mmqtt
