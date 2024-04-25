const ACTIONS = {
  REFRESH_PAGE: "refresh page",
  TAB: "tab pressed",
  FULL_SCREEN: "full screen",
};

const LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY = "last connnected HID device";

// Will try to see if there's some device saved in local storage in order to
// open it and bind its inputreport event to its handler

// recieve messages from other parts of the code
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  if (message.action === ACTIONS.REFRESH_PAGE) {
    location.reload();
  } else if (message.action === ACTIONS.TAB) {
    const currentFocusedElement = document.activeElement;
    const allInputFields = document.querySelectorAll('input[type="text"]');
    const currentIndex = Array.from(allInputFields).indexOf(
      currentFocusedElement
    );

    // Move focus to the next input field
    const nextIndex = (currentIndex + 1) % allInputFields.length;
    allInputFields[nextIndex].focus();
  } else if (message.action === ACTIONS.FULL_SCREEN) {
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
