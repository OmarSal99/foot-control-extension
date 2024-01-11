const ACTIONS = {
    KEY_EVENT : "key event",
    UPDATE_KEY_MAPPING : "update key mapping",
    REFRESH_PAGE : "refresh page",
    TAB: "tab pressed",
    REQUEST_DEVICE: "request device",
    POPUP_OPEN: "popup open",
    POPUP_CLOSE: "popup close",
    INPUT_KEY_PRESSED: "input key pressed"
}

let isPopupOpen = false;

function isSingleDigitNumber(str) {
  return /^[0-9]$/.test(str);
}

function handleKeyDown(event) {
    handleKeyInput(event.key);
}

function handleKeyInput(key){
    if (chrome.runtime?.id) {
        if (isSingleDigitNumber(key)) {
          console.log("from inside!!");
          if(isPopupOpen){
            chrome.runtime.sendMessage({
                action: ACTIONS.INPUT_KEY_PRESSED,
                key: key,
              });
          }else {
            chrome.runtime.sendMessage({
                action: ACTIONS.KEY_EVENT,
                key: key,
              });
          }
        }
      }
}
document.addEventListener("keydown", handleKeyDown);



chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ){
    console.log(message);
    if (message.action == ACTIONS.REFRESH_PAGE) {
        location.reload();
    }
    else if (message.action == ACTIONS.TAB){
        const currentFocusedElement = document.activeElement;
            const allInputFields = document.querySelectorAll('input[type="text"]');
            const currentIndex = Array.from(allInputFields).indexOf(currentFocusedElement);
      
            // Move focus to the next input field
            const nextIndex = (currentIndex + 1) % allInputFields.length;
            allInputFields[nextIndex].focus();
    }
    else if (message.action == ACTIONS.REQUEST_DEVICE){
        // request device logic and start capture
    } 
    else if (message.action == ACTIONS.POPUP_OPEN){
        isPopupOpen = true;
    }
    else if (message.action == ACTIONS.POPUP_CLOSE){
        isPopupOpen = false;
    }
  });