// enum values!
const ACTIONS = {
  KEY_EVENT: "key event",
  UPDATE_KEY_MAPPING: "update key mapping",
  REFRESH_PAGE: "refresh page",
  TAB: "tab pressed",
  REQUEST_DEVICE: "request device",
  POPUP_IN_INPUT_FIELD: "popup in input field",
  INPUT_KEY_PRESSED: "input key pressed",
};

// if it is true the input from the input keys will be sent to the popup otherwise it will be sent to service-worker
let forwardInputToPopup = false;
// there is no way to know if the popup is closed, the timer here will consider it closed in the last msg from it was 1000ms ago
let popupTimer;

//check if the char is a number, used to test demo app against number keys in keyboard
// TODO: remove it in production
function isSingleDigitNumber(str) {
  return /^[0-9]$/.test(str);
}

// inform other parts that a key is pressed,  if isPPopupOpen is true the message should be sent to it
function handleKeyInput(key) {
  if (chrome.runtime?.id) {
    console.log("from inside!!");
    if (forwardInputToPopup) {
      chrome.runtime.sendMessage({
        action: ACTIONS.INPUT_KEY_PRESSED,
        key: key,
      });
    } else {
      chrome.runtime.sendMessage({
        action: ACTIONS.KEY_EVENT,
        key: key,
      });
    }
  }
}
// adding keylisteners to run when a key is pressed
document.addEventListener("keydown", (event) => {
  handleKeyInput(event.key);
});

function startPopupTimer() {
  // Clear the existing timer (if any)
  clearTimeout(popupTimer);

  // Set a new timer for 3 seconds
  popupTimer = setTimeout(function () {
    // Your function to be called after 3 seconds of inactivity
    forwardInputToPopup = false;
    console.log("popupclosed!");
  }, 1000);
}

// recieve messages from other parts of the code
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  if (message.action == ACTIONS.REFRESH_PAGE) {
    location.reload();
  } else if (message.action == ACTIONS.TAB) {
    const currentFocusedElement = document.activeElement;
    const allInputFields = document.querySelectorAll('input[type="text"]');
    const currentIndex = Array.from(allInputFields).indexOf(
      currentFocusedElement
    );

    // Move focus to the next input field
    const nextIndex = (currentIndex + 1) % allInputFields.length;
    allInputFields[nextIndex].focus();
  } // request button in the pop up is pressed
  else if (message.action == ACTIONS.REQUEST_DEVICE) {
    navigator.hid
      .requestDevice({ filters: [] })
      .then((device) => {
        // Work with the HID device here
        console.log("Connected to HID device:", device);
      })
      .catch((error) => {
        console.error("Error connecting to HID device:", error);
      });



    // request device logic and start capture
    handleKeyInput();
  } else if (message.action == ACTIONS.POPUP_IN_INPUT_FIELD) {
    forwardInputToPopup = true;
    startPopupTimer();
  }
});
