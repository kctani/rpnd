'use strict'
'require rpc'
'require uci'
'require form'

var pins_pzw = [
	[3, 'P03 (GPIO 02, I2C1 SDA, SMI SA3)'],
	[5, 'P05 (GPIO 03, I2C1 SCL, SMI SA2)'],
	[7, 'P07 (GPIO 04, GPCLK0, SMI SA1)'],
	[8, 'P08 (GPIO 14, UART0 TXD, SMI SD6, DSI D10)'],
	[10, 'P10 (GPIO 15, UART0 RXD, SMI SD7, DPI D11)'],
	[11, 'P11 (GPIO 17, FL1, SMI SD9)'],
	[12, 'P12 (GPIO 18, PCM CLK, SMI SD10)'],
	[13, 'P13 (GPIO 27, SD0 DAT3, TE1)'],
	[15, 'P15 (GPIO 22, SD0 CLK, SMI SD14)'],
	[16, 'P16 (GPIO 23, SD0 CMD, SMI SD15)'],
	[18, 'P18 (GPIO 24, SD0 DAT0, SMI SD16)'],
	[19, 'P19 (GPIO 10, SPI0 MOSI, SMI SD2)'],
	[21, 'P21 (GPIO 09, SPI0 MISO, SMI SD1)'],
	[22, 'P22 (GPIO 25, SD0 DAT1, SMI SD17)'],
	[23, 'P23 (GPIO 11, SPI0 SCLK, SMI SD3)'],
	[24, 'P24 (GPIO 08, SPI0 CE0, SMI SD0)'],
	[26, 'P26 (GPIO 07, SPI0 CE1, SMI SWE_N / SRW_N)'],
	[27, 'P27 (GPIO 00, I2C0 SDA, SMI SA5)'],
	[28, 'P28 (GPIO 01, I2C0 SCL, SMI SA4)'],
	[29, 'P29 (GPIO 05, GPCLK1, SMI SA0)'],
	[31, 'P31 (GPIO 06, GPCLK2, SMI SOE_N / SE)'],
	[32, 'P32 (GPIO 12, PWM0, SMI SD4)'],
	[33, 'P33 (GPIO 13, PWM1, SMI SD5)'],
	[35, 'P35 (GPIO 19, PCM FS, SMI SD11)'],
	[36, 'P36 (GPIO 16, FL0, SMI SD8)'],
	[37, 'P37 (GPIO 26, SD0 DAT2, TE0)'],
	[38, 'P38 (GPIO 20, PCM DIN, SMI SD12)'],
	[40, 'P40 (GPIO 21, PCM DOUT, SMI SD13)'],
]

return L.view.extend({
	load: function () {

	},
	render: function (load_rpc_values) {

		try {
			document.head.appendChild(E('link', {
				'rel': 'stylesheet',
				'href': '/luci-static/resources/view/rpnd/rpnd.css'
			}))
		} catch (e) { }

		var m, s, o, ss, so

		m = new form.Map('rpnd', _('Configuration'), _('IOT gpio manager'))

		s = m.section(form.TypedSection, 'gpio', _('Gpio'))
		s.anonymous = true
		s.addremove = false

		o = s.option(form.Value, 'debounce', _('Debounce timer (ms)'))
		o.optional = false
		o.placeholder = '10'
		o.datatype = 'number'

		o = s.option(form.Value, 'topic_prefix', _('Prefix for gpio topic'))
		o.optional = false
		o.datatype = 'string'

		o = s.option(form.SectionValue, '__pins__', form.GridSection, 'gpio_pin', null,
			_('Pins'))

		ss = o.subsection

		ss.addremove = true
		ss.anonymous = true
		ss.sortable = true

		so = ss.option(form.Value, 'number', _('Physical pin number'))
		so.datatype = 'number'
		so.sortable = true
		so.rmempty = true
		so.sortmode = 'num'
		for (var pin of pins_pzw) so.value(pin[0], pin[0].toString() + ' - ' + pin[1])

		so = ss.option(form.ListValue, 'direction', _('Direction'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false
		so.value("IN", "IN")
		so.value("OUT", "OUT")

		so = ss.option(form.Value, 'topic', _('Topic suffix'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false

		so = ss.option(form.Value, 'level_high', _('High name'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false

		so = ss.option(form.Value, 'level_low', _('Low name'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false

		so = ss.option(form.ListValue, 'initial_level', _('Initial Level'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false
		so.depends('direction', 'OUT')
		so.value('LOW', 'LOW')
		so.value('HIGH', 'HIGH')

		so = ss.option(form.ListValue, 'pull', _('Pull up/down'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false
		so.value('UP', 'UP')
		so.value('DOWN', 'DOWN')
		so.value('NONE', 'NONE')
		so.depends('direction', 'IN')

		so = ss.option(form.ListValue, 'edge', _('Edge'))
		so.datatype = 'string'
		so.sortable = true
		so.rmempty = false
		so.depends('direction', 'IN')
		so.value("UP", "UP")
		so.value("DOWN", "DOWN")
		so.value("BOTH", "BOTH")

		return m.render()

	}
})
