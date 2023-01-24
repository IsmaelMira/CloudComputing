"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseBucketEncryptionConfig = parseBucketEncryptionConfig;
exports.parseBucketNotification = parseBucketNotification;
exports.parseBucketRegion = parseBucketRegion;
exports.parseBucketVersioningConfig = parseBucketVersioningConfig;
exports.parseCompleteMultipart = parseCompleteMultipart;
exports.parseCopyObject = parseCopyObject;
exports.parseError = parseError;
exports.parseInitiateMultipart = parseInitiateMultipart;
exports.parseLifecycleConfig = parseLifecycleConfig;
exports.parseListBucket = parseListBucket;
exports.parseListMultipart = parseListMultipart;
exports.parseListObjects = parseListObjects;
exports.parseListObjectsV2 = parseListObjectsV2;
exports.parseListObjectsV2WithMetadata = parseListObjectsV2WithMetadata;
exports.parseListParts = parseListParts;
exports.parseObjectLegalHoldConfig = parseObjectLegalHoldConfig;
exports.parseObjectLockConfig = parseObjectLockConfig;
exports.parseObjectRetentionConfig = parseObjectRetentionConfig;
exports.parseReplicationConfig = parseReplicationConfig;
exports.parseSelectObjectContentResponse = parseSelectObjectContentResponse;
exports.parseTagging = parseTagging;
exports.uploadPartParser = uploadPartParser;

var _fastXmlParser = _interopRequireDefault(require("fast-xml-parser"));

var _lodash = _interopRequireDefault(require("lodash"));

var errors = _interopRequireWildcard(require("./errors.js"));

var _helpers = require("./helpers");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2015 MinIO, Inc.
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
var crc32 = require("buffer-crc32"); // Parse XML and return information as Javascript types
// parse error XML response


function parseError(xml, headerInfo) {
  var xmlErr = {};

  var xmlObj = _fastXmlParser.default.parse(xml);

  if (xmlObj.Error) {
    xmlErr = xmlObj.Error;
  }

  var e = new errors.S3Error();

  _lodash.default.each(xmlErr, (value, key) => {
    e[key.toLowerCase()] = value;
  });

  _lodash.default.each(headerInfo, (value, key) => {
    e[key] = value;
  });

  return e;
} // parse XML response for copy object


