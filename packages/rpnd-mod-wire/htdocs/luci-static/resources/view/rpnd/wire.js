'use strict'
'require fs'
'require uci'
'require form'

var pollInterval = 3

return L.view.extend({
  load: function () {

  },
  render: function () {

    var m, s, o, ss, so,
      lastcode = E('span', {}, ['-.-'])

    m = new form.Map('rpnd', _('Configuration'), _('IOT One Wire manager'))

    s = m.section(form.TypedSection, 'rt433', _('RTL 433'))
    s.anonymous = true
    s.addremove = false

    s.tab('general', _('General Settings'))
    s.tab('devices', _('Devices'))

    o = s.taboption('general', form.Value, "device_path", "Device", "Blank for default device")
    o.optional = true
    o.placeholder = '/dev/xxx'
    o.datatype = 'string'

    o = s.taboption('devices', form.Value, "device_path", "Device", "Blank for default device")
    o.optional = true
    o.placeholder = '/dev/xxx'
    o.datatype = 'string'

    return m.render()
  }
})
