import { ACTIONS } from "../actions.js";

export class BaseDriver {
  productId = 0x0000;
  vendorId = 0x0000;

  filter = (productId, vendorId) => {
    return (
      productId == this.productId &&
      vendorId == this.vendorId
    );
  };
  open = async (callbackFunction) => {
    const devicesWithPermissions = await navigator.hid.getDevices();
    let device = devicesWithPermissions.filter((deviceElement) => {
        return this.filter(deviceElement.productId, deviceElement.vendorId);
      })[0];
    await device.open();
    device.addEventListener("inputreport", (event) => {
      this.entryHandler(event, callbackFunction);
    });
  };
}
