import { loadSVG } from "../utils.js";
import { popupController } from "./controller.js";

export const popupView = (function () {
  /**
   * Responsible for updating the names of the connected device within the
   *     correspoding field.
   */
  const updateConnectedDevicesNamesField = async () => {
    const devicesNamesField = document.getElementById("connected-devices");
    if (popupController.connectedDevices.length > 0) {
      popupController.connectedDevices.forEach(async (device) => {
        const deviceNameContainer = document.createElement("div");
        deviceNameContainer.classList.add("device-name-container");
        const statusEl = await loadSVG("./../assets/no_issue_status.svg");
        const nameEl = document.createElement("p");
        nameEl.innerHTML = device.deviceName;
        deviceNameContainer.append(statusEl, nameEl);
        devicesNamesField.appendChild(deviceNameContainer);
      });
    } else {
      devicesNamesField.innerHTML = "No device connected.";
    }
  };

  /**
   * Opens the extension home page when user presses on the manage button
   *     of the popup view.
   */
  const connectDeviceSelection = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("../home-page/home.html"),
    });
  };

  /**
   * Binds the button with a callback function to be executed on click event.
   *
   * @param {function(undefined):undefined} callbackFunction Thu function to
   *     be called when the button is clicked
   */
  const connectDeviceButtonOnClick = (callbackFunction) => {
    document
      .getElementById("connect-device-button")
      .addEventListener("click", callbackFunction);
  };

  return {
    connectDeviceSelection,
    connectDeviceButtonOnClick,
    updateConnectedDevicesNamesField,
  };
})();
