import { ACTIONS } from "../constants/actions.js";
import { devicesWithMappingsModel } from "../models/device-mappings-model.js";
import { popupView } from "./view.js";

export const popupController = (function () {
  /**
   * @type Array<{deviceName: string, vendorId: number, productId: number}>
   */
  let connectedDevices = [];
  return {
    connectedDevices,
  };
})();

window.addEventListener("load", async () => {
  //bind buttons and request the connected devices from the background
  popupView.connectDeviceButtonOnClick(popupView.connectDeviceSelection);
  let allDevicesMappings =
    await devicesWithMappingsModel.getDevicesMainKeyMappings();
  if (allDevicesMappings) {
    popupController.connectedDevices = Object.keys(allDevicesMappings).map(
      (deviceDetails) => {
        let [deviceName, vendorId, productId] = deviceDetails.split("-");
        return { deviceName, vendorId, productId };
      }
    );
  }
  popupView.updateConnectedDevicesNamesField();
});
