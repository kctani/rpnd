/**
 * http://usejsdoc.org/
 */

const rpnd = require('rpnd')
const fs = require('fs')
const path = require('node:path')

var Mprst = {}

var config
var status = {
  'puts': 0,
  'gets': 0,
  'last_get': '',
  'last_put': '',
}


Mprst.uciConfig = (uciConf) => {
  if (uciConf.prst) {
    config = {
      prst_path: path.normalize(rpnd.appPath + '/../prst/')
    }
  }
  return config
}

Mprst.run = () => {
  rpnd.info('M-prst starting')
}

function filePath(topic) {
  return config.prst_path + topic
}

Mprst.get = (topic, defValue) => {
  let value = defValue
  try {
    if (fs.statSync(filePath(topic)).isFile()) {
      value = JSON.parse(fs.readFileSync(filePath(topic)))
      status.last_get = value
    }
  } catch (error) {
    rpnd.warn('PRST: Topic not available:', topic, error.message)
  }
  return value
}

Mprst.put = (topic, value) => {
  rpnd.debug('PRST: put:', topic, value)
  if (value == undefined) {
    try {
      fs.rmSync(filePath(topic))
    } catch (error) {
      rpnd.warn('PRST: failed to remove topic:', topic, error)
    }
  } else {
    try {
      value = JSON.stringify(value)
    } catch (error) {
      rpnd.warn('PRST: Topic not jsonable:', topic, error)
      value = {}
    }
    try {
      fs.writeFileSync(filePath(topic), value, { flush: true })
      status.last_put = value
    } catch (error) {
      rpnd.warn('PRST: Topic not writeable:', topic, error)
      value = {}
    }
  }
}

Mprst.status = status

Mprst.priority = 90

module.exports = Mprst

