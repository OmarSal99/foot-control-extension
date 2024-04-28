import { BaseDriver } from "./base-driver.js";

export class FootPedalDriver extends BaseDriver {
  constructor() {
    super();
    this.productId = 2330;
    this.vendorId = 2321;
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
    this.hidDevice.oninputreport = (event) => {
      const { data, device, reportId } = event;
      let uint8Array = new Uint8Array(data.buffer);
      const deviceInput = uint8Array[0];
      // The following strings within the condition represent neutral entries by the device
      if (deviceInput !== 0) {
        callbackFunction(
          this.deviceName,
          this.vendorId,
          this.productId,
          this.deviceEntries[deviceInput]
        );
      }
    };
  };
}
