/**
 * http://usejsdoc.org/
 */

const rpnd = require('rpnd')
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
  if (exec != undefined && !uciConf.chime.disabled) {
    config = {
      control_topic: uciConf.rpnd.root_topic + (uciConf.chime.root_topic ?? 'chime') + '/' + (uciConf.chime.ctrl_topic ?? 'play'),
      volume: uciConf.chime.volume || '50%',
      amixer: {
        card: uciConf.chime.amixer_card || '0',
        sID: uciConf.chime.amixer_sID || '\'PCM\',0'
      },
      aplay: {
        options: uciConf.chime.aplay_options || ''
      },
      chimes_folder: path.normalize(rpnd.appPath + '/../chimes/')
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
      exec('amixer -c ' + config.amixer.card + ' sset ' + config.amixer.sID + ' ' + cmd.volume, (error, stdout, stderr) => {
        rpnd.mqtt.publish(config.ctrlTopic + '/result', stderr || 'ok')
        if (stderr) Mchime.status.message = stderr
      })
    }
    if (cmd.chime !== undefined) {
      Mchime.status.last_chime = cmd
      exec('aplay ' + config.aplay.options + ' ' + config.chimes_folder + cmd.chime, (error, stdout, stderr) => {
        rpnd.mqtt.publish(config.ctrlTopic + '/result', stderr || 'ok')
        if (stderr) Mchime.status.message = stderr
      })
    }

  }
  rpnd.mqtt.subscribe(config.control_topic, play)

}

Mchime.status = {
  mode: 'Running',
  last_chime: {},
  message: ''
}

Mchime.priority = 60

module.exports = Mchime

