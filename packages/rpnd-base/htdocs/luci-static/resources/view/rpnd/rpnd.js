'use strict'
'require form'

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

    var m, s, o
    m = new form.Map('rpnd', _('Configuration'), _('IOT module manager'))

    s = m.section(form.TypedSection, 'rpnd', _('System'))
    s.anonymous = true
    s.addremove = false
    s.optional = false


    o = s.option(form.Value, 'node_alias', _('Hostname'), _('Used to identify device'))
    o.optional = false
    o.rmempty = false
    o.default = "RPND" 

    return m.render()
  }
})
