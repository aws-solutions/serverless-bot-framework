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
const S3Helper = require('../util/s3-helper');

const testLogger = (message) => console.log(message);

describe('Unit Tests: s3-helper.S3Helper', () => {
  beforeAll(() =>
    testLogger('======== Running Unit Tests for s3-helper.S3Helper ========')
  );

  test('expect the type of s3-helper.S3Helper to be function (class)', () => {
    expect(typeof S3Helper).toBe('function');
  });

  test('expect the type of s3-helper.S3Helper.get to be function', () => {
    expect(typeof S3Helper.get).toBe('function');
  });

  test('expect the type of s3-helper.S3Helper.write to be function', () => {
    expect(typeof S3Helper.write).toBe('function');
  });
});

/** TO-DO add units Tests to mock S3 */
