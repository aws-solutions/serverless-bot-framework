/** ********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICNSE-2.0                                                                     *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 ******************************************************************************************************************** */
/**
 * @author Solution Builders
 */
const AWS = require('aws-sdk');

console.debug('Loading S3Helper class.....');

/**
 *  A Class to provide easy to use interface to the AWS S3
 */
class S3Helper {
  /**
   * Initializing AWS S3 client as a static class member to be used by the class's static methods
   */
  static s3Client = new AWS.S3({ region: process.env.AWS_REGION });

  /**
   * Read file from S3 bucket
   * @param {strng} bucket - name of the S3 bucket
   * @param {string} fileKey - S3 key of the file
   * @returns {object|string} - if the file is json, an object is returned. Otherwise, a string is returned
   */
  static async get(bucket, fileKey) {
    const params = {
      Bucket: bucket,
      Key: fileKey,
    };

    const [fileExtension] = fileKey.split('.').slice(-1);

    try {
      let data = await this.s3Client.getObject(params).promise();

      if (fileExtension === 'json') {
        data = JSON.parse(data.Body.toString());
      } else {
        data = data.Body.toString();
      }
      return data;
    } catch (error) {
      console.error(
        `S3Helper.get: error geting file: ${JSON.stringify(params)}: ${
          error.message
        }`
      );
      console.error(error.stack);
      /* Rethrow the error to the calling function */
      throw error;
    }
  }

  /**
   * Write data to a file in S3 bucket
   * @param {strng} bucket - name of the S3 bucket
   * @param {string} fileKey - S3 key of the new file to write data to
   * @param {string} data - data to be written to the file
   * @param {string} ContentType - content type of the file (e.g. application/json, text/html, etc.)
   * @param {string} ACL - object's Access Control List, e.g. 'private', 'public-read', 'public-read-write', etc.. default 'private'
   * @returns {object} res - response from the write operation
   */
  static async write(bucket, fileKey, data, ContentType, ACL = 'private') {
    const params = {
      ContentType,
      ACL,
      Bucket: bucket,
      Key: fileKey,
      Body: JSON.stringify(data),
    };

    try {
      const res = await this.s3Client.putObject(params).promise();
      console.debug(`S3Helper.write - write response: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      console.error(
        `S3Helper.write: error writting file: ${JSON.stringify(
          fileKey
        )} to bucket: ${bucket}: ${error.message}`
      );
      console.error(error.stack);
      /* Rethrow the error to the calling function */
      throw error;
    }
  }
}

module.exports = S3Helper;
