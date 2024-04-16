const LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS = "all devices key mappings";
const LOCAL_STORAGE_USER_EDITED_DEVICES_KEY_MAPPINGS =
  "devices key mappings set by the user";

import { DEVICES_LIST } from "./Drivers/devices-list.js";
import { ACTIONS } from "./actions.js";
import devicesMappings from "./another-device-mappings.json" assert { type: "json" };

/**
 * @type Array<{deviceName: string, vendorId: number, productId: number}>
 */
let connectedDevices = [];

/**
 * @typedef {Object.<string, DeviceKeysMappings>} DevicesKeysMappings Holds all
 *     devices keymappings. The object's key form is: deviceName-vid-pid.
 */

/**
 * @typedef {Object.<string, MappingInfo} DeviceKeysMappings Holds the device
 *     keys with their corresponding mappings and order to be shown
 */

/**
 * @typedef {Object} MappingInfo
 * @property {number} order Holds the order this key mapping had been added
 * @property {Array<{key: string, keycode: number}>} outputKeys Hold the key to
 *     be shown when the corresponding device key is pressed
 */

/**
 * @type {DevicesKeysMappings}
 */
let allsupportedDevicesKeyMappings = undefined;

document.addEventListener("DOMContentLoaded", function () {
  let device = undefined;
  loadMappings2();
  //requst a device from webHID when button is pressed
  document.getElementById("myButton").addEventListener("click", async () => {
    await navigator.hid
      .requestDevice({ filters: [] })
      .then(async (devices) => {
        //after selecting a device send msg to inform background worker of that
        if (devices[0] === undefined) {
          console.log("popup2 device choosing has been canceled 2lmafrood");
          return;
        }
        device = devices[0];
        console.log(device);
        // To inform the service worker that the device of the pid and vid
        // specified within the message has been granted permission in order
        // to connect to it
        chrome.runtime.sendMessage({
          action: ACTIONS.DEVICE_PERM_UPDATED,
          devicesKeyMappingsSupportedByAdmin: allsupportedDevicesKeyMappings,
          productId: devices[0]?.productId,
          vendorId: devices[0]?.vendorId,
        });
      })
      .catch((error) => {
        chrome.notifications.create("", {
          title: "Connection Failure",
          message: "Couldn't connect to device, check permissions.",
          type: "basic",
          iconUrl: "./extension-logo.png",
        });
        console.error("Error connecting to HID device:", error);
      });
  });

  let inputMode = "normal";
  const deviceInputModeButton = document.getElementById("test-mode-button");
  deviceInputModeButton.addEventListener("click", () => {
    if (inputMode === "normal") {
      inputMode = "test";
      deviceInputModeButton.textContent = "Switch to normal mode";
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
        mode: inputMode,
      });
    } else if (inputMode === "test") {
      inputMode = "normal";
      deviceInputModeButton.textContent = "Switch to test mode";
      const deviceInputField = document.getElementById("device-input-field");
      deviceInputField.value = "";
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
        mode: inputMode,
      });
    }
  });

  document.getElementById("test-input-button").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: ACTIONS.TEST_INPUT_SIMULATION });
  });
});

window.addEventListener("load", async () => {
  showMappings();
  chrome.runtime.sendMessage({
    action: ACTIONS.GET_DEVICE_NAME,
  });
});

