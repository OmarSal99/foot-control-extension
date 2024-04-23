import { BaseDriver } from "./base-driver.js";

export class FootPedalDriver extends BaseDriver {
  constructor() {
    super();
    this.lastEntryTime = 0;
    // this.productId = 21313;
    // this.vendorId = 1008;
    this.productId = 2330;
    this.vendorId = 2321;
    // this.productId = 6;
    // this.vendorId = 121;
    this.deviceName = "Foot pedal";
    this.deviceEntries = [
      "none",
      "right",
      "middle",
      "right + middle",
      "left",
      "left + right",
      "left + middle",
      "left + right + middle",
      "top",
      "right + top",
      "top + middle",
      "right + top + middle",
      "left + top",
      "left + right + top",
      "left + top + middle",
      "left + right + top + middle",
    ];
  }

  lastEntryTime;
  productId;
  vendorId;
  deviceName;
  deviceEntries;

  /**
   * Binds function with every HID input then delegates that input to the
   *     function passed.
   *
   * @param {function(string,number,number,string): undefined} callbackFunction
   * Responsible for reflecting the device's entry into being mapped
   *     as a key
   */
  setEntryHandler = (callbackFunction) => {
    this.hidDevice.addEventListener("inputreport", (event) => {
      const { data, device, reportId } = event;
      let uint8Array = new Uint8Array(data.buffer);
      const deviceInput = uint8Array[0];
      // The following strings within the condition represent neutral entries by the device
      if (deviceInput !== 0) {
        // const currentTime = new Date().getTime();
        // if (currentTime - this.lastEntryTime > 1000) {
        // console.log("Different entry");
        // console.log(base64String);
        // uint8Array[2] = 127;
        // console.log(base64String);
        // console.log(uint8Array);
        // this.lastEntryTime = currentTime;
        callbackFunction(
          this.deviceName,
          this.vendorId,
          this.productId,
          this.deviceEntries[deviceInput]
        );
        // }
      }
    });
  };
}
