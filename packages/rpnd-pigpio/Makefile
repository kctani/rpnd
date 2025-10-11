#
# Author: Ken
#
#

include $(TOPDIR)/rules.mk

PKG_NAME:=pigpio
PKG_VERSION:=79
PKG_RELEASE:=0
PKG_INSTALL:=1


PKG_SOURCE:=v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/joan2937/pigpio/archive/refs/tags/
PKG_HASH:=c5337c0b7ae888caf0262a6f476af0e2ab67065f7650148a0b21900b8d1eaed7
PKG_BUILD_DIR:=$(BUILD_DIR)/pigpio-$(PKG_VERSION)

PKG_MAINTAINER:=noone
PKG_LICENSE:=UNLICENCE
PKG_LICENSE_FILES:=COPYING

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk  

define Package/pigpio
	SECTION:=utils
	CATEGORY:=IOT
	TITLE:=pigpio is a C library for the Raspberry which allows control of the General Purpose Input Outputs (GPIO).
  URL:=https://github.com/joan2937/pigpio
  DEPENDS:=
endef

define Package/pigpio/description
	pigpio is a C library for the Raspberry
endef

define Package/pigpio-dev
  SECTION:=devel
  CATEGORY:=Development
  TITLE:=Pigpio development files
  URL:=https://github.com/joan2937/pigpio
  DEPENDS:=+pigpio
endef

define Package/pigpio-dev/description
  Headers and libs for developing with pigpio.
endef

# Adjust for pigpio's build (it uses make; no autotools/CMake by default)
define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR) \
		$(TARGET_CONFIGURE_OPTS) \
		INSTALL=/usr/include/pigpio  # Install headers to /usr/include/pigpio
	cd $(PKG_BUILD_DIR); make
endef

define xxPackage/pigpio-dev/install
	$(INSTALL_DIR) $(STAGING_DIR)/usr/include
	$(CP) $(PKG_BUILD_DIR)/pigpio.h $(STAGING_DIR)/usr/include/
	$(INSTALL_DIR) $(STAGING_DIR)/usr/lib
	$(RM) $(STAGING_DIR)/usr/lib/libpigpio.so* || true
	$(CP) $(PKG_BUILD_DIR)/libpigpio.so.1 $(STAGING_DIR)/usr/lib/
	$(LN) libpigpio.so.1 $(STAGING_DIR)/usr/lib/libpigpio.so  # Symlinks if needed
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include
	$(CP) $(PKG_BUILD_DIR)/pigpio.h $(1)/usr/include/
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_BUILD_DIR)/libpigpio.so $(1)/usr/lib/
	$(LN) $(1)/usr/lib/libpigpio.so $(1)/usr/lib/libpigpio.so.1  # Symlinks if needed
endef

define Package/pigpio/install
	$(INSTALL_DIR)  $(1)/usr/bin
	$(CP)  $(PKG_INSTALL_DIR)/usr/bin/*          $(1)/usr/bin
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP)  $(PKG_INSTALL_DIR)/usr/lib/*          $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/include
	$(CP)  $(PKG_INSTALL_DIR)/usr/include/*      $(1)/usr/include
	$(INSTALL_DIR) $(1)/etc/init.d/
	$(INSTALL_BIN) ./src/service/pigpiod 				 $(1)/etc/init.d/

endef

$(eval $(call BuildPackage,pigpio-dev))
$(eval $(call BuildPackage,pigpio))