//this function load all mapping for all device from local storage and show them
//the local storage is teh same as popup so it just read from it and rely on popup to make any updates on it
function showMappings() {
  let allsupportedDevicesKeyMappings = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS)
  );
  /**
   * @type {DevicesKeysMappings}
   */
  const userDefinedDevicesKeysMappings = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_USER_EDITED_DEVICES_KEY_MAPPINGS)
  );

  if (userDefinedDevicesKeysMappings) {
    allsupportedDevicesKeyMappings = userDefinedDevicesKeysMappings;
  }
  console.log(userDefinedDevicesKeysMappings);
  let devicesSpace = document.getElementById("devices-space");

  while (devicesSpace.firstChild) {
    devicesSpace.removeChild(devicesSpace.firstChild);
  }

  if (allsupportedDevicesKeyMappings) {
    for (let someDeviceKeyMappingsKey of Object.keys(
      allsupportedDevicesKeyMappings
    )) {
      const arrayedDeviceDetails = someDeviceKeyMappingsKey.split("-");
      const deviceDetails = {
        name: arrayedDeviceDetails[0],
        vendorId: arrayedDeviceDetails[1],
        productId: arrayedDeviceDetails[2],
      };
      let mappingDiv = document.createElement("div");
      mappingDiv.classList.add("mapping-div");
      mappingDiv.setAttribute("id", someDeviceKeyMappingsKey);
      const deviceDivHeader = document.createElement("div");
      deviceDivHeader.setAttribute("class", "row-elements-on-sides");
      const disconnectButton = document.createElement("button");
      disconnectButton.setAttribute(
        "id",
        `${someDeviceKeyMappingsKey}-disconnect-button`
      );
      connectedDevices.some(
        (connectedDevice) =>
          connectedDevice.deviceName == deviceDetails.name &&
          connectedDevice.productId == deviceDetails.productId &&
          connectedDevice.vendorId == deviceDetails.vendorId
      )
        ? undefined
        : disconnectButton.setAttribute("disabled", true);
      disconnectButton.innerHTML = "Disconnect";
      disconnectButton.setAttribute("style", "margin-right: 15px");
      disconnectButton.addEventListener("click", () => {
        disconnectDevice(someDeviceKeyMappingsKey);
        disconnectButton.setAttribute("disabled", true);
      });
      let nameElement = document.createElement("h2");
      nameElement.innerHTML = `Device name: ${deviceDetails.name}`;
      deviceDivHeader.appendChild(nameElement);
      deviceDivHeader.appendChild(disconnectButton);
      mappingDiv.appendChild(deviceDivHeader);
      const vid = document.createElement("label");
      vid.innerHTML = `Vendor id:  ${deviceDetails.vendorId}`;
      const pid = document.createElement("label");
      pid.innerHTML = `Product id:  ${deviceDetails.productId}`;
      mappingDiv.appendChild(vid);
      mappingDiv.appendChild(pid);
      const keyMappingsWrapper = document.createElement("div");
      keyMappingsWrapper.style.marginTop = "10px";

      for (
        let i = 0;
        i <
        Object.keys(allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey])
          .length;
        i++
      ) {
        let keyMapping = document.createElement("div");
        keyMapping.classList.add("key-mapping");

        let inputKeyLabel = document.createElement("label");
        inputKeyLabel.innerHTML = "Key:";
        inputKeyLabel.classList.add("input-key-label");
        keyMapping.appendChild(inputKeyLabel);

        let inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.classList.add("input-key");
        inputElement.disabled = true;
        let deviceInputKeyToShow = Object.keys(
          allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey]
        ).filter(
          (deviceInputKey) =>
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey][
              deviceInputKey
            ].order ==
            i + 1
        )[0];
        inputElement.value = deviceInputKeyToShow;
        keyMapping.appendChild(inputElement);

        let outputKeyLabel = document.createElement("label");
        outputKeyLabel.innerHTML = "Mapping:";
        outputKeyLabel.classList.add("output-key-label");
        keyMapping.appendChild(outputKeyLabel);

        let outputContainer = document.createElement("div");
        outputContainer.classList.add("output-container");
        console.log(allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey]);
        console.log(deviceInputKeyToShow);
        for (
          let j = 0;
          j <
          allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey][
            deviceInputKeyToShow
          ].outputKeys.length;
          j++
        ) {
          let outputKeyElement = document.createElement("input");
          outputKeyElement.type = "text";
          outputKeyElement.value =
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey][
              deviceInputKeyToShow
            ].outputKeys[j]["key"];
          outputKeyElement.disabled = true;
          outputKeyElement.classList.add("output-key");
          outputContainer.appendChild(outputKeyElement);
        }
        keyMapping.appendChild(outputContainer);
        keyMappingsWrapper.append(keyMapping);
        mappingDiv.appendChild(keyMapping);
      }
      mappingDiv.appendChild(keyMappingsWrapper);
      devicesSpace.appendChild(mappingDiv);
    }
  }
}

/**
 *
 * @param {string} device Holds device's details on this form name-vid-pid
 */
function disconnectDevice(device) {
  chrome.runtime.sendMessage({
    action: ACTIONS.DISCONNECT_DEVICE,
    device: device,
  });
}

function loadMappings2() {
  const supportedDevices = [];
  // to find what devices are supported are also listed in the JSON config file
  DEVICES_LIST.forEach((device) => {
    const filterResult = devicesMappings.filter((deviceMapping) => {
      return (
        device.driver.vendorId === deviceMapping.vid &&
        device.driver.productId === deviceMapping.pid
      );
    })[0];

    if (filterResult) {
      filterResult["deviceName"] = device.driver.deviceName;
      supportedDevices.push(filterResult);
    }
  });
  console.log(supportedDevices);
  allsupportedDevicesKeyMappings = {};

  for (const device of supportedDevices) {
    const mappings = {};
    allsupportedDevicesKeyMappings[
      `${device.deviceName}-${device.vid}-${device.pid}`
    ] = {};

    for (const [index, value] of Object.keys(device.keyMappings).entries()) {
      const key = value;
      mappings[key] = device.keyMappings[key].outputKeys.map((char) => ({
        key: char,
        keycode: char.charCodeAt(0),
      }));
      allsupportedDevicesKeyMappings[
        `${device.deviceName}-${device.vid}-${device.pid}`
      ][key] = {
        label: device.keyMappings[key].label,
        outputKeys: mappings[key],
        order: index + 1,
      };
    }
    localStorage.setItem(
      LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS,
      JSON.stringify(allsupportedDevicesKeyMappings)
    );
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup2", message);
  //indicate that something changed and recreate the mapping
  if (message.action === ACTIONS.UPDATE_KEY_MAPPING) {
    showMappings();
  } else if (message.action === ACTIONS.DEVICE_CHANGED) {
    if (message.connectedDevices?.length > 0) {
      if (!message?.responseForGetDeviceName) {
        console.log(message.connectedDevices);
        const allsupportedDevicesKeyMappings = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS)
        );
        const userDefinedDeviceMappings = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_USER_EDITED_DEVICES_KEY_MAPPINGS)
        );
        chrome.runtime.sendMessage({
          action: ACTIONS.UPDATE_KEY_MAPPING,
          keyMapping: userDefinedDeviceMappings
            ? userDefinedDeviceMappings
            : allsupportedDevicesKeyMappings,
        });
      }
      let connectedDevicesNames = "";
      message.connectedDevices.forEach((connectedDevice, index) => {
        connectedDevicesNames += `${index == 0 ? "" : ", "}${
          connectedDevice.deviceName
        }`;
        document
          .getElementById(
            `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}-disconnect-button`
          )
          .removeAttribute("disabled");
      });
      document.getElementById(
        "device-name"
      ).textContent = `Devices connected: ${connectedDevicesNames}`;
      document.getElementById("test-mode-button").removeAttribute("disabled");
      connectedDevices = message.connectedDevices;
    } else {
      document.getElementById(
        "device-name"
      ).textContent = `No device connected`;
      document
        .getElementById("test-mode-button")
        .setAttribute("disabled", true);
    }
  }
});
