export class BaseDriver {
  productId = 0x0000;
  vendorId = 0x0000;

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
      try {
        await device.open();
        device.addEventListener("inputreport", (event) => {
          this.entryHandler(event, callbackFunction);
        });
      } catch (error) {
        console.log(error);
      }
    }
  };
}
