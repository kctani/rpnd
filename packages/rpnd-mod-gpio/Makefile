include $(TOPDIR)/rules.mk

# Name, version and release number
# The name and version of your package are used to define the variable to point to the build directory of your package: $(PKG_BUILD_DIR)
PKG_NAME:=rpnd-mod-gpio
PKG_VERSION:=1.0
PKG_RELEASE:=1

# Source settings (i.e. where to find the source codes)
# This is a custom variable, used below
SOURCE_DIR:=./src/

include $(INCLUDE_DIR)/package.mk

# Package definition; instructs on how and where our package will appear in the overall configuration menu ('make menuconfig')
define Package/rpnd-mod-gpio
	SECTION:=utils
	CATEGORY:=IOT
	TITLE:=RPND mod Gpio
	DEPENDS:=+rpnd  
endef

# Package description; a more verbose description on what our package does
define Package/rpnd-mod-gpio/description
	NodeJs Mqtt driven Iot application
endef

# Package preparation instructions; create the build directory and copy the source code.
# The last command is necessary to ensure our preparation instructions remain compatible with the patching system.
define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(CP) ./* $(PKG_BUILD_DIR)/
endef

# Package build instructions; invoke the target-specific compiler to first compile the source file, and then to link the file into the final executable
define Build/Compile
# Nothing to compile
endef

# Package install instructions;
# create a directory inside the package to hold our executable,
# and then copy the executable we built previously into the folder
define Package/rpnd-mod-gpio/install
	$(INSTALL_DIR) $(1)/opt/rpnd/app/
	$(INSTALL_DIR) $(1)/opt/rpnd/app/modules/
	$(CP) ./src/app/* $(1)/opt/rpnd/app/
	$(INSTALL_BIN) ./src/service/start.sh $(1)/opt/rpnd/
	$(INSTALL_DIR) $(1)/etc/init.d/
	$(INSTALL_BIN) ./src/service/rpnd $(1)/etc/init.d/
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/rpnd/
	$(CP) ./htdocs/*  $(1)/www/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d/
	$(CP) ./root/* $(1)/
endef

define Package/rpnd-mod-gpio/postinst
endef

$(eval $(call BuildPackage,rpnd))
