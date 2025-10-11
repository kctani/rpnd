/**
 * http://usejsdoc.org/
 */

const spawn = require('child_process').spawn
const readline = require('readline')
const rpnd = require('rpnd')
const secplus = require('secplus')

var args = [
  '-F', 'json',
  '-R', 0
]

var config
var timer
var device = { myq: { codes: [] } }

const handlers = {
  'Acurite-Tower': (event) => {
    return {
      'name': 'txr592',
      'id': event.id,
      'topic': config.device.txr592.topic + event.id,
      'data': {
        'temprature': event.temperature_C,
        'humidty': event.humidity
      }
    }
  },
  'Hideki-TS04': (event) => {
    return {
      'name': 'ts04',
      'id': event.channel,
      'topic': config.device.ts04.topic + event.channel,
      'data': {
        'temprature': event.temperature_C,
        'humidty': event.humidity
      }
    }
  },
  'ZAP': (event) => {
    var idx = Math.floor(event.num_rows / 2)
    var code = false
    if (idx > 1) {
      code = config.device.ZAP.codes[event.codes[idx]]
      if (!code) {
        code = {
          'topic': config.device.ZAP.learn_topic,
          'data': event.codes[idx],
          'id': 'learn'
        }
      }
      code.name = 'zap'
    }
    return code
  },
  'RF-tech': (event) => {
    return false
  },
  'MYQ': (event) => {

    let code = event.rows[0]
    let msg = false
    if (code.len >= 42 && !device.myq.codes.includes(code.data)) {
      if (device.myq.codes.length < 2) {
        device.myq.codes.push(code.data)
      } else {
        device.myq.codes = [code.data]
      }
      if (device.myq.codes.length >= 2) {
        try {
          device.myq.codes = device.myq.codes.slice(0, 2)
          let decoded = secplus.decodeV2Rtl(device.myq.codes)
          if (decoded.msg == undefined) {
            msg = {
              'name': 'myq',
              'topic': config.device.myq.topic + decoded.fixed,
              'data': { 'rolling': decoded.rolling, 'cmd': decoded.cmd, 'info': decoded.info },
              'id': decoded.fixed
            }
            rpnd.prst.put('myq.rtl.' + decoded.fixed, decoded)
            Mrt433.status.device.myq.codes = device.myq.codes
          } else {
            Mrt433.status.device.myq.error = decoded.msg.message
            msg = false
          }
          clearTimeout(timer)
          setTimeout(() => {
            if (device.myq.codes.length >= 2) {
              device.myq.codes = []
            }
          }, 5000) // allow repeats after 5 secs
        } catch (e) {
          rpnd.debug('Rt433 myq: ', e.message, Mrt433.status.device.myq.codes)
        }
      }
    }
    return msg
  },
  'default': (event) => {
    var data = JSON.stringify(event)
    rpnd.log('Unhandled event: ' + data)
    return {
      'name': 'unhandled',
      'topic': 'ken/rt433/unhandled',
      'data': data,
      'id': 'unhandled'
    }
  }
}

var Mrt433 = {}

Mrt433.status = {
  'mode': 'starting',
  'device': {
    'unhandled': {}
  }
}

Mrt433.uciConfig = (uciConf) => {
  if (uciConf.rt433 && uciConf.rt433.protocols_enabled) {
    config = {
      device_path: uciConf.rt433.device_path || '',
      tuner_freq: uciConf.rt433.tuner_freq || '433.92'
    }
    config.device = {}
    if (uciConf.rt433.protocols_enabled.includes('txr592')) {
      config.device.txr592 = {
        topic: uciConf.rpnd.root_topic + uciConf.rt433.txr592_topic + '/'
      }
      rpnd.debugObj('Rt433 config.device.txr592', config.device.txr592)
      args = args.concat(['-R', '40'])
      Mrt433.status.device.txr592 = {}
    }

    if (uciConf.rt433.protocols_enabled.includes('ts04')) {
      config.device.ts04 = {
        topic: uciConf.rpnd.root_topic + uciConf.rt433.ts04_topic + '/'
      }
      args = args.concat(['-R', '42'])
      Mrt433.status.device.ts04 = {}
    }
    if (uciConf.rt433.protocols_enabled.includes('zap')) {
      config.device.ZAP = {
        learn_topic: uciConf.rt433.zap_learn_topic && uciConf.rpnd.root_topic + 'zap/' + (uciConf.rt433.zap_learn_topic),
        codes: {}
      };
      ([].concat(uciConf.rt433_zap_code || [])).forEach((code) => {
        config.device.ZAP.codes[code.code] = {
          topic: (code.abolute_topic === '1' ? '' : (uciConf.rpnd.root_topic + 'zap/')) + code.topic,
          data: code.value,
          id: code.code
        }
      })
      args = args.concat(['-X', 'ZAP:OOK_PWM:272:852:14000:4000,bits=25,repeats>=3'])
      Mrt433.status.device.zap = {}
    }
    if (uciConf.rt433.protocols_enabled.includes('myq')) {
      config.device.myq = {
        topic: uciConf.rpnd.root_topic + 'myq' + '/'
      }
      args = args.concat(['-f', '315M', '-X', 'n=MYQ,m=OOK_MC_ZEROBIT,s=248,l=248,g=720,r=200000,preamble={20}00000'])
      Mrt433.status.device.myq = {
        codes: []
      }
    }
  }
  rpnd.debugObj('Rt433 args', args)
  return (args.length > 2) && config
}

var rtlProc

Mrt433.run = () => {
  rpnd.info('M-Rt433 starting')

  rtlProc = spawn('rtl_433', args)

  const rl = readline.createInterface({
    input: rtlProc.stdout,
    output: rtlProc.stdin
  })

  var lastEvent = ''

  rl.on('line', (data) => {

    var event

    try {
      event = JSON.parse(data)
    } catch (err) {
      event = {
        'err': err,
        'data': data
      }
    }
    var msg = (handlers[event.model] || handlers.default)(event)
    if (msg) {
      rpnd.debugObj('Rt433 msg', msg)
      Mrt433.status.device[msg.name][msg.id] = {
        topic: msg.topic,
        msg: msg.data
      }
      if (typeof (msg.data) !== 'string') msg.data = JSON.stringify(msg.data)
      rpnd.mqtt.publish(msg.topic, msg.data)
    }
  })

  rtlProc.on('exit', (code, signal) => {
    Mrt433.status.mode = 'Rt433 down'
    rpnd.warn('Exit code', code, signal)
    setTimeout(() => {
      Mrt433.run()
    }, 10000)
  })
  Mrt433.status.mode = 'running'
}

Mrt433.stop = () => {
  rpnd.info('rtl433 Stoping child process')
  Mrt433.run = () => { }
  rtlProc.stdin.end()
  rtlProc.stdout.destroy()
  rtlProc.stderr.destroy()
  rtlProc.kill('SIGKILL')
}

Mrt433.priority = 80

module.exports = Mrt433


// _433 -f 315M -R 0  -X  'n=myq,m=OOK_MC_ZEROBIT,s=248,l=248,g=720,r=200000,preamble={20}00000f' -F json


