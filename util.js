const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const waitUntil = (condition, checkInterval = 200) => {
    return new Promise((resolve) => {
      let interval = setInterval(() => {
        if (!condition()) return;
        clearInterval(interval);
        resolve();
      }, checkInterval);
    });
  };

exports.sleep = sleep;
exports.waitUntil = waitUntil;