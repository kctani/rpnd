--[[
    Luci controller
]]


module("luci.controller.rpnd.rpnd", package.seeall)


function index()
  local page

  page = entry({"admin", "rpnd"}, firstchild(), "Rpnd", 60)
  page.dependent = false

  page = entry({"admin", "rpnd", "config"}, view("rpnd/rpnd"), _("System"), 10)

  page = entry({"admin", "rpnd", "mqtt"}, view("rpnd/mqtt"), _("Mqtt"), 20)

  page = entry({"admin", "rpnd", "gpio"}, view("rpnd/gpio"), _("Gpio"), 30)
  page.uci_depends = { rpnd = { ["@rpnd[0]"] = { ["modules_enabled"] = "rpio" } } }

  page = entry({"admin", "rpnd", "rt433"}, view("rpnd/rt433"), _("RTL 433"), 40)
  page.uci_depends = { rpnd = { ["@rpnd[0]"] = { ["modules_enabled"] = "rt433" } } }

  page = entry({"admin", "rpnd", "wire"}, view("rpnd/wire"), _("One Wire"), 50)
  page.uci_depends = { rpnd = { ["@rpnd[0]"] = { ["modules_enabled"] = "wire" } } }

  page = entry({"admin", "rpnd", "diagnostic"}, view("rpnd/diagnostic"), _("Diagnostics"), 60)




end
