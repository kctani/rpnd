const fs = require('fs');
const rpnd = require('./rpnd');

var UCI = {};

UCI.loadConfig = (envname) => {
  //
  const path = '/etc/config/' + (envname || 'rpnd');

  try {
    fs.accessSync(path, fs.constants.R_OK);
  } catch (e) {
    console.log('No access to ' + path);
    throw e;
  }

  var id = 0;

  const sysPath = '/sys/class/net/';

  fs.readdirSync(sysPath).forEach((adapter) => {
    if (!id && adapter !== 'lo') {
      var address = sysPath + adapter + '/address';
      try {
        var d = fs.readFileSync(address, 'utf8');
        id = d.replace(/:/g, '').toUpperCase();
        id = id.substr(0, 4) + id.substr(8, 4);
        rpnd.info('Node ID : ' + id + ', using - ' + address);
      } catch (e) {}
    }
  });

  const cfgFile = fs.readFileSync(path, {
    'encoding': 'utf8'
  });

  var opt = {};
  var itm = {};

  // Convert options list to object

  cfgFile.split(/\r?\n/).forEach((line) => {
    var elm = line.trim().split(/\s+/);
    switch (elm[0].toLowerCase()) {
      case 'config':
        itm = {};
        itm.section = elm[1];
        if (opt[elm[1]]) {
          // if exists convert array
          opt[elm[1]] = [].concat(opt[elm[1]]).concat(itm);
        } else {
          opt[elm[1]] = itm;
        }
        break;
      case 'option':
        itm[elm[1]] = elm[2].replace(/^['"](.*)['"]$/, '$1');
        break;
      case 'list':
        itm[elm[1]] = (itm[elm[1]] || []).concat([elm[2].replace(/^['"](.*)['"]$/, '$1')]);
        break;
      default:
        if (line.length > 0) {
          console.log(line, elm);
        }
        break;
    }
  });
  var alias = opt.rpnd.node_alias || 'rpnd';
  opt.sys = {
    alias: alias,
    node_id: opt.rpnd.node_id || id,
    node_name: opt.rpnd.node_name || ('node-' + alias),
    root_topic: (opt.mqtt.root_topic || 'rpnd') + '/' + alias + '/',
  }
  return opt;
};



module.exports = UCI;
