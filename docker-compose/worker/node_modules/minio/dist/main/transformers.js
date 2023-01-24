"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bucketEncryptionTransformer = bucketEncryptionTransformer;
exports.bucketVersioningTransformer = bucketVersioningTransformer;
exports.getBucketNotificationTransformer = getBucketNotificationTransformer;
exports.getBucketRegionTransformer = getBucketRegionTransformer;
exports.getCompleteMultipartTransformer = getCompleteMultipartTransformer;
exports.getConcater = getConcater;
exports.getCopyObjectTransformer = getCopyObjectTransformer;
exports.getErrorTransformer = getErrorTransformer;
exports.getHashSummer = getHashSummer;
exports.getInitiateMultipartTransformer = getInitiateMultipartTransformer;
exports.getListBucketTransformer = getListBucketTransformer;
exports.getListMultipartTransformer = getListMultipartTransformer;
exports.getListObjectsTransformer = getListObjectsTransformer;
exports.getListObjectsV2Transformer = getListObjectsV2Transformer;
exports.getListObjectsV2WithMetadataTransformer = getListObjectsV2WithMetadataTransformer;
exports.getListPartsTransformer = getListPartsTransformer;
exports.getNotificationTransformer = getNotificationTransformer;
exports.getTagsTransformer = getTagsTransformer;
exports.lifecycleTransformer = lifecycleTransformer;
exports.objectLegalHoldTransformer = objectLegalHoldTransformer;
exports.objectLockTransformer = objectLockTransformer;
exports.objectRetentionTransformer = objectRetentionTransformer;
exports.replicationConfigTransformer = replicationConfigTransformer;
exports.selectObjectContentTransformer = selectObjectContentTransformer;
exports.uploadPartTransformer = uploadPartTransformer;

var xmlParsers = _interopRequireWildcard(require("./xml-parsers.js"));

var _ = _interopRequireWildcard(require("lodash"));

var _through = _interopRequireDefault(require("through2"));

var _crypto = _interopRequireDefault(require("crypto"));

var _jsonStream = _interopRequireDefault(require("json-stream"));

var _helpers = require("./helpers.js");

