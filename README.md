# Rpnd
Raspberry Pi Zero Iot appliance

# Overview

Rpnd is based on NodeJs on Openwrt running on a Raspberry Pi Zero W. It uses Mqtt to communicate with automation systems. Modules allow control and moditoring of:

 - **Gpio**: input and output
 - **Wire**: One Wire devices
 - **Rtl433**: Monitor 433mhz devices.

 A web based GUI is included to allow configuration and diagnosis of a running device.

## Openwrt

The Openwrt distribution aimed at routers and recently iot devices offer two main advantages:

- Compact read only images with a small writable configuration partition.
- A large base of applications and utilities tailored to small environments.
- Luci web based configuration with integrated system management.
- A build system of customized images.
- System upgrade for replacing images over the network.
- Simplified configuration files with a command line update utility UCI.

Rpnd takes advantage of the Luci web interface

## NodeJs

NodeJs hosts the module controller matching Mqtt topics to device input and outputs.

## Setup

For a vanilla system simply download the latest image write it to an micro sd card and power up your Rpi. The system will start an access point. Connect to the ap and configure the wifi to connect to your router. Obtain the device ip address. Use it to connect to the configuration interface.
