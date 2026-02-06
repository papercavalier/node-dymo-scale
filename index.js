var DymoScale = function() {
  var HID = require("node-hid");
  var deviceHandle = null;

  this.device = function() {
    if (!deviceHandle) {
      var devices = HID.devices().filter(function(x) {
        return x.manufacturer === "DYMO";
      });

      if (devices.length > 0) {
        try {
          deviceHandle = new HID.HID(devices[0].path);
        } catch (err) {
          // Path is stale / device not openable
          deviceHandle = null;
          return null;
        }
      }
    }

    return deviceHandle;
  };

  this.read = function(callback) {
    var device = this.device();

    if (!device) {
      return callback(new Error("device offline"));
    }

    device.read(function(error, data) {
      if (error) {
        // Device disappeared after being opened
        deviceHandle = null;
        return callback(error);
      }

      var weight = { value: 0, unit: null };
      var raw = ((256 * data[5]) + data[4]);

      if (data[1] === 4) {
        if (data[2] === 11) {
          weight.value = parseFloat(raw / 10.0);
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

module.exports = exports = new DymoScale();
