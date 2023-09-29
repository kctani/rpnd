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

    m = new form.Map('rpnd', _('Configuration'), _('IOT i2c Bus manager'))

    s = m.section(form.TypedSection, 'i2c', _('I2C Bus'))
    s.anonymous = true
    s.addremove = false

    s.tab('general', _('Device'))
    s.tab('oled', _('Oled'))

    o = s.taboption('general', form.Value, 'device_name', _('Device name'), _('Device name without index'))
    o.optional = false
    o.rmempty = false


    o = s.taboption('general', form.MultiValue, 'devices_enabled', _('Device'), _('Selects indexes'))
    o.value('0', 'i2c0')
    o.value('1', 'i2c1')
    o.optional = true

    o = s.taboption('oled', form.Value, "address", "Bus Address", "Blank for default address")
    o.placeholder = '3D'
    o.datatype = 'hex'

    o = s.taboption('oled', form.Value, "rows", "Rows", "Rows in display")
    o.placeholder = '128'
    o.datatype = 'numeric'

    o = s.taboption('oled', form.Value, "cols", "Cols", "Cols in display")
    o.placeholder = '64'
    o.datatype = 'numeric'

    return m.render()
  }
})
