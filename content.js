const KEY_CODES_MAP = {
  Tab: "Tab",
  Enter: "Enter",
  Insert: "Insert",
  Delete: "Delete",
  BracketLeft: "BracketLeft",
  BracketRight: "BracketRight",
  CapsLock: "CapsLock",
  ContextMenu: "ContextMenu",
  PrintScreen: "PrintScreen",
  ScrollLock: "ScrollLock",
  Pause: "Pause",
  Escape: "Escape",
  Backspace: "Backspace",
  NumLock: "NumLock",
  " ": "Space",
  ",": "Comma",
  ".": "Period",
  "/": "Slash",
  ";": "Semicolon",
  "'": "Quote",
  "[": "BracketLeft",
  "]": "BracketRight",
  "\\": "Backslash",
  "-": "Minus",
  "=": "Equal",
  "`": "Backquote",
  "{": "BracketLeft",
  "}": "BracketRight",
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
      if (isDigit(key)) {
        code = `Digit${key}`;
      } else if (isLetter(key)) {
        code = `Key${key.toUpperCase()}`;
      } else if (Object.keys(KEY_CODES_MAP).includes(key)) {
        code = KEY_CODES_MAP[key];
      } else {
        code = key.charCodeAt(0);
      }
      break;
    default:
      if (Object.keys(KEY_CODES_MAP).includes(key)) {
        code = KEY_CODES_MAP[key];
      } else {
        code = null;
      }
  }
  return code;
};

const isLetter = (str) => {
  return /^[a-zA-Z]$/.test(str);
};

const isDigit = (str) => {
  return /^\d$/.test(str);
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  const key = message.data.key;
  const keyCode = +message.data.keycode;
  switch (key) {
    case "F5":
      location.reload();
      break;
    case "Tab":
      const currentFocusedElement = document.activeElement;
      const allInputFields = document.querySelectorAll('input[type="text"]');
      const currentIndex = Array.from(allInputFields).indexOf(
        currentFocusedElement
      );

      // Move focus to the next input field
      const nextIndex = (currentIndex + 1) % allInputFields.length;
      allInputFields[nextIndex].focus();
      break;
    case "F11":
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      } else {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        }
      }
      break;
    default:
      // Create and dispatch 'keydown' event for the key
      let code = getKeyCode(key);
      if (!code) code = keyCode;
      let event = new KeyboardEvent("keydown", {
        key: key,
        code: code,
        keyCode: keyCode,
        charCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement.dispatchEvent(event);

      // Create and dispatch 'keyup' event for the key
      event = new KeyboardEvent("keyup", {
        key: key,
        code: code,
        keyCode: keyCode,
        charCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement.dispatchEvent(event);

      if (key.length == 1 || key == " ") document.activeElement.value += key;
      break;
  }
});

//this interval should try to make the service-worker awake
//for example if the pc go sleep then opened the content will wake but not the service worker
//however this interval will wake up the service worker and service worker will try to connect to the last connected device if found
setInterval(() => {
  chrome.runtime.sendMessage({
    action: "",
  });
}, 3000);
