'use strict';
'require form';
'require fs';

var pollInterval = 3;

var jsontohtml = (obj) => {
  var html = '';
  for (var key in obj) {
    var value = obj[key];
    if (key == 'password' && typeof value == 'string') value = '************';
    html += '<div class="sts_property"><div class="sts_key">' + key + '</div>' + ((typeof value) == 'object' ? jsontohtml(value) : '<div class="sts_value">' + value + '</div>') + '</div>';
  }
  return '<div class="sts_object">' + html + '</div>';
}

var mqttInMsg = (topic, data) => {
  if (topic != undefined && data != undefined)
    fs.write('/tmp/rpnd/mqtt-in', topic + ':' + data);
  else console.log('\x07Bell');
};

var CBIRpndStatus = form.DummyValue.extend({
  renderWidget: function(section_id, option_id, cfgvalue) {
    var table = E('div', {
      'class': 'sts_object'
    });

    L.Poll.add(L.bind(function() {
      return L.resolveDefault(fs.read('/tmp/rpnd/status'), '{"status": "Not Found"}').then((statusJson) => {
        var sts = JSON.parse(statusJson);

        table.innerHTML = jsontohtml(sts);
      });
    }, this), pollInterval);

    return table;
  }
});

var CBIRpndConfig = form.DummyValue.extend({
  renderWidget: function(section_id, option_id, cfgvalue) {
    var table = E('div', {
      'class': 'sts_object'
    });

    table.innerHTML = jsontohtml(this.config);

    return table;
  }
});

var CBIRpndDiagnostic = form.DummyValue.extend({
  renderWidget: function(section_id, option_id, cfgvalue) {
    var topicEl = E('input', {
      'class': 'cbi-input-text',
      'value': (this.config.sys && this.config.sys.root_topic) || ''
    });
    var dataEl = E('input', {
      'class': 'cbi-input-text'
    });
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
      ]));

  }
});

var CBIRpndIdent = form.DummyValue.extend({
  renderWidget: function(section_id, option_id, cfgvalue) {
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
                  mqttInMsg((this.config.sys && this.config.sys.root_topic + 'ident'), '');
                }
              )
            })),
            E('div', {
              'class': 'cbi-value-description'
            }, 'Blink led repeatedly'),
          ])
        ])
      ]));

  }
});

return L.view.extend({
  load: () => {
    return L.resolveDefault(fs.read('/tmp/rpnd/config'), '{"config": "Not Found"}');
  },
  render: (config_s) => {

    try {
      document.head.appendChild(E('link', {
        'rel': 'stylesheet',
        'href': '/luci-static/resources/view/rpnd/rpnd.css'
      }));
    } catch (e) {}

    var m, s, o;
    var config = JSON.parse(config_s);
    m = new form.Map('rpnd', _('Diagnostics'), _('IOT module manager'));

    s = m.section(form.TypedSection, 'rpnd');
    s.anonymous = true;
    s.addremove = false;

    s.tab('status', _('Active Status'));
    s.tab('config', _('Configuration'));
    s.tab('control', _('Control'));

    o = s.taboption('status', CBIRpndStatus, '__status__');
    o.optional = false;

    o = s.taboption('config', CBIRpndConfig, '__config__');
    o.optional = false;
    o.config = config;

    o = s.taboption('control', CBIRpndDiagnostic, '__diagnostic__');
    o.optional = false;
    o.config = config;

    o = s.taboption('control', CBIRpndIdent, '__ident__');
    o.optional = false;
    o.config = config;

    return m.render();
  },
  handleSaveApply: null,
  handleSave: null,
  handleReset: null,
});
