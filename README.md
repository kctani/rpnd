# Rpnd

Raspberry Pi Zero Iot appliance

# Overview

Rpnd is based on NodeJs on Openwrt running on a Raspberry Pi Zero W.
It uses Mqtt to communicate with automation systems. Modules allow control and moditoring of:

- **Gpio**: input and output
- **Wire**: One Wire devices
- **I2c Bus**: I2c devices
- **Rtl433**: Monitor 433mhz devices.
- **Chime**: Play a wav file to audio device.

A web based GUI is included to allow configuration and diagnosis of a running device.
It is distributed as an Openwrt package as well as an Openwrt image.

## Openwrt

The Openwrt distribution aimed at routers and recently iot devices offer two main advantages:

-   Compact read only images with a small writable configuration partition.
-   A large base of applications and utilities tailored to small environments.
-   Luci web based configuration with integrated system management.
-   A build system of customized images.
-   System upgrade for replacing images over the network.
-   Simplified configuration files with a command line update utility UCI.

Rpnd make extensive use of the Luci web interface for it's configuration.

## NodeJs

NodeJs hosts the module controller matching Mqtt topics to device input and outputs.
Openwrt packages include an version of NodeJs and a limited number of NodeJs packages.
To allow greater flexibility Rpnd uses the [nxhack/openwrt-node-packages](https://github.com/nxhack/openwrt-node-packages) feed.

## Setup

For a vanilla system simply download the latest image write it to an micro sd card and power up your Rpi.
The system will start an access point. Connect to the AP and configure the Wifi to connect to your router.
Obtain the device ip address. Use it to connect to the configuration interface.

## Note

Supported on Openwrt release: openwrt-19.07. (possibly on earlier releases with no web ui)

## Guides

See [Getting Started](https://github.com/kctani/rpnd/blob/master/GETSTART.md)
