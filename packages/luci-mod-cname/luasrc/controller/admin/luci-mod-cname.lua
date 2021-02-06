-- Copyright 2008 Steven Barth <steven@midlink.org>
-- Copyright 2011-2018 Jo-Philipp Wich <jo@mein.io>
-- Licensed to the public under the Apache License 2.0.

module("luci.controller.admin.luci-mod-cname", package.seeall)

function index()
  local page

  page = entry({"admin", "network", "cname"}, view("network/cname"), _("Canonical Names"), 10)
  page.leaf   = true
  page.subindex = true

end
