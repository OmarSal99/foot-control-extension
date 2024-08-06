const ACTIONS = {
  REFRESH_PAGE: "refresh page",
  TAB: "tab pressed",
  FULL_SCREEN: "full screen",
};

const KEY_CODES_MAP = {
  Tab: "Tab",
  Enter: "Enter",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};

const getKeyCode = (key) => {
  let code = "";
  switch (key.length) {
    case 1:
      if (/^\d$/.test(str)) {
        code = `Digit${key}`;
      }
      break
    default:
  }
};

const LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY = "last connnected HID device";

// Will try to see if there's some device saved in local storage in order to
// open it and bind its inputreport event to its handler

// recieve messages from other parts of the code
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  const key = message.data.key;
  // if (message.action === ACTIONS.REFRESH_PAGE) {
  //   location.reload();
  // } else if (message.action === ACTIONS.TAB) {
  //   const currentFocusedElement = document.activeElement;
  //   const allInputFields = document.querySelectorAll('input[type="text"]');
  //   const currentIndex = Array.from(allInputFields).indexOf(
  //     currentFocusedElement
  //   );

  //   // Move focus to the next input field
  //   const nextIndex = (currentIndex + 1) % allInputFields.length;
  //   allInputFields[nextIndex].focus();
  // } else if (message.action === ACTIONS.FULL_SCREEN) {
  //   if (document.fullscreenElement) {
  //     if (document.exitFullscreen) {
  //       document.exitFullscreen();
  //     }
  //   } else {
  //     const element = document.documentElement;
  //     if (element.requestFullscreen) {
  //       element.requestFullscreen();
  //     }
  //   }
  // }
  // const event = new KeyboardEvent("keydown", {
  //   key: message.data.key, // The key value of the key represented by the event
  //   code: "Key" + message.data.key.toUpperCase(),
  //   charCode: message.data.key.charCodeAt(0),
  //   keyCode: message.data.key.charCodeAt(0),
  //   bubbles: true,
  // });
  const keyCode = +message.data.keycode;

  // Create and dispatch 'keydown' event for the key
  let event = new KeyboardEvent("keydown", {
    key: key,
    code: key,
    keyCode: keyCode,
    charCode: keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });
  document.activeElement.dispatchEvent(event);

  // Create and dispatch 'keypress' event for the key
  // event = new KeyboardEvent("keypress", {
  //   key: key,
  //   code: key,
  //   keyCode: keyCode,
  //   charCode: keyCode,
  //   which: keyCode,
  //   bubbles: true,
  //   cancelable: true,
  // });
  // document.activeElement.dispatchEvent(event);

  // Create and dispatch 'keyup' event for the key
  event = new KeyboardEvent("keyup", {
    key: key,
    code: key,
    keyCode: keyCode,
    charCode: keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });
  document.activeElement.dispatchEvent(event);

  if (key.length == 1 || key == " ") document.activeElement.value += key;
  console.log(event);
  console.log(document.activeElement);
  // document.activeElement.dispatchEvent(event);
  // document.activeElement.dispatchEvent(event2);
  // document.activeElement.value += message.data.key;
});

//this interval should try to make the service-worker awake
//for example if the pc go sleep then opened the content will wake but not the service worker
//however this interval will wake up the service worker and service worker will try to connect to the last connected device if found
setInterval(() => {
  chrome.runtime.sendMessage({
    action: "",
  });
}, 3000);
