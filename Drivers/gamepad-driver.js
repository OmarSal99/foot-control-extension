import { BaseDriver } from "./base-driver.js";

export class GamepadDriver extends BaseDriver {
  constructor() {
    super();
    this.lastEntryTime = 0;
    // this.productId = 6;
    // this.vendorId = 121;
    this.productId = 6;
    this.vendorId = 121;
    this.deviceName = "Gamepad";
  }

  lastEntryTime;
  productId;
  vendorId;
  deviceName;

  /**
   * Binds function with every HID input then delegates that input to the
   *     function passed.
   *
   * @param {function(string,number,number,string): undefined} callbackFunction
   *     Responsible for reflecting the device's entry into being mapped as a
   *     key
   */
  setEntryHandler = (callbackFunction) => {
    this.hidDevice.addEventListener("inputreport", (event) => {
      const { data, device, reportId } = event;
      let uint8Array = new Uint8Array(data.buffer);
      const deviceInput = uint8Array[0];
      if (deviceInput === 127) return;

      console.log(uint8Array);
      // const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
      console.log(deviceInput);
      // The following strings within the condition represent neutral entries by the device
      // if (
      //   base64String !== "f39/f38PAMA=" &&
      //   base64String !== "f39+f38PAMA=" &&
      //   base64String !== "f3+Af38PAMA=" &&
      //   base64String !== "f399f38PAMA=" &&
      //   base64String !== "f3+Bf38PAMA=" &&
      //   base64String !== "f3+Cf38PAMA="
      // ) {
      //   const currentTime = new Date().getTime();
      //   if (currentTime - this.lastEntryTime > 1000) {
      //     console.log("Different entry");
      //     this.lastEntryTime = currentTime;
      //     callbackFunction(this.deviceName, this.vendorId, this.productId, "");
      //   }
      // }
    });
  };
}
