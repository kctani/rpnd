#!/bin/ash

DIRNAME=`dirname "$0"`
PIDFILE=/var/run/rpnd.pid


start() {

	if ! grep -q Rpnd-initialized "/boot/config.txt"; then
		printf "dtoverlay=gpio-no-irq\n" >> /boot/config.txt
		printf "#Rpnd-initialized\n" >> /boot/config.txt
	fi

	if [ -f $PIDFILE ];
	then
		echo rpnd appears to be running...
	fi
		echo Launching the rpnd runtime...
		cd /opt/rpnd

		echo  timer > /sys/class/leds/led0/trigger
		echo  600 > /sys/class/leds/led0/delay_on
		echo  100 > /sys/class/leds/led0/delay_off

		/usr/bin/node /opt/rpnd/app/rpnd.js &
		echo $! > $PIDFILE
	#fi
}

stop() {
	kill  `cat $PIDFILE`
	rm -f $PIDFILE
	echo  none > /sys/class/leds/led0/trigger
}

case $1 in
  start|stop) "$1" ;;
esac
