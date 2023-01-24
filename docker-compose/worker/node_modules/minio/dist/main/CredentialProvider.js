"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Credentials = _interopRequireDefault(require("./Credentials"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CredentialProvider {
  constructor({
    accessKey,
    secretKey,
    sessionToken
  }) {
    this.credentials = new _Credentials.default({
      accessKey,
      secretKey,
      sessionToken
    });
  }

  getCredentials() {
    return this.credentials.get();
  }

  setCredentials(credentials) {
    if (credentials instanceof _Credentials.default) {
      this.credentials = credentials;
    } else {
      throw new Error("Unable to set Credentials . it should be an instance of Credentials class");
    }
  }

  setAccessKey(accessKey) {
    this.credentials.setAccessKey(accessKey);
  }

  getAccessKey() {
    return this.credentials.getAccessKey();
  }

  setSecretKey(secretKey) {
    this.credentials.setSecretKey(secretKey);
  }

  getSecretKey() {
    return this.credentials.getSecretKey();
  }

  setSessionToken(sessionToken) {
    this.credentials.setSessionToken(sessionToken);
  }

  getSessionToken() {
    return this.credentials.getSessionToken();
  }

}

var _default = CredentialProvider;
exports.default = _default;
//# sourceMappingURL=CredentialProvider.js.map
