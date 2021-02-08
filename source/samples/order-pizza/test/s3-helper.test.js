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

/**
 *
 * @param {string} message - message to be logged.
 * @returns {void}
 */

const AWS = require('aws-sdk');
const S3Helper = require('../util/s3-helper');

jest.mock('aws-sdk', () => {
  const mockedS3 = {
    getObject: jest.fn().mockReturnThis(),
    putObject: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return { S3: jest.fn(() => mockedS3) };
});
const testLogger = (message) => console.log(message);

describe('Unit Tests: s3-helper.S3Helper', () => {
  let s3;
  beforeAll(() => {
    testLogger('======== Running Unit Tests for s3-helper.S3Helper ========');
    s3 = new AWS.S3();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  test('expect the type of s3-helper.S3Helper to be function (class)', () => {
    expect(typeof S3Helper).toBe('function');
  });

  test('expect the type of s3-helper.S3Helper.get to be function', () => {
    expect(typeof S3Helper.get).toBe('function');
  });

  test('expect the returned object by get is a valid json based on file extension (json)', async () => {
    s3.getObject().promise.mockResolvedValueOnce({ Body: '{"menu": "greek"}' });
    const actual = await S3Helper.get('bucketName', 'fileKey.json');
    expect(actual).toEqual({ menu: 'greek' });
  });

  test('expect S3.getObject to be called with the passed params', async () => {
    expect(s3.getObject).toBeCalledWith({
      Bucket: 'bucketName',
      Key: 'fileKey.json',
    });
  });

  test('the returned object by get is string based on file extension (not json)', async () => {
    s3.getObject().promise.mockResolvedValueOnce({ Body: '{"menu": "greek"}' });
    const actual = await S3Helper.get('bucketName', 'fileKey');
    expect(actual).toEqual('{"menu": "greek"}');
  });

  test('expect S3.getObject to be called with the passed params', async () => {
    expect(s3.getObject).toBeCalledWith({
      Bucket: 'bucketName',
      Key: 'fileKey',
    });
  });

  test('expect the S3.getObject to be called twice', async () => {
    expect(s3.getObject().promise).toBeCalledTimes(2);
  });

  test('expect S3Helper.get to throw an exception', async () => {
    s3.getObject().promise.mockRejectedValueOnce(
      new Error('An exception has been thrown by S3.getObject')
    );
    await expect(S3Helper.get('bucketName', 'fileKey.json')).rejects.toThrow(
      'An exception has been thrown by S3.getObject'
    );
  });

  test('expect the type of s3-helper.S3Helper.write to be function', () => {
    expect(typeof S3Helper.write).toBe('function');
  });

  const data = {
    custumerID: 'customeremail',
    orderID: '6320-375719-2099',
  };
  const params = {
    ContentType: 'application/json',
    ACL: 'private',
    Bucket: 'bucketName',
    Key: 'fileKey.json',
    Body: JSON.stringify(data),
  };
  test('expect the returned object by get is a valid json based on file extension (json)', async () => {
    s3.putObject().promise.mockResolvedValueOnce({
      ETag: '1b2cf535f27731c974343645a3985328',
    });
    const actual = await S3Helper.write(
      'bucketName',
      'fileKey.json',
      data,
      'application/json'
    );
    expect(actual).toEqual({
      ETag: '1b2cf535f27731c974343645a3985328',
    });
  });

  test('expect S3.putObject to be called with teh passed params', async () => {
    expect(s3.putObject).toBeCalledWith(params);
  });

  test('expect the S3.putObject.promise to be called 3 times', async () => {
    expect(s3.putObject().promise).toBeCalledTimes(4);
  });

  test('expect S3Helper.write to throw an exception', async () => {
    s3.putObject().promise.mockRejectedValueOnce(
      new Error('An exception has been thrown by S3.putObject')
    );
    await expect(S3Helper.write()).rejects.toThrow(
      'An exception has been thrown by S3.putObject'
    );
  });
});
