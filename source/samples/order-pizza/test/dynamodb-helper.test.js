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
const DynamoDBHelper = require('../util/dynamodb-helper');

const testLogger = (message) => console.log(message);

describe('Unit Tests: dynamodb-helper.DynamoDBHelper', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for dynamodb-helper.DynamoDBHelper ========'
    )
  );

  test('expect the type of dynamodb-helper.DynamoDBHelper to be function (class)', () => {
    expect(typeof DynamoDBHelper).toBe('function');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.get to be function', () => {
    expect(typeof DynamoDBHelper.get).toBe('function');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.query to be function', () => {
    expect(typeof DynamoDBHelper.query).toBe('function');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.write to be function', () => {
    expect(typeof DynamoDBHelper.write).toBe('function');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.update to be function', () => {
    expect(typeof DynamoDBHelper.update).toBe('function');
  });
});

/** TO-DO add units Tests to mock DynamoDB */
