# Getting Started

## The easy way

Download the image file for the latest release from [github.com/kctani/rpnd](https://github.com/kctani/rpnd/releases) and flash it to your micro sd card.
Power on your rpi zero, it will start a an ad-hoc Wi-Fi network `Rpnd-Setup`. Connect to the ap and navigate to `http:/192.168.77.1/`.
Your browser may warn you that you connection is unsafe, override if necessary.
Log in as root with no password, navigate to *System/Administration* and set a password.
Navigate to Network/Wireless click *Scan*. Once the scan has completed, click *Join Network* for your preferred network from the scan list.
Enter your *WPA passphrase* and select *lan* as your *firewall-zone* click *Save* and click *Save* again


## The long way

Building your own image lets you customize the image for your own needs.

~~~
git clone https://github.com/openwrt/openwrt.git 
cd openwrt
git checkout openwrt-23.05

# Append  "src-git rpnd https://github.com/kctani/rpnd.git"  to feeds.conf

./scripts/feeds update
./scripts/feeds install -a -p packages
./scripts/feeds install -a -p luci
./scripts/feeds install -a -p rpnd
rm package/feeds/packages/node* # †
./scripts/feeds install -a -p node
~~~
† See [github.com/nxhack/openwrt-node-packages](https://github.com/nxhack/openwrt-node-packages)

Use `make menuconfig` to display/modify the configuration.

~~~
# Select...
#
#  Target System (Broadcom BCM27xx)
#  Subtarget (BCM2708 boards (32 bit))
#  Target Profile (Raspberry Pi B/B+/CM/Zero/ZeroW) 
#
#  Iot-->rpnd-all
#
# Exit
make -j8
~~~

A `factory` and a `sysupgrade` image will be created in `bin/targets/bcm2708/bcm2708/`.
Flash the factory image to a micro sd card. and follow instructions *The easy way* above.

After building and testing your image, run `make menuconfig` to further personalize your image.  

#### Note:
rpnd uci-defaults appends `dtoverlay=gpio-no-irq` to `/boot/config.txt`,
