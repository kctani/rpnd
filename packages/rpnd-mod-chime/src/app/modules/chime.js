/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd')
const path = require('node:path')

var exec
try {
  exec = require('child_process')
  exec = exec.exec
} catch (e) {
  rpnd.log('M-chime - disabled - exec not available')
}

var Mchime = {}
var config


Mchime.uciConfig = (uciConf) => {
  if (!uciConf.chime.disabled) {
    config = {
      control_topic: uciConf.rpnd.root_topic + (uciConf.chime.root_topic ?? 'chime') + '/' + (uciConf.chime.ctrl_topic ?? 'play'),
      volume: uciConf.chime.volume || '50%',
      amixer: {
        card: uciConf.chime.amixer_card || '0',
        sID: uciConf.chime.amixer_sID || '\'PCM\',0' // not used
      },
      aplay: {
        options: uciConf.chime.aplay_options || ''
      },
      chimes_folder: path.normalize(__dirname + '/../../chimes/')
    }
    return config
  }
}

Mchime.run = () => {
  rpnd.info('M-Chime starting')

  function play(topic, payload) {
    // message buf filename || json cmd {file: string, volume: int}
    let cmd = { chime: String(payload) }

    try {
      cmd = JSON.parse(payload)
    } catch (e) { }

    rpnd.debugObj('Chime Command', cmd)

    if (cmd.volume !== undefined) {
      exec('amixer -c ' + config.amixer.card + ' sset \'PCM\',' + config.amixer.card + ' ' + cmd.volume, (error, stdout, stderr) => {
        rpnd.mqtt.publish(config.ctrlTopic + '/status', stderr || 'ok')
      })
    }
    if (cmd.chime !== undefined) {
      exec('aplay ' + config.aplay.options + ' ' + config.chimes_folder + cmd.chime, (error, stdout, stderr) => {
        rpnd.mqtt.publish(config.ctrlTopic + '/status', stderr || 'ok')
      })
    }

  }
  rpnd.mqtt.subscribe(config.control_topic, play)

}

Mchime.status = 'Running'

Mchime.priority = 60

module.exports = Mchime

