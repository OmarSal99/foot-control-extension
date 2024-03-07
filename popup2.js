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
        if (devices[0] === undefined) {
          console.log("popup2 device choosing has been canceled 2lmafrood");
          return;
        }
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
          iconUrl: "./image.png",
        });
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

  for (let name of Object.keys(devices)) {
    console.log(name);
    let mappingDiv = document.createElement("div");
    mappingDiv.classList.add("mapping-div");
    let nameElement = document.createElement("h2");
    nameElement.innerHTML = name;
    mappingDiv.appendChild(nameElement);
    const pidVidHolder = document.createElement("div");
    // pidVidHolder.setAttribute("class", "key-value-holder");
    const vidHolder = document.createElement("div");
    vidHolder.classList.add("key-value-holder");
    const vid = document.createElement("label");
    vid.innerHTML = "Vendor id:";
    const vidValue = document.createElement("label");
    vidValue.type = "text";
    vidValue.classList.add("input-key");
    vidValue.disabled = true;
    // vidValue.setAttribute("value", devices[name].vid);
    vidValue.innerHTML = devices[name].vid;
    vidHolder.appendChild(vid);
    vidHolder.appendChild(vidValue);
    const pidHolder = document.createElement("div");
    pidHolder.classList.add("key-value-holder");
    const pid = document.createElement("label");
    pid.innerHTML = "Product id:";
    const pidValue = document.createElement("label");
    pidValue.type = "text";
    pidValue.classList.add("input-key");
    pidValue.disabled = true;
    // pidValue.setAttribute("value", devices[name].pid);
    pidValue.innerHTML = devices[name].pid;
    pidHolder.appendChild(pid);
    pidHolder.appendChild(pidValue);
    mappingDiv.appendChild(vidHolder);
    mappingDiv.appendChild(pidHolder);

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
