'use strict'
'require fs'
'require uci'
'require form'


return L.view.extend({
  load: function () {

  },
  render: function () {

    var m, s, o, ss, so

    m = new form.Map('rpnd', _('Configuration'), _('IOT MyQ Remote'))

    s = m.section(form.TypedSection, 'myq', _('MyQ Remote'))
    s.anonymous = true
    s.addremove = false

    o = s.option(form.Flag, 'disabled', _('Disabled'), _('Disable Module'))

    o = s.option(form.Value, 'root_topic', _('Root Topic'), _('Root topic for MyQ'))
    o.optional = false
    o.datatype = 'string'
    o.default = 'myq'

    o = s.option(form.Value, 'send_topic', _('TX Topic'), _('Command topic to send code'))
    o.optional = true
    o.datatype = 'string'
    o.default = 'send'

    o = s.option(form.Value, 'txgpio', _('TX Gpio'), _('Broadcom Gpio Number '))
    o.optional = true
    o.datatype = 'number'
    o.default = ''

    o = s.option(form.Value, 'recieve_topic', _('RX Topic'), _('Topic to receive codes'))
    o.optional = true
    o.datatype = 'string'
    o.default = ''

    o = s.option(form.Value, 'rxgpio', _('RX Gpio'), _('Broadcom Gpio Number '))
    o.optional = true
    o.datatype = 'number'
    o.default = ''

    return m.render()
  }
})
