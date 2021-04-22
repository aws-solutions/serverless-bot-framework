 /*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

'use strict';

const aws = require('aws-sdk');


exports.handler = (event, context, callback) => {
  const awsConfig = JSON.parse(process.env.AWS_SDK_USER_AGENT);
  const polly = new aws.Polly({ apiVersion: '2016-06-10', ...awsConfig });
  const params = {
    OutputFormat: 'mp3',
    Text: event['text'],
    VoiceId: event['voice'],
    Engine: 'standard',
    TextType: 'text'
  };
  polly.synthesizeSpeech(params).promise()
    .then((data) => {
      callback(null, data['AudioStream']);
    })
    .catch((err) => {
      console.error(err, err.stack);
      callback(err.message);
    });
};