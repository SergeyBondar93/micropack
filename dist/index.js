((entryPath) => {
  const modules = {
    srcindexjs: () => {
      const exports = {};
      ("use strict");

      var _srcfuncjs = require("srcfuncjs");
      var p = document.createElement("p");
      p.innerText = (0, _srcfuncjs.sayHi)();
      document.getElementById("app").append(p);
      return exports;
    },
    srcfuncjs: () => {
      const exports = {};
      ("use strict");

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports.sayHi = void 0;
      var _srcmessageindexjs = require("srcmessageindexjs");
      var sayHi = function sayHi() {
        return _srcmessageindexjs.message;
      };
      exports.sayHi = sayHi;
      return exports;
    },
    srcmessageindexjs: () => {
      const exports = {};
      ("use strict");

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports.message = void 0;
      var _srcmessagehellojs = require("srcmessagehellojs");
      var _srcmessageworldjs = require("srcmessageworldjs");
      var message = ""
        .concat(_srcmessagehellojs.hello)
        .concat(_srcmessageworldjs.world);
      exports.message = message;
      return exports;
    },
    srcmessagehellojs: () => {
      const exports = {};
      ("use strict");

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports.hello = void 0;
      var hello = "Hello ";
      exports.hello = hello;
      return exports;
    },
    srcmessageworldjs: () => {
      const exports = {};
      ("use strict");

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports.world = void 0;
      var world = "World!";
      exports.world = world;
      return exports;
    },
  };

  const cached_modules = {};

  const require = (path) => {
    const cached = cached_modules[path];
    if (cached) {
      return cached;
    } else {
      const moduleResult = modules[path]();
      cached_modules[path] = moduleResult;

      return moduleResult;
    }
  };

  require(entryPath);
})("srcindexjs");
