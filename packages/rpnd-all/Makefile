include $(TOPDIR)/rules.mk

# Name, version and release number
# The name and version of your package are used to define the variable to point to the build directory of your package: $(PKG_BUILD_DIR)
PKG_NAME:=rpnd-all
PKG_VERSION:=1.0
PKG_RELEASE:=1

# Source settings (i.e. where to find the source codes)
# This is a custom variable, used below
SOURCE_DIR:=./src/

include $(INCLUDE_DIR)/package.mk

# Package definition; instructs on how and where our package will appear in the overall configuration menu ('make menuconfig')
define Package/rpnd-all
	SECTION:=utils
	CATEGORY:=IOT
	TITLE:=RPND all mods
	DEPENDS:=+rpnd-base +rpnd-mod-chime  +rpnd-mod-gpio +rpnd-mod-i2c +rpnd-mod-rt433  +rpnd-mod-wire
endef

# Package description; a more verbose description on what our package does
define Package/rpnd-all/description
	RPND The whole shebang
endef

# Package preparation instructions; create the build directory and copy the source code.
# The last command is necessary to ensure our preparation instructions remain compatible with the patching system.
define Build/Prepare
endef

# Package build instructions; invoke the target-specific compiler to first compile the source file, and then to link the file into the final executable
define Build/Compile
# Nothing to compile
endef

# Package install instructions;
# create a directory inside the package to hold our executable,
# and then copy the executable we built previously into the folder
define Package/rpnd-all/install
endef

define Package/rpnd-all/postinst
endef

$(eval $(call BuildPackage,rpnd-all))
