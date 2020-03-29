'use strict';
'require rpc';
'require uci';
'require form';

return L.view.extend({
  load: function() {

  },
  render: function() {

    try {
      document.head.appendChild(E('link', {
        'rel': 'stylesheet',
        'href': '/luci-static/resources/view/rpnd/rpnd.css'
      }));
    } catch (e) {}

    var m, s, o;
    m = new form.Map('rpnd', _('Configuration'), _('IOT module manager'));

    s = m.section(form.TypedSection, 'rpnd', _('System'));
    s.anonymous = true;
    s.addremove = false;
    s.optional = false;


    o = s.option(form.Value, 'node_alias', _('Hostname'), _('Used to identify module'));
    o.optional = false;
    o.rmempty = false;


    o = s.option(form.MultiValue, 'modules_enabled', _('Module'), _('Selects modules to load'));
    o.value('rpio', 'Gpio General purpose io');
    o.value('rt433', 'RT 433 receiver');
    o.value('wire', 'OneWire serial bus');
    o.optional = true;

    return m.render();
  }
});
