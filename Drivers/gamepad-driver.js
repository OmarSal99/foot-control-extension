import { BaseDriver } from "./base-driver.js";

export class GamepadDriver extends BaseDriver {
  productId = 0x0006;
  vendorId = 0x0079;
  
  constructor() {
    super();
    this.lastEntryTime = 0;
  }

  entryHandler = (event) => {
    const { data, device, reportId } = event;
    let uint8Array = new Uint8Array(data.buffer);
    const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
    // The following strings within the condition represent neutral entries by the device
    if (
      base64String !== "f39/f38PAMA=" &&
      base64String !== "f39+f38PAMA=" &&
      base64String !== "f3+Af38PAMA=" &&
      base64String !== "f399f38PAMA=" &&
      base64String !== "f3+Bf38PAMA=" &&
      base64String !== "f3+Cf38PAMA="
    ) {
      const currentTime = new Date().getTime();
      if (currentTime - TouchList.lastEntryTime > 1000) {
        console.log("Different entry");
        console.log(base64String);
        uint8Array[2] = 127;
        console.log(base64String);
        console.log(uint8Array);
        TouchList.lastEntryTime = currentTime;
        this.handleKeyInput(base64String);
      }
    }
  };
}
