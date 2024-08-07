'use strict'
'require form'
'require fs'

var pollInterval = 3

var jsonToHtml = (obj) => {
  var html = ''
  for (var key in obj) {
    var value = obj[key]
    if (key == 'password' && typeof value == 'string') value = '************'
    html += '<div class="sts_property"><div class="sts_key">' + key + '</div>' + ((typeof value) == 'object' ? jsonToHtml(value) : '<div class="sts_value">' + value + '</div>') + '</div>'
  }
  return '<div class="sts_object">' + html + '</div>'
}

var mqttInMsg = (topic, data) => {
  if (topic != undefined && data != undefined)
    fs.write('/tmp/rpnd/mqtt-in', topic + ':' + data)
  else console.log('\x07Bell')
}

var CBIRpndStatus = form.DummyValue.extend({
  renderWidget: function (section_id, option_id, cfgvalue) {
    var table = E('div', {
      'class': 'sts_object'
    })

    L.Poll.add(L.bind(function () {
      return L.resolveDefault(fs.read('/tmp/rpnd/status'), '{"status": "Not Found"}').then((statusJson) => {
        var sts = JSON.parse(statusJson)

        table.innerHTML = jsonToHtml(sts)
      })
    }, this), pollInterval)

    return table
  }
})

var CBIRpndConfig = form.DummyValue.extend({
  renderWidget: function (section_id, option_id, cfgvalue) {
    var table = E('div', {
      'class': 'sts_object'
    })
    table.innerHTML = jsonToHtml(cfgvalue.config)
    return table
  }
})

var CBIRpndDiagnostic = form.DummyValue.extend({
  renderWidget: function (section_id, option_id, cfgvalue) {
    var topicEl = E('input', {
      'class': 'cbi-input-text',
      'value': (cfgvalue.config.rpnd && cfgvalue.config.rpnd.root_topic) || ''
    })
    var dataEl = E('input', {
      'class': 'cbi-input-text'
    })
    /*
      div cbi-section-node
        div cbi-value
          label cbi-value-title
          div cbi-value-field
            div
              input cbi-input-text
            /
            div cbi-value-description
          /div
        /div
      /div
    */

    return (
      E('div', {
        'class': 'cbi-section-node'
      }, [
        E('div', {
          'class': 'cbi-value'
        }, [
          E('label', {
            'class': 'cbi-value-title'
          }, 'Topic'),
          E('div', {
            'class': 'cbi-value-field'
          },
            E('div', {}, topicEl)
          ),
        ]),
        E('div', {
          'class': 'cbi-value'
        }, [
          E('label', {
            'class': 'cbi-value-title',
          }, 'Message'),
          E('div', {
            'class': 'cbi-value-field'
          }, [
            E('div', {}, dataEl),
          ]),
        ]),
        E('div', {
          'class': 'cbi-value'
        }, [
          E('div', {
            'class': 'cbi-value-field'
          }, [
            E('div', {}, E('input', {
              'type': 'button',
              'class': 'cbi-button cbi-button-apply',
              'value': 'Send',
              'click': L.ui.createHandlerFn(this,
                () => {
                  mqttInMsg(topicEl.value, dataEl.value)
                }
              )
            })),
            E('div', {
              'class': 'cbi-value-description'
            }, 'Simulate mqtt message'),
          ])
        ]),
      ]))

  }
})

var CBIRpndIdent = form.DummyValue.extend({
  renderWidget: function (section_id, option_id, cfgvalue) {
    return (
      E('div', {
        'class': 'cbi-section-node'
      }, [
        E('div', {
          'class': 'cbi-value'
        }, [
          E('label', {
            'class': 'cbi-value-title'
          }, 'Ident'),
          E('div', {
            'class': 'cbi-value-field'
          }, [
            E('div', {}, E('input', {
              'type': 'button',
              'class': 'cbi-button cbi-button-apply',
              'value': 'Start',
              'click': L.ui.createHandlerFn(this,
                () => {
                  mqttInMsg((cfgvalue.config.idle && cfgvalue.config.idle.ident_topic), '')
                }
              )
            })),
            E('div', {
              'class': 'cbi-value-description'
            }, 'Blink led repeatedly'),
          ])
        ])
      ]))

  }
})

var CBIRpndChime = form.DummyValue.extend({
  renderWidget: function (section_id, option_id, cfgvalue) {
    var volume_value = E('div', { 'class': 'cbi-value-field' }, '30%')
    var volume_slider = E('input', {
      'type': 'range', 'class': 'cbi-value-field', 'min': 0, 'max': 100, 'step': 10, 'value': 30, 'change': L.ui.createHandlerFn(this,
        () => {
          volume_value.innerText = volume_slider.value + '%'
        }
      )
    })
    var table = [
      E('tr', { 'class': 'tr cbi-section-table-row' }, [
        E('td', { 'class': 'td cbi-value-field' }, volume_slider),
        E('td', { 'class': 'td cbi-value-field' }, volume_value)
      ])
    ]
    for (let chime of cfgvalue.chimes) {
      table.push(
        E('tr', {
          'class': 'tr cbi-section-table-row'
        }, [
          E('td', { 'class': 'td cbi-value-field' },
            chime.name),
          E('td',
            { 'class': 'td cbi-value-field' },
            E('input', {
              'type': 'button',
              'class': 'cbi-button cbi-button-apply',
              'value': 'Play',
              'click': L.ui.createHandlerFn(this,
                () => {
                  let msg = '{"volume":"' + volume_value.innerText + '","chime":"' + chime.name + '"}'
                  mqttInMsg((cfgvalue.config.chime && cfgvalue.config.chime.control_topic), msg)
                }
              )
            })
          )
        ])

      )
    }
    return E('table', { 'class': 'table cbi-section-table' }, table)
  }
})

return L.view.extend({
  load: () => {
    return Promise.all([
      L.resolveDefault(fs.read('/tmp/rpnd/config'), '{"config": "Not Found"}'),
      L.resolveDefault(fs.list('/opt/rpnd/chimes'), [])
    ])
  },
  render: (args) => {

    try {
      document.head.appendChild(E('link', {
        'rel': 'stylesheet',
        'href': '/luci-static/resources/view/rpnd/rpnd.css'
      }))
    } catch (e) { }

    var m, s, o,
      config = JSON.parse(args[0]),
      chimes = args[1]
    var cfgvalue = () => { return { config: config, chimes: chimes } }

    m = new form.Map('rpnd', _('Diagnostics'), _('IOT module manager'))

    s = m.section(form.TypedSection, 'rpnd')
    s.anonymous = true
    s.addremove = false


    s.tab('status', _('Active Status'))
    o = s.taboption('status', CBIRpndStatus, '__status__')
    o.optional = false

    s.tab('config', _('Configuration'))
    o = s.taboption('config', CBIRpndConfig, '__config__')
    o.cfgvalue = cfgvalue
    o.optional = false

    s.tab('control', _('Control'))
    o = s.taboption('control', CBIRpndDiagnostic, '__diagnostic__')
    o.cfgvalue = cfgvalue
    o.optional = false

    o = s.taboption('control', CBIRpndIdent, '__ident__')
    o.cfgvalue = cfgvalue
    o.optional = false

    if (config.chime) {
      s.tab('chime', _('Chime'))
      o = s.taboption('chime', CBIRpndChime, '__chime__')
      o.cfgvalue = cfgvalue
      o.optional = true
    }

    return m.render()
  },
  handleSaveApply: null,
  handleSave: null,
  handleReset: null,
})
