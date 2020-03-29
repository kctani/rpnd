'use strict';
'require rpc';
'require uci';
'require form';

var pins_pzw = [
  [3, 'P3 (I2C1 SDA, SMI SA3)'],
  [5, 'P5 (I2C1 SCL, SMI SA2)'],
  [7, 'P7 (GPCLK0, SMI SA1)'],
  [8, 'P8 (UART0 TXD, SMI SD6, DSI D10)'],
  [10, 'P10 (UART0 RXD, SMI SD7, DPI D11)'],
  [11, 'P11 (FL1, SMI SD9)'],
  [12, 'P12 (PCM CLK, SMI SD10)'],
  [13, 'P13 (SD0 DAT3, TE1)'],
  [15, 'P15 (SD0 CLK, SMI SD14)'],
  [16, 'P16 (SD0 CMD, SMI SD15)'],
  [18, 'P18 (SD0 DAT0, SMI SD16)'],
  [19, 'P19 (SPI0 MOSI, SMI SD2)'],
  [21, 'P21 (SPI0 MISO, SMI SD1)'],
  [22, 'P22 (SD0 DAT1, SMI SD17)'],
  [23, 'P23 (SPI0 SCLK, SMI SD3)'],
  [24, 'P24 (SPI0 CE0, SMI SD0)'],
  [26, 'P26 (SPI0 CE1, SMI SWE_N / SRW_N)'],
  [27, 'P27 (I2C0 SDA, SMI SA5)'],
  [28, 'P28 (I2C0 SCL, SMI SA4)'],
  [29, 'P29 (GPCLK1, SMI SA0)'],
  [31, 'P31 (GPCLK2, SMI SOE_N / SE)'],
  [32, 'P32 (PWM0, SMI SD4)'],
  [33, 'P33 (PWM1, SMI SD5)'],
  [35, 'P35 (PCM FS, SMI SD11)'],
  [36, 'P36 (FL0, SMI SD8)'],
  [37, 'P37 (SD0 DAT2, TE0)'],
  [38, 'P38 (PCM DIN, SMI SD12)'],
  [40, 'P40 (PCM DOUT, SMI SD13)'],
];

return L.view.extend({
  load: function() {

  },
  render: function(load_rpc_values) {

    try {
      document.head.appendChild(E('link', {
        'rel': 'stylesheet',
        'href': '/luci-static/resources/view/rpnd/rpnd.css'
      }));
    } catch (e) {}

    var m, s, o, ss, so;

    m = new form.Map('rpnd', _('Configuration'), _('IOT gpio manager'));

    s = m.section(form.TypedSection, 'gpio', _('Gpio'));
    s.anonymous = true;
    s.addremove = false;

    o = s.option(form.Value, 'debounce', _('Debounce timer (ms)'));
    o.optional = false;
    o.placeholder = '10';
    o.datatype = 'number';

    o = s.option(form.Value, 'topic_prefix', _('Prefix for gpio topic'));
    o.optional = false;
    o.datatype = 'string';

    o = s.option(form.SectionValue, '__pins__', form.GridSection, 'gpio_pin', null,
      _('Pins'));

    ss = o.subsection;

    ss.addremove = true;
    ss.anonymous = true;
    ss.sortable = true;

    so = ss.option(form.Value, 'number', _('Physical pin number'));
    so.datatype = 'number';
    so.sortable = true;
    so.rmempty = true;
    so.sortmode = 'num';
    for (var pin of pins_pzw) so.value(pin[0], pin[1]);

    so = ss.option(form.ListValue, 'direction', _('Direction'));
    so.datatype = 'string';
    so.sortable = true;
    so.rmempty = false;
    so.value("in", "IN")
    so.value("out", "OUT")

    so = ss.option(form.ListValue, 'edge', _('Edge'));
    so.datatype = 'string';
    so.sortable = true;
    so.rmempty = false;
    so.value("up", "UP")
    so.value("down", "DOWN")
    so.value("both", "BOTH")

    so = ss.option(form.Value, 'topic', _('Topic suffix'));
    so.datatype = 'string';
    so.sortable = true;
    so.rmempty = false;

    so = ss.option(form.Value, 'level_high', _('High name'));
    so.datatype = 'string';
    so.sortable = true;
    so.rmempty = false;

    so = ss.option(form.Value, 'level_low', _('Low name'));
    so.datatype = 'string';
    so.sortable = true;
    so.rmempty = false;

    return m.render();
  }
});
