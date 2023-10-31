/**
 * http://usejsdoc.org/
 */

const rpnd = require('../rpnd')
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
      ctrlTopic: uciConf.rpnd.root_topic + uciConf.chime.root_topic + '/' + uciConf.chime.ctrl_topic || 'play',
      volume: uciConf.chime.volume || '50%',
      amixer: {
        card: uciConf.chime.amixer_card || '0',
        sID: uciConf.chime.amixer_sID || '\'PCM\',0' // not used
      },
      aplay: {
        options: uciConf.chime.aplay_options || ''
      },
      chimesFolder: __dirname + '/../../chimes/'
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
      exec('aplay ' + config.aplay.options + ' ' + config.chimesFolder + cmd.chime, (error, stdout, stderr) => {
        rpnd.mqtt.publish(config.ctrlTopic + '/status', stderr || 'ok')
      })
    }

  }
  rpnd.mqtt.subscribe(config.ctrlTopic, play)

}

Mchime.status = 'Running'

Mchime.priority = 60

module.exports = Mchime

