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
  open = async () => {
    const devicesWithPermissions = await navigator.hid.getDevices();
    deviceToBind = devicesWithPermissions.filter((deviceElement) => {
        return this.filter(deviceElement.productId, deviceElement.vendorId);
      })[0];
    await deviceToBind.open();
    hidDevice.addEventListener("inputreport", (event) => {
      this.entryHandler(event);
    });
  };

  handleKeyInput = (key) => {
    chrome.runtime.sendMessage({
      action: ACTIONS.KEY_EVENT,
      key: key,
    });
  };
}
