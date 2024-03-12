const LOCAL_STORAGE_KEY_MAPPING = "foot pedal key mapping";
const LOCAL_STORAGE_ORDER_LIST = "foot pedal order list";

import { DEVICES_LIST } from "./Drivers/devices-list.js";
import { ACTIONS } from "./actions.js";
import devicesMappings from "./devices-mappings.json" assert { type: "json" };

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
        chrome.runtime.sendMessage({
          action: ACTIONS.DEVICE_PERM_UPDATED,
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
      const deviceInputField = document.getElementById("device-input-field");
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
        mode: inputMode,
      });
      // console.log(device.getEventListeners());
      // console.log(listener);
    } else if (inputMode === "test") {
      inputMode = "normal";
      deviceInputModeButton.textContent = "Switch to test mode";
      const deviceInputField = document.getElementById("device-input-field");
      deviceInputField.value = "";
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
        mode: inputMode,
      });
      // console.log(device.getEventListeners());
      // console.log(HIDInputReportEvent.composedPath());
    }
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
  let devices = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MAPPING));
  console.log("devices are", devices);
  let devicesSpace = document.getElementById("devices-space");
  while (devicesSpace.firstChild) {
    devicesSpace.removeChild(devicesSpace.firstChild);
  }

  if (devices) {
    for (let name of Object.keys(devices)) {
      console.log(name);
      let mappingDiv = document.createElement("div");
      mappingDiv.classList.add("mapping-div");
      let nameElement = document.createElement("h2");
      nameElement.innerHTML = `Device name: ${name}`;
      mappingDiv.appendChild(nameElement);
      const vid = document.createElement("label");
      vid.innerHTML = `Vendor id:  ${devices[name].vid}`;
      const pid = document.createElement("label");
      pid.innerHTML = `Product id:  ${devices[name].pid}`;
      mappingDiv.appendChild(vid);
      mappingDiv.appendChild(pid);

      let device = JSON.parse(
        localStorage.getItem(
          LOCAL_STORAGE_KEY_MAPPING +
            "-" +
            name +
            "-" +
            devices[name].vid +
            "-" +
            devices[name].pid
        )
      );
      let orderList = JSON.parse(
        localStorage.getItem(
          LOCAL_STORAGE_ORDER_LIST +
            "-" +
            name +
            "-" +
            devices[name].vid +
            "-" +
            devices[name].pid
        )
      );
      const keyMappingsWrapper = document.createElement("div");
      keyMappingsWrapper.style.marginTop = "10px";

      for (let i = 0; i < orderList.length; i++) {
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
        inputElement.value = orderList[i];
        keyMapping.appendChild(inputElement);

        let outputKeyLabel = document.createElement("label");
        outputKeyLabel.innerHTML = "Mapping:";
        outputKeyLabel.classList.add("output-key-label");
        keyMapping.appendChild(outputKeyLabel);

        let outputContainer = document.createElement("div");
        outputContainer.classList.add("output-container");
        for (let j = 0; j < device[orderList[i]].length; j++) {
          let outputKeyElement = document.createElement("input");
          outputKeyElement.type = "text";
          outputKeyElement.value = device[orderList[i]][j]["key"];
          outputKeyElement.disabled = true;
          outputKeyElement.classList.add("output-key");
          outputContainer.appendChild(outputKeyElement);
        }
        keyMapping.appendChild(outputContainer);
        keyMappingsWrapper.append(keyMapping);
        // mappingDiv.appendChild(keyMapping);
      }
      mappingDiv.appendChild(keyMappingsWrapper);
      devicesSpace.appendChild(mappingDiv);
    }
  }
}

function loadMappings2() {
  const supportedDevices = [];
  const devicesDetails = {};
  DEVICES_LIST.forEach((device) => {
    const filterResult = devicesMappings.filter((deviceMapping) => {
      return (
        device.driver.vendorId === deviceMapping.vid &&
        device.driver.productId === deviceMapping.pid
      );
    })[0];

    if (filterResult) {
      filterResult["deviceName"] = device.name;
      supportedDevices.push(filterResult);
    }
  });
  console.log(supportedDevices);

  for (const device of supportedDevices) {
    const mappings = {};
    const deviceEntries = [];
    devicesDetails[device.deviceName] = { vid: device.vid, pid: device.pid };

    for (const key of Object.keys(device.keyMappings)) {
      deviceEntries.push(key);
      mappings[key] = device.keyMappings[key].map((char) => ({
        key: char,
        keycode: char.charCodeAt(0),
      }));
    }
    localStorage.setItem(
      LOCAL_STORAGE_ORDER_LIST +
        "-" +
        device.deviceName +
        "-" +
        device.vid +
        "-" +
        device.pid,
      JSON.stringify(deviceEntries)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEY_MAPPING +
        "-" +
        device.deviceName +
        "-" +
        device.vid +
        "-" +
        device.pid,
      JSON.stringify(mappings)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEY_MAPPING,
      JSON.stringify(devicesDetails)
    );
    console.log(mappings);
    console.log(deviceEntries);
    console.log(device);
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup2", message);
  //indicate that something changed and recreate the mapping
  if (message.action === ACTIONS.UPDATE_KEY_MAPPING) {
    showMappings();
  } else if (message.action === ACTIONS.DEVICE_CHANGED) {
    if (message.deviceName && message.deviceDetails) {
      let storedObjectString = localStorage.getItem(
        LOCAL_STORAGE_KEY_MAPPING +
          "-" +
          message.deviceName +
          "-" +
          message.deviceDetails.vid +
          "-" +
          message.deviceDetails.pid
      );
      if (storedObjectString !== null) {
        const keyMapping = JSON.parse(storedObjectString);
        chrome.runtime.sendMessage({
          action: ACTIONS.UPDATE_KEY_MAPPING,
          keyMapping: keyMapping,
          deviceName: message.deviceName,
        });
      }
      document.getElementById(
        "device-name"
      ).textContent = `Device connected: ${message.deviceName}`;
      document.getElementById("test-mode-button").removeAttribute("disabled");
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
