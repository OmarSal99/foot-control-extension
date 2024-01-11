const ACTIONS = {
    KEY_EVENT : "key event",
    UPDATE_KEY_MAPPING : "update key mapping",
    REFRESH_PAGE : "refresh page",
    TAB: "tab pressed"
}

function isSingleDigitNumber(str) {
  return /^[0-9]$/.test(str);
}

function handleKeyDown(event) {
  if (chrome.runtime?.id) {
    if (isSingleDigitNumber(event.key)) {
      console.log("from inside!!");
      chrome.runtime.sendMessage({
        action: ACTIONS.KEY_EVENT,
        key: event.key,
      });
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
  });