function parseCopyObject(xml) {
  var result = {
    etag: "",
    lastModified: ""
  };
  var xmlobj = (0, _helpers.parseXml)(xml);

  if (!xmlobj.CopyObjectResult) {
    throw new errors.InvalidXMLError('Missing tag: "CopyObjectResult"');
  }

  xmlobj = xmlobj.CopyObjectResult;
  if (xmlobj.ETag) result.etag = xmlobj.ETag.replace(/^"/g, '').replace(/"$/g, '').replace(/^&quot;/g, '').replace(/&quot;$/g, '').replace(/^&#34;/g, '').replace(/&#34;$/g, '');
  if (xmlobj.LastModified) result.lastModified = new Date(xmlobj.LastModified);
  return result;
} // parse XML response for listing in-progress multipart uploads


function parseListMultipart(xml) {
  var result = {
    uploads: [],
    prefixes: [],
    isTruncated: false
  };
  var xmlobj = (0, _helpers.parseXml)(xml);

  if (!xmlobj.ListMultipartUploadsResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListMultipartUploadsResult"');
  }

  xmlobj = xmlobj.ListMultipartUploadsResult;
  if (xmlobj.IsTruncated) result.isTruncated = xmlobj.IsTruncated;
  if (xmlobj.NextKeyMarker) result.nextKeyMarker = xmlobj.NextKeyMarker;
  if (xmlobj.NextUploadIdMarker) result.nextUploadIdMarker = xmlobj.nextUploadIdMarker;

  if (xmlobj.CommonPrefixes) {
    (0, _helpers.toArray)(xmlobj.CommonPrefixes).forEach(prefix => {
      result.prefixes.push({
        prefix: (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(prefix.Prefix)[0])
      });
    });
  }

  if (xmlobj.Upload) {
    (0, _helpers.toArray)(xmlobj.Upload).forEach(upload => {
      var key = upload.Key;
      var uploadId = upload.UploadId;
      var initiator = {
        id: upload.Initiator.ID,
        displayName: upload.Initiator.DisplayName
      };
      var owner = {
        id: upload.Owner.ID,
        displayName: upload.Owner.DisplayName
      };
      var storageClass = upload.StorageClass;
      var initiated = new Date(upload.Initiated);
      result.uploads.push({
        key,
        uploadId,
        initiator,
        owner,
        storageClass,
        initiated
      });
    });
  }

  return result;
} // parse XML response to list all the owned buckets


function parseListBucket(xml) {
  var result = [];
  var xmlobj = (0, _helpers.parseXml)(xml);

  if (!xmlobj.ListAllMyBucketsResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListAllMyBucketsResult"');
  }

  xmlobj = xmlobj.ListAllMyBucketsResult;

  if (xmlobj.Buckets) {
    if (xmlobj.Buckets.Bucket) {
      (0, _helpers.toArray)(xmlobj.Buckets.Bucket).forEach(bucket => {
        var name = bucket.Name;
        var creationDate = new Date(bucket.CreationDate);
        result.push({
          name,
          creationDate
        });
      });
    }
  }

  return result;
} // parse XML response for bucket notification


function parseBucketNotification(xml) {
  var result = {
    TopicConfiguration: [],
    QueueConfiguration: [],
    CloudFunctionConfiguration: []
  }; // Parse the events list

  var genEvents = function (events) {
    var result = [];

    if (events) {
      (0, _helpers.toArray)(events).forEach(s3event => {
        result.push(s3event);
      });
    }

    return result;
  }; // Parse all filter rules


  var genFilterRules = function (filters) {
    var result = [];

    if (filters) {
      filters = (0, _helpers.toArray)(filters);

      if (filters[0].S3Key) {
        filters[0].S3Key = (0, _helpers.toArray)(filters[0].S3Key);

        if (filters[0].S3Key[0].FilterRule) {
          (0, _helpers.toArray)(filters[0].S3Key[0].FilterRule).forEach(rule => {
            var Name = (0, _helpers.toArray)(rule.Name)[0];
            var Value = (0, _helpers.toArray)(rule.Value)[0];
            result.push({
              Name,
              Value
            });
          });
        }
      }
    }

    return result;
  };

  var xmlobj = (0, _helpers.parseXml)(xml);
  xmlobj = xmlobj.NotificationConfiguration; // Parse all topic configurations in the xml

  if (xmlobj.TopicConfiguration) {
    (0, _helpers.toArray)(xmlobj.TopicConfiguration).forEach(config => {
      var Id = (0, _helpers.toArray)(config.Id)[0];
      var Topic = (0, _helpers.toArray)(config.Topic)[0];
      var Event = genEvents(config.Event);
      var Filter = genFilterRules(config.Filter);
      result.TopicConfiguration.push({
        Id,
        Topic,
        Event,
        Filter
      });
    });
  } // Parse all topic configurations in the xml


  if (xmlobj.QueueConfiguration) {
    (0, _helpers.toArray)(xmlobj.QueueConfiguration).forEach(config => {
      var Id = (0, _helpers.toArray)(config.Id)[0];
      var Queue = (0, _helpers.toArray)(config.Queue)[0];
      var Event = genEvents(config.Event);
      var Filter = genFilterRules(config.Filter);
      result.QueueConfiguration.push({
        Id,
        Queue,
        Event,
        Filter
      });
    });
  } // Parse all QueueConfiguration arrays


  if (xmlobj.CloudFunctionConfiguration) {
    (0, _helpers.toArray)(xmlobj.CloudFunctionConfiguration).forEach(config => {
      var Id = (0, _helpers.toArray)(config.Id)[0];
      var CloudFunction = (0, _helpers.toArray)(config.CloudFunction)[0];
      var Event = genEvents(config.Event);
      var Filter = genFilterRules(config.Filter);
      result.CloudFunctionConfiguration.push({
        Id,
        CloudFunction,
        Event,
        Filter
      });
    });
  }

  return result;
} // parse XML response for bucket region


function parseBucketRegion(xml) {
  // return region information
  return (0, _helpers.parseXml)(xml).LocationConstraint;
} // parse XML response for list parts of an in progress multipart upload


function parseListParts(xml) {
  var xmlobj = (0, _helpers.parseXml)(xml);
  var result = {
    isTruncated: false,
    parts: [],
    marker: undefined
  };

  if (!xmlobj.ListPartsResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListPartsResult"');
  }

  xmlobj = xmlobj.ListPartsResult;
  if (xmlobj.IsTruncated) result.isTruncated = xmlobj.IsTruncated;
  if (xmlobj.NextPartNumberMarker) result.marker = +(0, _helpers.toArray)(xmlobj.NextPartNumberMarker)[0];

  if (xmlobj.Part) {
    (0, _helpers.toArray)(xmlobj.Part).forEach(p => {
      var part = +(0, _helpers.toArray)(p.PartNumber)[0];
      var lastModified = new Date(p.LastModified);
      var etag = p.ETag.replace(/^"/g, '').replace(/"$/g, '').replace(/^&quot;/g, '').replace(/&quot;$/g, '').replace(/^&#34;/g, '').replace(/&#34;$/g, '');
      result.parts.push({
        part,
        lastModified,
        etag
      });
    });
  }

  return result;
} // parse XML response when a new multipart upload is initiated


function parseInitiateMultipart(xml) {
  var xmlobj = (0, _helpers.parseXml)(xml);

  if (!xmlobj.InitiateMultipartUploadResult) {
    throw new errors.InvalidXMLError('Missing tag: "InitiateMultipartUploadResult"');
  }

  xmlobj = xmlobj.InitiateMultipartUploadResult;
  if (xmlobj.UploadId) return xmlobj.UploadId;
  throw new errors.InvalidXMLError('Missing tag: "UploadId"');
} // parse XML response when a multipart upload is completed


function parseCompleteMultipart(xml) {
  var xmlobj = (0, _helpers.parseXml)(xml).CompleteMultipartUploadResult;

  if (xmlobj.Location) {
    var location = (0, _helpers.toArray)(xmlobj.Location)[0];
    var bucket = (0, _helpers.toArray)(xmlobj.Bucket)[0];
    var key = xmlobj.Key;
    var etag = xmlobj.ETag.replace(/^"/g, '').replace(/"$/g, '').replace(/^&quot;/g, '').replace(/&quot;$/g, '').replace(/^&#34;/g, '').replace(/&#34;$/g, '');
    return {
      location,
      bucket,
      key,
      etag
    };
  } // Complete Multipart can return XML Error after a 200 OK response


  if (xmlobj.Code && xmlobj.Message) {
    var errCode = (0, _helpers.toArray)(xmlobj.Code)[0];
    var errMessage = (0, _helpers.toArray)(xmlobj.Message)[0];
    return {
      errCode,
      errMessage
    };
  }
}

const formatObjInfo = (content, opts = {}) => {
  let {
    Key,
    LastModified,
    ETag,
    Size,
    VersionId,
    IsLatest
  } = content;

  if (!(0, _helpers.isObject)(opts)) {
    opts = {};
  }

  const name = (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(Key)[0]);
  const lastModified = new Date((0, _helpers.toArray)(LastModified)[0]);
  const etag = (0, _helpers.sanitizeETag)((0, _helpers.toArray)(ETag)[0]);
  return {
    name,
    lastModified,
    etag,
    size: Size,
    versionId: VersionId,
    isLatest: IsLatest,
    isDeleteMarker: opts.IsDeleteMarker ? opts.IsDeleteMarker : false
  };
}; // parse XML response for list objects in a bucket


function parseListObjects(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  let isTruncated = false;
  let nextMarker, nextVersionKeyMarker;
  const xmlobj = (0, _helpers.parseXml)(xml);

  const parseCommonPrefixesEntity = responseEntity => {
    if (responseEntity) {
      (0, _helpers.toArray)(responseEntity).forEach(commonPrefix => {
        result.objects.push({
          prefix: (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(commonPrefix.Prefix)[0]),
          size: 0
        });
      });
    }
  };

  const listBucketResult = xmlobj.ListBucketResult;
  const listVersionsResult = xmlobj.ListVersionsResult;

  if (listBucketResult) {
    if (listBucketResult.IsTruncated) {
      isTruncated = listBucketResult.IsTruncated;
    }

    if (listBucketResult.Contents) {
      (0, _helpers.toArray)(listBucketResult.Contents).forEach(content => {
        const name = (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(content.Key)[0]);
        const lastModified = new Date((0, _helpers.toArray)(content.LastModified)[0]);
        const etag = (0, _helpers.sanitizeETag)((0, _helpers.toArray)(content.ETag)[0]);
        const size = content.Size;
        result.objects.push({
          name,
          lastModified,
          etag,
          size
        });
      });
    }

    if (listBucketResult.NextMarker) {
      nextMarker = listBucketResult.NextMarker;
    }

    parseCommonPrefixesEntity(listBucketResult.CommonPrefixes);
  }

  if (listVersionsResult) {
    if (listVersionsResult.IsTruncated) {
      isTruncated = listVersionsResult.IsTruncated;
    }

    if (listVersionsResult.Version) {
      (0, _helpers.toArray)(listVersionsResult.Version).forEach(content => {
        result.objects.push(formatObjInfo(content));
      });
    }

    if (listVersionsResult.DeleteMarker) {
      (0, _helpers.toArray)(listVersionsResult.DeleteMarker).forEach(content => {
        result.objects.push(formatObjInfo(content, {
          IsDeleteMarker: true
        }));
      });
    }

    if (listVersionsResult.NextKeyMarker) {
      nextVersionKeyMarker = listVersionsResult.NextKeyMarker;
    }

    if (listVersionsResult.NextVersionIdMarker) {
      result.versionIdMarker = listVersionsResult.NextVersionIdMarker;
    }

    parseCommonPrefixesEntity(listVersionsResult.CommonPrefixes);
  }

  result.isTruncated = isTruncated;

  if (isTruncated) {
    result.nextMarker = nextVersionKeyMarker || nextMarker;
  }

  return result;
} // parse XML response for list objects v2 in a bucket


function parseListObjectsV2(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  var xmlobj = (0, _helpers.parseXml)(xml);

  if (!xmlobj.ListBucketResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListBucketResult"');
  }

  xmlobj = xmlobj.ListBucketResult;
  if (xmlobj.IsTruncated) result.isTruncated = xmlobj.IsTruncated;
  if (xmlobj.NextContinuationToken) result.nextContinuationToken = xmlobj.NextContinuationToken;

  if (xmlobj.Contents) {
    (0, _helpers.toArray)(xmlobj.Contents).forEach(content => {
      var name = (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(content.Key)[0]);
      var lastModified = new Date(content.LastModified);
      var etag = (0, _helpers.sanitizeETag)(content.ETag);
      var size = content.Size;
      result.objects.push({
        name,
        lastModified,
        etag,
        size
      });
    });
  }

  if (xmlobj.CommonPrefixes) {
    (0, _helpers.toArray)(xmlobj.CommonPrefixes).forEach(commonPrefix => {
      result.objects.push({
        prefix: (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(commonPrefix.Prefix)[0]),
        size: 0
      });
    });
  }

  return result;
} // parse XML response for list objects v2 with metadata in a bucket


function parseListObjectsV2WithMetadata(xml) {
  var result = {
    objects: [],
    isTruncated: false
  };
  var xmlobj = (0, _helpers.parseXml)(xml);

  if (!xmlobj.ListBucketResult) {
    throw new errors.InvalidXMLError('Missing tag: "ListBucketResult"');
  }

  xmlobj = xmlobj.ListBucketResult;
  if (xmlobj.IsTruncated) result.isTruncated = xmlobj.IsTruncated;
  if (xmlobj.NextContinuationToken) result.nextContinuationToken = xmlobj.NextContinuationToken;

  if (xmlobj.Contents) {
    (0, _helpers.toArray)(xmlobj.Contents).forEach(content => {
      var name = (0, _helpers.sanitizeObjectKey)(content.Key);
      var lastModified = new Date(content.LastModified);
      var etag = (0, _helpers.sanitizeETag)(content.ETag);
      var size = content.Size;
      var metadata;

      if (content.UserMetadata != null) {
        metadata = (0, _helpers.toArray)(content.UserMetadata)[0];
      } else {
        metadata = null;
      }

      result.objects.push({
        name,
        lastModified,
        etag,
        size,
        metadata
      });
    });
  }

  if (xmlobj.CommonPrefixes) {
    (0, _helpers.toArray)(xmlobj.CommonPrefixes).forEach(commonPrefix => {
      result.objects.push({
        prefix: (0, _helpers.sanitizeObjectKey)((0, _helpers.toArray)(commonPrefix.Prefix)[0]),
        size: 0
      });
    });
  }

  return result;
}

function parseBucketVersioningConfig(xml) {
  var xmlObj = (0, _helpers.parseXml)(xml);
  return xmlObj.VersioningConfiguration;
}

function parseTagging(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  let result = [];

  if (xmlObj.Tagging && xmlObj.Tagging.TagSet && xmlObj.Tagging.TagSet.Tag) {
    const tagResult = xmlObj.Tagging.TagSet.Tag; // if it is a single tag convert into an array so that the return value is always an array.

    if ((0, _helpers.isObject)(tagResult)) {
      result.push(tagResult);
    } else {
      result = tagResult;
    }
  }

  return result;
}

function parseLifecycleConfig(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  return xmlObj.LifecycleConfiguration;
}

function parseObjectLockConfig(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  let lockConfigResult = {};

  if (xmlObj.ObjectLockConfiguration) {
    lockConfigResult = {
      objectLockEnabled: xmlObj.ObjectLockConfiguration.ObjectLockEnabled
    };
    let retentionResp;

    if (xmlObj.ObjectLockConfiguration && xmlObj.ObjectLockConfiguration.Rule && xmlObj.ObjectLockConfiguration.Rule.DefaultRetention) {
      retentionResp = xmlObj.ObjectLockConfiguration.Rule.DefaultRetention || {};
      lockConfigResult.mode = retentionResp.Mode;
    }

    if (retentionResp) {
      const isUnitYears = retentionResp.Years;

      if (isUnitYears) {
        lockConfigResult.validity = isUnitYears;
        lockConfigResult.unit = _helpers.RETENTION_VALIDITY_UNITS.YEARS;
      } else {
        lockConfigResult.validity = retentionResp.Days;
        lockConfigResult.unit = _helpers.RETENTION_VALIDITY_UNITS.DAYS;
      }
    }

    return lockConfigResult;
  }
}

function parseObjectRetentionConfig(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  const retentionConfig = xmlObj.Retention;
  return {
    mode: retentionConfig.Mode,
    retainUntilDate: retentionConfig.RetainUntilDate
  };
}

function parseBucketEncryptionConfig(xml) {
  let encConfig = (0, _helpers.parseXml)(xml);
  return encConfig;
}

function parseReplicationConfig(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  const replicationConfig = {
    ReplicationConfiguration: {
      role: xmlObj.ReplicationConfiguration.Role,
      rules: (0, _helpers.toArray)(xmlObj.ReplicationConfiguration.Rule)
    }
  };
  return replicationConfig;
}

function parseObjectLegalHoldConfig(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  return xmlObj.LegalHold;
}

function uploadPartParser(xml) {
  const xmlObj = (0, _helpers.parseXml)(xml);
  const respEl = xmlObj.CopyPartResult;
  return respEl;
}

function parseSelectObjectContentResponse(res) {
  // extractHeaderType extracts the first half of the header message, the header type.
  function extractHeaderType(stream) {
    const headerNameLen = Buffer.from(stream.read(1)).readUInt8();
    const headerNameWithSeparator = Buffer.from(stream.read(headerNameLen)).toString();
    const splitBySeparator = (headerNameWithSeparator || "").split(":");
    const headerName = splitBySeparator.length >= 1 ? splitBySeparator[1] : "";
    return headerName;
  }

  function extractHeaderValue(stream) {
    const bodyLen = Buffer.from(stream.read(2)).readUInt16BE();
    const bodyName = Buffer.from(stream.read(bodyLen)).toString();
    return bodyName;
  }

  const selectResults = new _helpers.SelectResults({}); // will be returned

  const responseStream = (0, _helpers.readableStream)(res); // convert byte array to a readable responseStream

  while (responseStream._readableState.length) {
    // Top level responseStream read tracker.
    let msgCrcAccumulator; // accumulate from start of the message till the message crc start.

    const totalByteLengthBuffer = Buffer.from(responseStream.read(4));
    msgCrcAccumulator = crc32(totalByteLengthBuffer);
    const headerBytesBuffer = Buffer.from(responseStream.read(4));
    msgCrcAccumulator = crc32(headerBytesBuffer, msgCrcAccumulator);
    const calculatedPreludeCrc = msgCrcAccumulator.readInt32BE(); // use it to check if any CRC mismatch in header itself.

    const preludeCrcBuffer = Buffer.from(responseStream.read(4)); // read 4 bytes    i.e 4+4 =8 + 4 = 12 ( prelude + prelude crc)

    msgCrcAccumulator = crc32(preludeCrcBuffer, msgCrcAccumulator);
    const totalMsgLength = totalByteLengthBuffer.readInt32BE();
    const headerLength = headerBytesBuffer.readInt32BE();
    const preludeCrcByteValue = preludeCrcBuffer.readInt32BE();

    if (preludeCrcByteValue !== calculatedPreludeCrc) {
      // Handle Header CRC mismatch Error
      throw new Error(`Header Checksum Mismatch, Prelude CRC of ${preludeCrcByteValue} does not equal expected CRC of ${calculatedPreludeCrc}`);
    }

    const headers = {};

    if (headerLength > 0) {
      const headerBytes = Buffer.from(responseStream.read(headerLength));
      msgCrcAccumulator = crc32(headerBytes, msgCrcAccumulator);
      const headerReaderStream = (0, _helpers.readableStream)(headerBytes);

      while (headerReaderStream._readableState.length) {
        let headerTypeName = extractHeaderType(headerReaderStream);
        headerReaderStream.read(1); // just read and ignore it.

        headers[headerTypeName] = extractHeaderValue(headerReaderStream);
      }
    }

    let payloadStream;
    const payLoadLength = totalMsgLength - headerLength - 16;

    if (payLoadLength > 0) {
      const payLoadBuffer = Buffer.from(responseStream.read(payLoadLength));
      msgCrcAccumulator = crc32(payLoadBuffer, msgCrcAccumulator); // read the checksum early and detect any mismatch so we can avoid unnecessary further processing.

      const messageCrcByteValue = Buffer.from(responseStream.read(4)).readInt32BE();
      const calculatedCrc = msgCrcAccumulator.readInt32BE(); // Handle message CRC Error

      if (messageCrcByteValue !== calculatedCrc) {
        throw new Error(`Message Checksum Mismatch, Message CRC of ${messageCrcByteValue} does not equal expected CRC of ${calculatedCrc}`);
      }

      payloadStream = (0, _helpers.readableStream)(payLoadBuffer);
    }

    const messageType = headers["message-type"];

    switch (messageType) {
      case "error":
        {
          const errorMessage = headers["error-code"] + ":\"" + headers["error-message"] + "\"";
          throw new Error(errorMessage);
        }

      case "event":
        {
          const contentType = headers["content-type"];
          const eventType = headers["event-type"];

          switch (eventType) {
            case "End":
              {
                selectResults.setResponse(res);
                return selectResults;
              }

            case "Records":
              {
                const readData = payloadStream.read(payLoadLength);
                selectResults.setRecords(readData);
                break;
              }

            case "Progress":
              {
                switch (contentType) {
                  case "text/xml":
                    {
                      const progressData = payloadStream.read(payLoadLength);
                      selectResults.setProgress(progressData.toString());
                      break;
                    }

                  default:
                    {
                      const errorMessage = `Unexpected content-type ${contentType} sent for event-type Progress`;
                      throw new Error(errorMessage);
                    }
                }
              }
              break;

            case "Stats":
              {
                switch (contentType) {
                  case "text/xml":
                    {
                      const statsData = payloadStream.read(payLoadLength);
                      selectResults.setStats(statsData.toString());
                      break;
                    }

                  default:
                    {
                      const errorMessage = `Unexpected content-type ${contentType} sent for event-type Stats`;
                      throw new Error(errorMessage);
                    }
                }
              }
              break;

            default:
              {
                // Continuation message: Not sure if it is supported. did not find a reference or any message in response.
                // It does not have a payload.
                const warningMessage = `Un implemented event detected  ${messageType}.`; // eslint-disable-next-line no-console

                console.warn(warningMessage);
              }
          } // eventType End

        }
      // Event End
    } // messageType End

  } // Top Level Stream End

}
//# sourceMappingURL=xml-parsers.js.map
