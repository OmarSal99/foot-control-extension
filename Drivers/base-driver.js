export class BaseDriver {
  productId = 0x0000;
  vendorId = 0x0000;
  hidDevice;
  deviceName;

  /**
   * Responsible for opening HID device if given permissions and if not already
   *     opened, then returns the HID device.
   *
   * @returns {HIDDevice | undefined} Returns undefined if the device is
   *     already opened
   */
  open = async () => {
    const devicesWithPermissions = await navigator.hid.getDevices();
    console.log(devicesWithPermissions);
    console.log(this.productId);
    let device = devicesWithPermissions.filter((deviceElement) => {
      // return this.filter(deviceElement.productId, deviceElement.vendorId);
      return (
        this.productId == deviceElement.productId &&
        deviceElement.vendorId == this.vendorId
      );
    })[0];
    console.log(device);
    if (device) {
      this.hidDevice = device;
      if (device?.opened) {
        return;
      }
      await this.hidDevice.open();
    }
  };

  setEntryHandler = () => {};

  /**
   * Closes the HID device.
   */
  close = async () => {
    console.log(`${this.hidDevice} has been closed`);
    // await this.hidDevice.close();
    await this.hidDevice.forget();
  };
}
