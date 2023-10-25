#!/bin/ash
kill  `cat /var/run/rpnd.pid`
cd /opt/rpnd
node --inspect-brk=0.0.0.0:9229 app/rpnd.js
