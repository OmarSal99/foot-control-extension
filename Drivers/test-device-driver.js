import { BaseDriver } from "./base-driver.js";

export class TestDeviceDriver extends BaseDriver {
  productId = 360;
  vendorId = 62345;
  entryHandler = (event, callbackFunction) => {};

  open = async (callbackFunction) => {
    const devicesWithPermissions = await navigator.hid.getDevices();
    let device = devicesWithPermissions.filter((deviceElement) => {
      return this.filter(deviceElement.productId, deviceElement.vendorId);
    })[0];
    console.log("device is", device);
    await device.open();
  };
}
