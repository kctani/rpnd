/**
 * http://usejsdoc.org/
 */

const rpnd = require('rpnd')
const secplus = require('secplus')
const myqpigs = require('myqpigs')


var exec
try {
  exec = require('child_process')
  exec = exec.exec
} catch (e) {
  rpnd.log('M-myq - disabled - exec not available')
}

var Mmyq = {}
var config

Mmyq.uciConfig = (uciConf) => {
  if (exec != undefined && !uciConf.myq.disabled) {
    config = {
      send_topic: uciConf.rpnd.root_topic + (uciConf.myq.root_topic ?? 'myq') + '/' + (uciConf.myq.send_topic ?? 'send'),
      txgpio: uciConf.myq.txgpio,
      repeats: uciConf.myq.repeats ?? 4,
      recieve_topic: uciConf.rpnd.root_topic + (uciConf.myq.root_topic ?? 'myq') + '/',
      rxgpio: uciConf.myq.rxgpio,
    }
    return config
  }
}

Mmyq.run = () => {
  rpnd.info('M-myq starting')
  let rxPkts = []

  if (config.txgpio != undefined) {
    rpnd.info('M-myq TX starting')
    myqpigs.initTx(config.txgpio, config.repeats)

    function send(topic, payload) {
      try {
        Mmyq.status.cmd = String(payload)
        let cmd = JSON.parse(payload)
        Mmyq.status.cmd = cmd
        rpnd.debug('Myq - command:', cmd)
        if (cmd.rolling == undefined) {
          cmd.rolling = (BigInt('0x0' + rpnd.prst.get('myq.' + cmd.fixed, { "rolling": "0" }).rolling) + 1n).toString(16)
          rpnd.debug('Myq - prst rolling:', cmd.rolling)
        }
        let pkts = secplus.encodePigs(cmd)
        myqpigs.sendCodes(pkts.pigs)
        Mmyq.status.tx_pkts = pkts.hex
        rpnd.prst.put('myq.' + cmd.fixed, cmd)
      } catch (e) {
        rpnd.warn('Myq send error', e)
        Mmyq.status.cmd = e.message
      }
    }
    rpnd.mqtt.subscribe(config.send_topic, send)
  }
  if (config.rxgpio != undefined) {
    rpnd.info('M-myq RX starting')
    const sync = '101010101010101001010101'
    myqpigs.initRx(config.rxgpio, (packet) => {
      let preamble = packet.indexOf(sync)
      if (preamble > 0 && packet.length > 120) {
        packet = packet.slice(preamble + sync.length) + '000'
        if (!rxPkts.includes(packet)) {
          if (rxPkts.length > 1) {
            rxPkts.length = 0
          }
          rxPkts.push(packet)
          if (rxPkts.length > 1) {
            let myqcode = secplus.decodePigs(rxPkts)
            if (myqcode.fixed) {
              let content = { 'rolling': myqcode.rolling, 'command': myqcode.command, 'data': myqcode.data }
              Mmyq.status.rx_codes[myqcode.fixed] = content
              Mmyq.status.rx_pkts = myqcode.codes
              rpnd.mqtt.publish(config.recieve_topic + myqcode.fixed, JSON.stringify(content))
            } else {
              Mmyq.status.err = myqcode
            }
          }
        }
      }
    })
  }
}

Mmyq.status = {
  mode: 'Running',
  cmd: '',
  tx_pkts: '',
  rx_pkts: '',
  rx_codes: {},
  err: ''

}

Mmyq.stop = () => {
  rpnd.info('Myq stopping myqpigs')
  myqpigs.stop()
}


Mmyq.priority = 60

module.exports = Mmyq

