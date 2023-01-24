"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Credentials {
  constructor({
    accessKey,
    secretKey,
    sessionToken
  }) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.sessionToken = sessionToken;
  }

  setAccessKey(accessKey) {
    this.accessKey = accessKey;
  }

  getAccessKey() {
    return this.accessKey;
  }

  setSecretKey(secretKey) {
    this.secretKey = secretKey;
  }

  getSecretKey() {
    return this.secretKey;
  }

  setSessionToken(sessionToken) {
    this.sessionToken = sessionToken;
  }

  getSessionToken() {
    return this.sessionToken;
  }

  get() {
    return {
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      sessionToken: this.sessionToken
    };
  }

}

var _default = Credentials;
exports.default = _default;
//# sourceMappingURL=Credentials.js.map
