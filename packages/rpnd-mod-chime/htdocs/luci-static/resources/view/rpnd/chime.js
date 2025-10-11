'use strict'
'require form'
'require fs'

return L.view.extend({
  load: function () {
    return L.resolveDefault(fs.read('/tmp/rpnd/config'), '{"config": "Not Found"}')
  },
  render: function (config) {

    try {
      document.head.appendChild(E('link', {
        'rel': 'stylesheet',
        'href': '/luci-static/resources/view/rpnd/rpnd.css'
      }))
    } catch (e) { }

    var m, s, o
    config = JSON.parse(config)

    m = new form.Map('rpnd', _('Configuration'), _('Play Chimes'))

    s = m.section(form.TypedSection, 'chime', _('Chime'))
    s.anonymous = true
    s.addremove = false

    o = s.option(form.Flag, 'disabled', _('Disabled'), _('Disable Module'))

    o = s.option(form.Value, 'root_topic', _('root Topic'), _('Root topic for chime'))
    o.optional = false
    o.datatype = 'string'
    o.default = 'chime'

    o = s.option(form.Value, 'ctrl_topic', _('Control Topic'), _('Command topic to play chime'))
    o.optional = true
    o.datatype = 'string'
    o.default = 'play'

    o = s.option(form.Value, 'aplay_options', _('Aplay Options'), _('Options check aplay -h'))
    o.optional = true
    o.datatype = 'string'
    o.default = ''

    o = s.option(form.Value, 'amixer_card', _('Amixer Card'), _('Card number from aplay -l'))
    o.optional = true
    o.datatype = 'number'
    o.default = '0'

    o = s.option(form.Value, 'amixer_sID', _('Amixer sID'), _('Check amixer -c (card from above)'))
    o.optional = true
    o.datatype = 'string'
    o.default = 'PCM,0'

    o = s.option(form.FileUpload, '', _('Upload chime'), _('Upload wav file'))
    o.root_directory = config?.chime?.chimes_folder ?? '/'
    return m.render()
  }
})
