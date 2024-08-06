import { ACTIONS } from "../constants/actions.js";
import { popupView } from "./view.js";
import { devicesWithMappingsModel } from "../models/device-mappings-model.js";

export const popupController = (function () {
  /**
   * @type Array<{deviceName: string, vendorId: number, productId: number}>
   */
  let connectedDevices = [];
  return {
    connectedDevices,
  };
})();

/**
 * Sends message to ask for connected devices.
 */
const requestConnectedDevices = () => {
  chrome.runtime.sendMessage({
    action: ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS,
  });
};

window.addEventListener("load", async () => {
  //bind buttons and request the connected devices from the background
  popupView.connectDeviceButtonOnClick(popupView.connectDeviceSelection);
  requestConnectedDevices();
});

//add listeners to msgs
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup");
  console.log(message);
  switch (message.action) {
    case ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE:
      popupController.connectedDevices = message.connectedDevices;
      console.log(message.connectedDevices);
      popupView.updateConnectedDevicesNamesField();
      break;
  }
});
