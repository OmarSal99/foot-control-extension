import { ACTIONS } from "./actions.js";
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("myButton").addEventListener("click", async () => {
    await navigator.hid
      .requestDevice({ filters: [] })
      .then(async (devices) => {
        chrome.runtime.sendMessage({
            action: ACTIONS.DEVICE_PERM_UPDATED,
            productId: devices[0].productId,
            vendorId: devices[0].vendorId
          });
      })
      .catch((error) => {
        console.error("Error connecting to HID device:", error);
      });
  });
});
