"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _http = _interopRequireDefault(require("http"));

var _https = _interopRequireDefault(require("https"));

var _helpers = require("./helpers");

var _signing = require("./signing");

var _CredentialProvider = _interopRequireDefault(require("./CredentialProvider"));

var _Credentials = _interopRequireDefault(require("./Credentials"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  URLSearchParams,
  URL
} = require('url');

class AssumeRoleProvider extends _CredentialProvider.default {
  constructor({
    stsEndpoint,
    accessKey,
    secretKey,
    durationSeconds = 900,
    sessionToken,
    policy,
    region = '',
    roleArn,
    roleSessionName,
    externalId,
    token,
    webIdentityToken,
    action = "AssumeRole"
  }) {
    super({});
    this.stsEndpoint = stsEndpoint;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.durationSeconds = durationSeconds;
    this.policy = policy;
    this.region = region;
    this.roleArn = roleArn;
    this.roleSessionName = roleSessionName;
    this.externalId = externalId;
    this.token = token;
    this.webIdentityToken = webIdentityToken;
    this.action = action;
    this.sessionToken = sessionToken;
    /**
         * Internal Tracking variables
         */

    this.credentials = null;
    this.expirySeconds = null;
    this.accessExpiresAt = null;
  }

  getRequestConfig() {
    const url = new URL(this.stsEndpoint);
    const hostValue = url.hostname;
    const portValue = url.port;
    const isHttp = url.protocol.includes("http:");
    const qryParams = new URLSearchParams();
    qryParams.set("Action", this.action);
    qryParams.set("Version", "2011-06-15");
    const defaultExpiry = 900;
    let expirySeconds = parseInt(this.durationSeconds);

    if (expirySeconds < defaultExpiry) {
      expirySeconds = defaultExpiry;
    }

    this.expirySeconds = expirySeconds; // for calculating refresh of credentials.

    qryParams.set("DurationSeconds", this.expirySeconds);

    if (this.policy) {
      qryParams.set("Policy", this.policy);
    }

    if (this.roleArn) {
      qryParams.set("RoleArn", this.roleArn);
    }

    if (this.roleSessionName != null) {
      qryParams.set("RoleSessionName", this.roleSessionName);
    }

    if (this.token != null) {
      qryParams.set("Token", this.token);
    }

    if (this.webIdentityToken) {
      qryParams.set("WebIdentityToken", this.webIdentityToken);
    }

    if (this.externalId) {
      qryParams.set("ExternalId", this.externalId);
    }

    const urlParams = qryParams.toString();
    const contentSha256 = (0, _helpers.toSha256)(urlParams);
    const date = new Date();
    /**
         * Nodejs's Request Configuration.
         */

    const requestOptions = {
      hostname: hostValue,
      port: portValue,
      path: "/",
      protocol: url.protocol,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "content-length": urlParams.length,
        "host": hostValue,
        "x-amz-date": (0, _helpers.makeDateLong)(date),
        'x-amz-content-sha256': contentSha256
      }
    };
    const authorization = (0, _signing.signV4ByServiceName)(requestOptions, this.accessKey, this.secretKey, this.region, date, "sts");
    requestOptions.headers.authorization = authorization;
    return {
      requestOptions,
      requestData: urlParams,
      isHttp: isHttp
    };
  }

  async performRequest() {
    const reqObj = this.getRequestConfig();
    const requestOptions = reqObj.requestOptions;
    const requestData = reqObj.requestData;
    const isHttp = reqObj.isHttp;
    const Transport = isHttp ? _http.default : _https.default;
    const promise = new Promise((resolve, reject) => {
      const requestObj = Transport.request(requestOptions, resp => {
        let resChunks = [];
        resp.on('data', rChunk => {
          resChunks.push(rChunk);
        });
        resp.on('end', () => {
          let body = Buffer.concat(resChunks).toString();
          const xmlobj = (0, _helpers.parseXml)(body);
          resolve(xmlobj);
        });
        resp.on('error', err => {
          reject(err);
        });
      });
      requestObj.on('error', e => {
        reject(e);
      });
      requestObj.write(requestData);
      requestObj.end();
    });
    return promise;
  }

  parseCredentials(respObj = {}) {
    if (respObj.ErrorResponse) {
      throw new Error("Unable to obtain credentials:", respObj);
    }

    const {
      AssumeRoleResponse: {
        AssumeRoleResult: {
          Credentials: {
            AccessKeyId: accessKey,
            SecretAccessKey: secretKey,
            SessionToken: sessionToken,
            Expiration: expiresAt
          } = {}
        } = {}
      } = {}
    } = respObj;
    this.accessExpiresAt = expiresAt;
    const newCreds = new _Credentials.default({
      accessKey,
      secretKey,
      sessionToken
    });
    this.setCredentials(newCreds);
    return this.credentials;
  }

  async refreshCredentials() {
    try {
      const assumeRoleCredentials = await this.performRequest();
      this.credentials = this.parseCredentials(assumeRoleCredentials);
    } catch (err) {
      this.credentials = null;
    }

    return this.credentials;
  }

  async getCredentials() {
    let credConfig;

    if (!this.credentials || this.credentials && this.isAboutToExpire()) {
      credConfig = await this.refreshCredentials();
    } else {
      credConfig = this.credentials;
    }

    return credConfig;
  }

  isAboutToExpire() {
    const expiresAt = new Date(this.accessExpiresAt);
    const provisionalExpiry = new Date(Date.now() + 1000 * 10); // check before 10 seconds.

    const isAboutToExpire = provisionalExpiry > expiresAt;
    return isAboutToExpire;
  }

}

var _default = AssumeRoleProvider;
exports.default = _default;
//# sourceMappingURL=AssumeRoleProvider.js.map
