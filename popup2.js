const LOCAL_STORAGE_KEY_MAPPING = "foot pedal key mapping";
const LOCAL_STORAGE_ORDER_LIST = "foot pedal order list";

import { ACTIONS } from "./actions.js";
document.addEventListener("DOMContentLoaded", function () {
  //requst a device from webHID when button is pressed
  document.getElementById("myButton").addEventListener("click", async () => {
    await navigator.hid
      .requestDevice({ filters: [] })
      .then(async (devices) => {
        //after selecting a device send msg to inform background worker of that
        chrome.runtime.sendMessage({
          action: ACTIONS.DEVICE_PERM_UPDATED,
          productId: devices[0].productId,
          vendorId: devices[0].vendorId,
        });
      })
      .catch((error) => {
        console.error("Error connecting to HID device:", error);
      });
  });
});

//this function load all mapping for all device from local storage and show them
//the local storage is teh same as popup so it just read from it and rely on popup to make any updates on it
function createMapping() {
  let devices = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MAPPING));
  console.log("devices are", devices);
  let devicesSpace = document.getElementById("devices-space");
  while (devicesSpace.firstChild) {
    devicesSpace.removeChild(devicesSpace.firstChild);
  }

  for (let name in devices) {
    console.log(name);
    let mappingDiv = document.createElement("div");
    mappingDiv.classList.add("mapping-div");
    let nameElement = document.createElement("h2");
    nameElement.innerHTML = name;
    mappingDiv.appendChild(nameElement);
    let device = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_MAPPING + "-" + name)
    );
    let orderList = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_ORDER_LIST + "-" + name)
    );
    for (let i = 0; i < orderList.length; i++) {
      let keyMapping = document.createElement("div");
      keyMapping.classList.add("key-mapping");

      let inputKeyLabel = document.createElement("label");
      inputKeyLabel.innerHTML = "input:";
      inputKeyLabel.classList.add("input-key-label");
      keyMapping.appendChild(inputKeyLabel);

      let inputElement = document.createElement("input");
      inputElement.type = "text";
      inputElement.classList.add("input-key");
      inputElement.disabled = true;
      inputElement.value = orderList[i];
      keyMapping.appendChild(inputElement);

      let outputKeyLabel = document.createElement("label");
      outputKeyLabel.innerHTML = "output:";
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
      mappingDiv.appendChild(keyMapping);
    }
    devicesSpace.appendChild(mappingDiv);
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup2", message);
  //indicate that something changed and recreate the mapping
  if (message.action === ACTIONS.UPDATE_KEY_MAPPING) {
    createMapping();
  }
});

window.addEventListener("load", async () => {
  createMapping();
});
