var DymoScale = function() {
  var HID = require("node-hid");
  var deviceHandle = null;
  var opening = false;

  function log(msg) {
    console.log("[dymo-scale]", msg);
  }

  function closeDevice() {
    if (deviceHandle) {
      try {
        log("Closing device");
        deviceHandle.close();
      } catch (_) {}
      deviceHandle = null;
    }
  }

  this.device = function() {
    if (deviceHandle) {
      return deviceHandle;
    }

    if (opening) {
      return null;
    }

    opening = true;

    try {
      log("Searching for DYMO devices...");
      var devices = HID.devices().filter(d => d.manufacturer === "DYMO");

      if (devices.length === 0) {
        log("No DYMO devices found");
        return null;
      }

      log("Opening device:", devices[0].path);
      deviceHandle = new HID.HID(devices[0].path);
      log("Device opened successfully");

      return deviceHandle;
    } catch (err) {
      log("Open failed:", err.message);
      closeDevice();
      return null;
    } finally {
      opening = false;
    }
  };

  this.read = function(callback) {
    var device = this.device();

    if (!device) {
      return callback(new Error("device offline"));
    }

    device.read(function(error, data) {
      if (error) {
        log("Read error:", error.message);
        closeDevice(); // 🔑 THIS IS THE IMPORTANT PART
        return callback(error);
      }

      var weight = { value: 0, unit: null };
      var raw = ((256 * data[5]) + data[4]);

      if (data[1] === 4) {
        if (data[2] === 11) {
          weight.value = raw / 10;
          weight.unit = "ounces";
        } else if (data[2] === 2) {
          weight.value = raw;
          weight.unit = "grams";
        }
      }

      callback(null, weight);
    });
  };
};

module.exports = new DymoScale();
