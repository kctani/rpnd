#!/bin/ash
service rpnd stop
cd /opt/rpnd
node --inspect-brk=0.0.0.0:9229 app/rpnd_main.js -d
