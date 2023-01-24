"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildARN = exports.TopicConfig = exports.QueueConfig = exports.ObjectRemovedDeleteMarkerCreated = exports.ObjectRemovedDelete = exports.ObjectRemovedAll = exports.ObjectReducedRedundancyLostObject = exports.ObjectCreatedPut = exports.ObjectCreatedPost = exports.ObjectCreatedCopy = exports.ObjectCreatedCompleteMultipartUpload = exports.ObjectCreatedAll = exports.NotificationPoller = exports.NotificationConfig = exports.CloudFunctionConfig = void 0;

var _events = require("events");

var transformers = _interopRequireWildcard(require("./transformers"));

var _helpers = require("./helpers");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2016 MinIO, Inc.
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
// Notification config - array of target configs.
// Target configs can be
// 1. Topic (simple notification service)
// 2. Queue (simple queue service)
// 3. CloudFront (lambda function)
class NotificationConfig {
  add(target) {
    let instance = '';

    if (target instanceof TopicConfig) {
      instance = 'TopicConfiguration';
    }

    if (target instanceof QueueConfig) {
      instance = 'QueueConfiguration';
    }

    if (target instanceof CloudFunctionConfig) {
      instance = 'CloudFunctionConfiguration';
    }

    if (!this[instance]) this[instance] = [];
    this[instance].push(target);
  }

} // Base class for three supported configs.


exports.NotificationConfig = NotificationConfig;

class TargetConfig {
  setId(id) {
    this.Id = id;
  }

  addEvent(newevent) {
    if (!this.Event) this.Event = [];
    this.Event.push(newevent);
  }

  addFilterSuffix(suffix) {
    if (!this.Filter) this.Filter = {
      S3Key: {
        FilterRule: []
      }
    };
    this.Filter.S3Key.FilterRule.push({
      Name: "suffix",
      Value: suffix
    });
  }

  addFilterPrefix(prefix) {
    if (!this.Filter) this.Filter = {
      S3Key: {
        FilterRule: []
      }
    };
    this.Filter.S3Key.FilterRule.push({
      Name: "prefix",
      Value: prefix
    });
  }

} // 1. Topic (simple notification service)


class TopicConfig extends TargetConfig {
  constructor(arn) {
    super();
    this.Topic = arn;
  }

} // 2. Queue (simple queue service)


exports.TopicConfig = TopicConfig;

class QueueConfig extends TargetConfig {
  constructor(arn) {
    super();
    this.Queue = arn;
  }

} // 3. CloudFront (lambda function)


exports.QueueConfig = QueueConfig;

class CloudFunctionConfig extends TargetConfig {
  constructor(arn) {
    super();
    this.CloudFunction = arn;
  }

}

exports.CloudFunctionConfig = CloudFunctionConfig;

const buildARN = (partition, service, region, accountId, resource) => {
  return "arn:" + partition + ":" + service + ":" + region + ":" + accountId + ":" + resource;
};

exports.buildARN = buildARN;
const ObjectCreatedAll = "s3:ObjectCreated:*";
exports.ObjectCreatedAll = ObjectCreatedAll;
const ObjectCreatedPut = "s3:ObjectCreated:Put";
exports.ObjectCreatedPut = ObjectCreatedPut;
const ObjectCreatedPost = "s3:ObjectCreated:Post";
exports.ObjectCreatedPost = ObjectCreatedPost;
const ObjectCreatedCopy = "s3:ObjectCreated:Copy";
exports.ObjectCreatedCopy = ObjectCreatedCopy;
const ObjectCreatedCompleteMultipartUpload = "s3:ObjectCreated:CompleteMultipartUpload";
exports.ObjectCreatedCompleteMultipartUpload = ObjectCreatedCompleteMultipartUpload;
const ObjectRemovedAll = "s3:ObjectRemoved:*";
exports.ObjectRemovedAll = ObjectRemovedAll;
const ObjectRemovedDelete = "s3:ObjectRemoved:Delete";
exports.ObjectRemovedDelete = ObjectRemovedDelete;
const ObjectRemovedDeleteMarkerCreated = "s3:ObjectRemoved:DeleteMarkerCreated";
exports.ObjectRemovedDeleteMarkerCreated = ObjectRemovedDeleteMarkerCreated;
const ObjectReducedRedundancyLostObject = "s3:ReducedRedundancyLostObject"; // Poll for notifications, used in #listenBucketNotification.
// Listening constitutes repeatedly requesting s3 whether or not any
// changes have occurred.

exports.ObjectReducedRedundancyLostObject = ObjectReducedRedundancyLostObject;

class NotificationPoller extends _events.EventEmitter {
  constructor(client, bucketName, prefix, suffix, events) {
    super();
    this.client = client;
    this.bucketName = bucketName;
    this.prefix = prefix;
    this.suffix = suffix;
    this.events = events;
    this.ending = false;
  } // Starts the polling.


  start() {
    this.ending = false;
    process.nextTick(() => {
      this.checkForChanges();
    });
  } // Stops the polling.


  stop() {
    this.ending = true;
  }

  checkForChanges() {
    // Don't continue if we're looping again but are cancelled.
    if (this.ending) return;
    let method = 'GET';
    var queries = [];

    if (this.prefix) {
      var prefix = (0, _helpers.uriEscape)(this.prefix);
      queries.push(`prefix=${prefix}`);
    }

    if (this.suffix) {
      var suffix = (0, _helpers.uriEscape)(this.suffix);
      queries.push(`suffix=${suffix}`);
    }

    if (this.events) {
      this.events.forEach(s3event => queries.push('events=' + (0, _helpers.uriEscape)(s3event)));
    }

    queries.sort();
    var query = '';

    if (queries.length > 0) {
      query = `${queries.join('&')}`;
    }

    const region = this.client.region || _helpers.DEFAULT_REGION;
    this.client.makeRequest({
      method,
      bucketName: this.bucketName,
      query
    }, '', [200], region, true, (e, response) => {
      if (e) return this.emit('error', e);
      let transformer = transformers.getNotificationTransformer();
      (0, _helpers.pipesetup)(response, transformer).on('data', result => {
        // Data is flushed periodically (every 5 seconds), so we should
        // handle it after flushing from the JSON parser.
        let records = result.Records; // If null (= no records), change to an empty array.

        if (!records) records = []; // Iterate over the notifications and emit them individually.

        records.forEach(record => {
          this.emit('notification', record);
        }); // If we're done, stop.

        if (this.ending) response.destroy();
      }).on('error', e => this.emit('error', e)).on('end', () => {
        // Do it again, if we haven't cancelled yet.
        process.nextTick(() => {
          this.checkForChanges();
        });
      });
    });
  }

}

exports.NotificationPoller = NotificationPoller;
//# sourceMappingURL=notification.js.map
