import { ACTIONS } from "./actions.js";
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("myButton").addEventListener("click", async () => {
    await navigator.hid
      .requestDevice({ filters: [] })
      .then(async (devices) => {
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

function createMapping(mappingObj) {
  let devicesSpace = document.getElementById("devices-space");
//   while (devicesSpace.firstChild) {
//     devicesSpace.removeChild(devicesSpace.firstChild);
//   }
  for (let name in mappingObj) {
    let mappingDiv = document.createElement("div");
    let nameElement = document.createElement("p");
    nameElement.innerHTML = name;
    mappingDiv.appendChild(nameElement);
    for (let key in mappingObj[name]) {
      let keyMapping = document.createElement("div");
      keyMapping.classList.add("key-mapping");
      let inputElement = document.createElement("input");
      inputElement.type = "text";
      inputElement.classList.add("input-key");
      inputElement.disabled = true;
      inputElement.value = key;
      keyMapping.appendChild(inputElement);
      let outputContainer = document.createElement("div");
      outputContainer.classList.add("output-container");
      for (let i=0;i<mappingObj[name][key].length; i++) {
        let outputKeyElement = document.createElement("input");
        outputKeyElement.type = "text";
        outputKeyElement.value = mappingObj[name][key][i]['key'];
        outputKeyElement.disabled = true;
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
  if (message.action == ACTIONS.SEND_ALL_MAPPING) {
    createMapping(message.mappings);
  }
});

window.addEventListener("load", async () => {
  console.log("11111111");
  chrome.runtime.sendMessage({
    action: ACTIONS.GET_ALL_MAPPING,
  });
});
