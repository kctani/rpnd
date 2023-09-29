'use strict'
'require fs'
'require uci'
'require form'

var pollInterval = 3

return L.view.extend({
  load: function () {

  },
  render: function () {

    try {
      document.head.appendChild(E('link', {
        'rel': 'stylesheet',
        'href': '/luci-static/resources/view/rpnd/rpnd.css'
      }))
    } catch (e) { }

    var m, s, o, ss, so

    m = new form.Map('rpnd', _('Configuration'), _('IOT 433mhz radio manager'))

    s = m.section(form.TypedSection, 'rt433', _('RTL 433'))
    s.anonymous = true
    s.addremove = false

    s.tab('general', _('General Settings'))
    s.tab('tempsensor', _('Temperature sensors'))
    s.tab('zap', _('Wireless Remotes'))

    o = s.taboption('general', form.Value, "device_path", "Device", "Blank for default device")
    o.optional = true
    o.placeholder = '/dev/xxx'
    o.datatype = 'string'

    o = s.taboption('general', form.MultiValue, 'protocols_enabled', _('Protocol'), _('Selects protocols enabled'))
    o.value('txr592', 'Acurite tower sensor')
    o.value('ts04', 'HIDEKI TS04 sensor')
    o.value('zap', 'Zap button remote')
    o.rmempty = false


    o = s.taboption('tempsensor', form.Value, "txr592_topic", "Topic", "Acurite tower sensor")
    o.optional = true
    o.placeholder = 'accurite'
    o.datatype = 'string'
    o.depends({
      'protocols_enabled': 'txr592',
      '!contains': 'txr592'
    })

    o = s.taboption('tempsensor', form.Value, "ts04_topic", "Topic", "HIDEKI TS04 sensor")
    o.optional = true
    o.placeholder = 'inox'
    o.datatype = 'string'
    o.depends({
      'protocols_enabled': 'ts04',
      '!contains': 'ts04'
    })



    o = s.taboption('zap', form.Value, "zap_learn_topic", "Learn topic", "Unrecognized code published on this topic")
    o.optional = true
    o.placeholder = 'learn'
    o.datatype = 'string'
    o.anonymous = true
    o.depends({
      'protocols_enabled': 'zap',
      '!contains': 'zap'
    })

    o = s.taboption('zap', form.DummyValue, "_lastcode", "Last Code", "Last code recieved")
    o.rawhtml = true
    o.modalonly = false
    o.depends({
      'protocols_enabled': 'zap',
      '!contains': 'zap'
    })
    var lastcode = o.default = E('span', {}, ['-.-'])

    o = s.taboption('zap', form.SectionValue, '__codes__', form.GridSection, 'rt433_zap_code', null,
      _('Zap Codes .') + '<br />' +
      _('Mapping codes to mqtt messages'))
    o.anonymous = true
    o.addremove = true
    o.depends({
      'protocols_enabled': 'zap',
      '!contains': 'zap'
    })

    ss = o.subsection

    ss.addremove = true
    ss.anonymous = true
    ss.sortable = true

    so = ss.option(form.Value, "code", "Code", "")
    so.optional = false
    so.rmempty = false
    so.sortable = true
    var code_option = so

    so = ss.option(form.Value, "topic", "Topic", "")
    so.optional = false
    so.rmempty = false
    so.sortable = true

    so = ss.option(form.Flag, "abolute_topic", "Absolute", "")
    so.optional = false
    so.rmempty = true
    so.default = false

    so = ss.option(form.Value, "value", "Value", "")
    so.optional = false
    so.rmempty = false
    so.sortable = true

    L.Poll.add(L.bind(function () {
      return L.resolveDefault(fs.read('/tmp/rpnd/status'), '').then((code) => {
        try {
          lastcode.textContent = JSON.parse(code).rt433.device.zap.learn.msg
          code_option.default = lastcode.textContent
        } catch (e) {
          lastcode.textContent = 'na'
        }
      })
    }, this), pollInterval)

    return m.render()
  }
})
