#!/bin/ash

DIRNAME=`dirname "$0"`
PIDFILE=/var/run/rpnd.pid


start() {

	if [ -f $PIDFILE ];
	then
		echo rpnd appears to be running...
	fi
		echo Launching the rpnd runtime...
		cd /opt/rpnd

		/usr/bin/node /opt/rpnd/app/rpnd.js &
		echo $! > $PIDFILE
	#fi
}

stop() {
	kill  `cat $PIDFILE`
	rm -f $PIDFILE
}

case $1 in
  start|stop) "$1" ;;
esac