var errors = _interopRequireWildcard(require("./errors.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2015, 2016 MinIO, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// getConcater returns a stream that concatenates the input and emits
// the concatenated output when 'end' has reached. If an optional
// parser function is passed upon reaching the 'end' of the stream,
// `parser(concatenated_data)` will be emitted.
function getConcater(parser, emitError) {
  var objectMode = false;
  var bufs = [];

  if (parser && !(0, _helpers.isFunction)(parser)) {
    throw new TypeError('parser should be of type "function"');
  }

  if (parser) {
    objectMode = true;
  }

  return (0, _through.default)({
    objectMode
  }, function (chunk, enc, cb) {
    bufs.push(chunk);
    cb();
  }, function (cb) {
    if (emitError) {
      cb(parser(Buffer.concat(bufs).toString())); // cb(e) would mean we have to emit 'end' by explicitly calling this.push(null)

      this.push(null);
      return;
    }

    if (bufs.length) {
      if (parser) {
        this.push(parser(Buffer.concat(bufs).toString()));
      } else {
        this.push(Buffer.concat(bufs));
      }
    }

    cb();
  });
} // Generates an Error object depending on http statusCode and XML body


function getErrorTransformer(response) {
  var statusCode = response.statusCode;
  var code, message;

  if (statusCode === 301) {
    code = 'MovedPermanently';
    message = 'Moved Permanently';
  } else if (statusCode === 307) {
    code = 'TemporaryRedirect';
    message = 'Are you using the correct endpoint URL?';
  } else if (statusCode === 403) {
    code = 'AccessDenied';
    message = 'Valid and authorized credentials required';
  } else if (statusCode === 404) {
    code = 'NotFound';
    message = 'Not Found';
  } else if (statusCode === 405) {
    code = 'MethodNotAllowed';
    message = 'Method Not Allowed';
  } else if (statusCode === 501) {
    code = 'MethodNotAllowed';
    message = 'Method Not Allowed';
  } else {
    code = 'UnknownError';
    message = `${statusCode}`;
  }

  var headerInfo = {}; // A value created by S3 compatible server that uniquely identifies
  // the request.

  headerInfo.amzRequestid = response.headersSent ? response.getHeader('x-amz-request-id') : null; // A special token that helps troubleshoot API replies and issues.

  headerInfo.amzId2 = response.headersSent ? response.getHeader('x-amz-id-2') : null; // Region where the bucket is located. This header is returned only
  // in HEAD bucket and ListObjects response.

  headerInfo.amzBucketRegion = response.headersSent ? response.getHeader('x-amz-bucket-region') : null;
  return getConcater(xmlString => {
    let getError = () => {
      // Message should be instantiated for each S3Errors.
      var e = new errors.S3Error(message); // S3 Error code.

      e.code = code;

      _.each(headerInfo, (value, key) => {
        e[key] = value;
      });

      return e;
    };

    if (!xmlString) {
      return getError();
    }

    let e;

    try {
      e = xmlParsers.parseError(xmlString, headerInfo);
    } catch (ex) {
      return getError();
    }

    return e;
  }, true);
} // A through stream that calculates md5sum and sha256sum


function getHashSummer(enableSHA256) {
  var md5 = _crypto.default.createHash('md5');

  var sha256 = _crypto.default.createHash('sha256');

  return _through.default.obj(function (chunk, enc, cb) {
    if (enableSHA256) {
      sha256.update(chunk);
    } else {
      md5.update(chunk);
    }

    cb();
  }, function (cb) {
    var md5sum = '';
    var sha256sum = '';

    if (enableSHA256) {
      sha256sum = sha256.digest('hex');
    } else {
      md5sum = md5.digest('base64');
    }

    var hashData = {
      md5sum,
      sha256sum
    };
    this.push(hashData);
    this.push(null);
    cb();
  });
} // Following functions return a stream object that parses XML
// and emits suitable Javascript objects.
// Parses CopyObject response.


function getCopyObjectTransformer() {
  return getConcater(xmlParsers.parseCopyObject);
} // Parses listBuckets response.


function getListBucketTransformer() {
  return getConcater(xmlParsers.parseListBucket);
} // Parses listMultipartUploads response.


function getListMultipartTransformer() {
  return getConcater(xmlParsers.parseListMultipart);
} // Parses listParts response.


function getListPartsTransformer() {
  return getConcater(xmlParsers.parseListParts);
} // Parses initMultipartUpload response.


function getInitiateMultipartTransformer() {
  return getConcater(xmlParsers.parseInitiateMultipart);
} // Parses listObjects response.


function getListObjectsTransformer() {
  return getConcater(xmlParsers.parseListObjects);
} // Parses listObjects response.


function getListObjectsV2Transformer() {
  return getConcater(xmlParsers.parseListObjectsV2);
} // Parses listObjects with metadata response.


function getListObjectsV2WithMetadataTransformer() {
  return getConcater(xmlParsers.parseListObjectsV2WithMetadata);
} // Parses completeMultipartUpload response.


function getCompleteMultipartTransformer() {
  return getConcater(xmlParsers.parseCompleteMultipart);
} // Parses getBucketLocation response.


function getBucketRegionTransformer() {
  return getConcater(xmlParsers.parseBucketRegion);
} // Parses GET/SET BucketNotification response


function getBucketNotificationTransformer() {
  return getConcater(xmlParsers.parseBucketNotification);
} // Parses a notification.


function getNotificationTransformer() {
  // This will parse and return each object.
  return new _jsonStream.default();
}

function bucketVersioningTransformer() {
  return getConcater(xmlParsers.parseBucketVersioningConfig);
}

function getTagsTransformer() {
  return getConcater(xmlParsers.parseTagging);
}

function lifecycleTransformer() {
  return getConcater(xmlParsers.parseLifecycleConfig);
}

function objectLockTransformer() {
  return getConcater(xmlParsers.parseObjectLockConfig);
}

function objectRetentionTransformer() {
  return getConcater(xmlParsers.parseObjectRetentionConfig);
}

function bucketEncryptionTransformer() {
  return getConcater(xmlParsers.parseBucketEncryptionConfig);
}

function replicationConfigTransformer() {
  return getConcater(xmlParsers.parseReplicationConfig);
}

function objectLegalHoldTransformer() {
  return getConcater(xmlParsers.parseObjectLegalHoldConfig);
}

function uploadPartTransformer() {
  return getConcater(xmlParsers.uploadPartParser);
}

function selectObjectContentTransformer() {
  return getConcater();
}
//# sourceMappingURL=transformers.js.map
