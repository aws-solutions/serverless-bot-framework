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
const AWSMock = require('aws-sdk-mock');
const DynamoDBHelper = require('../util/dynamodb-helper');

const testLogger = (message) => console.log(message);

describe('Unit Tests: dynamodb-helper.DynamoDBHelper', () => {
  beforeAll(() => {
    testLogger(
      '======== Running Unit Tests for dynamodb-helper.DynamoDBHelper ========'
    );
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper to be function (class)', () => {
    expect(typeof DynamoDBHelper).toBe('function');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.get to be function', () => {
    expect(typeof DynamoDBHelper.get).toBe('function');
  });
  test('expect the returned object by get to match expected', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'get', {
      Item: { customerId: 'customeremail', orderId: '6252-3322-3321' },
    });
    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();
    const actual = await DynamoDBHelper.get(
      'primaryKey',
      'primaryKeyValue',
      'TableName'
    );
    expect(actual).toEqual({
      customerId: 'customeremail',
      orderId: '6252-3322-3321',
    });
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect DynamoDBHelper.get to throw an exception', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'get', function (params, callback) {
      callback(new Error('An exception has been thrown by DynamoDBHelper.get'));
    });

    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();
    await expect(
      DynamoDBHelper.get('primaryKey', 'primaryKeyValue', 'TableName')
    ).rejects.toThrow('An exception has been thrown by DynamoDBHelper.get');

    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.query to be function', () => {
    expect(typeof DynamoDBHelper.query).toBe('function');
  });

  test('expect the returned object by query to match expected', async () => {
    // Overwriting DynamoDB.DocumentClient.query()
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'query', {
      Items: [
        { orderId: '6252-3322-3321', orderDate: 1231332113211 },
        { orderId: '2352-3322-3321', orderDate: 3283332113211 },
      ],
    });
    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      tableName: 'TableName',
      index: 'IndexName',
      queryKey: 'customerId',
      queryValue: 'customeremail',
    };
    const actual = await DynamoDBHelper.query(params);
    expect(actual).toEqual([
      { orderId: '6252-3322-3321', orderDate: 1231332113211 },
      { orderId: '2352-3322-3321', orderDate: 3283332113211 },
    ]);

    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect DynamoDBHelper.query to throw an exception', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'query', function (
      params,
      callback
    ) {
      callback(
        new Error('An exception has been thrown by DynamoDBHelper.query')
      );
    });

    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();

    const queryArgs = {
      tableName: 'TableName',
      index: 'IndexName',
      queryKey: 'customerId',
      queryValue: 'customeremail',
    };
    await expect(DynamoDBHelper.query(queryArgs)).rejects.toThrow(
      'An exception has been thrown by DynamoDBHelper.query'
    );

    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect the type of dynamodb-helper.DynamoDBHelper.write to be function', () => {
    expect(typeof DynamoDBHelper.write).toBe('function');
  });

  const data = {
    customerId: 'customerEmail',
    orderId: '3224-32233-3222',
  };
  test('expect the returned object by DynamoDBHelper.write', async () => {
    // Overwriting DynamoDB.DocumentClient.put()
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'put', data);
    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();
    const actual = await DynamoDBHelper.write('customerId', data, 'TableName');
    expect(actual).toEqual(data);

    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect the returned object by DynamoDBHelper.write', async () => {
    // Overwriting DynamoDB.DocumentClient.put()
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'put', function (params, callback) {
      callback(
        new Error('An exception has been thrown by DynamoDBHelper.write')
      );
    });
    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();
    await expect(
      DynamoDBHelper.write('customerId', data, 'TableName')
    ).rejects.toThrow('An exception has been thrown by DynamoDBHelper.write');

    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect DynamoDBHelper.write to throw an exception if the primaryKey is not in the data', async () => {
    const dataNoKey = {
      orderId: '3224-32233-3222',
    };
    await expect(
      DynamoDBHelper.write('customerId', dataNoKey, 'TableName')
    ).rejects.toThrow('no primary key in the data');
  });

  const updateArgs = {
    tableName: 'pizza-orders',
    primaryKey: 'customerId',
    primaryKeyValue: 'fakeuseremail',
    updateKey: 'totalBill',
    updateValue: '$25',
  };
  test('expect the returned object by DynamoDBHelper.update', async () => {
    const res = {
      data: {
        customerId: 'fakeuseremail',
        orderId: '3224-32233-3222',
        pizzaType: 'Greek',
        pizzaCount: '3',
        pizzaSize: 'large',
        pizzaCrust: 'thin',
        totalBill: '$25',
      },
      error: {
        code: 'SHORT_UNIQUE_ERROR_CODE',
        message: 'Some human readable error message',
      },
    };

    // Overwriting DynamoDB.DocumentClient.put()
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'update', res);
    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();
    const actual = await DynamoDBHelper.update(updateArgs);
    expect(actual).toEqual(res);

    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('expect DynamoDBHelper.update to throw an exception', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'update', function (
      params,
      callback
    ) {
      callback(
        new Error('An exception has been thrown by DynamoDBHelper.update')
      );
    });

    DynamoDBHelper.documentClient = new AWS.DynamoDB.DocumentClient();

    await expect(DynamoDBHelper.update(updateArgs)).rejects.toThrow(
      'An exception has been thrown by DynamoDBHelper.update'
    );

    AWSMock.restore('DynamoDB.DocumentClient');
  });
});
