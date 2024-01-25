const ACTIONS = {
  KEY_EVENT: "key event",
  UPDATE_KEY_MAPPING: "update key mapping",
  REFRESH_PAGE: "refresh page",
  TAB: "tab pressed",
  REQUEST_DEVICE: "request device",
  POPUP_IN_INPUT_FIELD: "popup in input field",
  INPUT_KEY_PRESSED: "input key pressed",
};

const LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY = "last connnected HID device";

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
  if (isSingleDigitNumber(event.key)) handleKeyInput(event.key);
});

// Will try to see if there's some device saved in local storage in order to
// open it and bind its inputreport event to its handler

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
});
