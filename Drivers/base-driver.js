export class BaseDriver {
  productId = 0x0000;
  vendorId = 0x0000;
  hidDevice;

  filter = (productId, vendorId) => {
    return productId == this.productId && vendorId == this.vendorId;
  };
  open = async (callbackFunction) => {
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
      // device.addEventListener("inputreport", (event) => {
      //   this.entryHandler(event, callbackFunction);
      // });
    }
  };

  setEntryHandler = () => {};

  close = async () => {
    await this.hidDevice.close();
  };
}
