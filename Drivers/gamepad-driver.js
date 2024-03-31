import { BaseDriver } from "./base-driver.js";

export class GamepadDriver extends BaseDriver {
  productId = 21313;
  vendorId = 1008;
  deviceName = "Gamepad";
  // productId = 6;
  // vendorId = 121;

  constructor() {
    super();
    this.lastEntryTime = 0;
  }

  setEntryHandler = (callbackFunction) => {
    this.hidDevice.addEventListener("inputreport", (event) => {
      console.log("From the entry handler of the gampad driver");
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
        if (currentTime - this.lastEntryTime > 1000) {
          console.log("Different entry");
          console.log(base64String);
          uint8Array[2] = 127;
          console.log(base64String);
          console.log(uint8Array);
          this.lastEntryTime = currentTime;
          callbackFunction(
            this.deviceName,
            this.vendorId,
            this.productId,
            base64String
          );
        }
      }
    });
  };
}
