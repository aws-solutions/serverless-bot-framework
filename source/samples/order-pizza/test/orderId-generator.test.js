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
const generateOrderId = require('../util/orderId-generator');

/**
 *
 * @param {string} message - message to be logged.
 * @returns {void}
 */
const testLogger = (message) => console.log(message);

describe('Unit Tests: pizza-responses.pizzaBotResponses', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for orderId-generator.generateOrderId ========'
    )
  );

  test('expect the type of generateOrderId to be an function', () => {
    expect(typeof generateOrderId).toBe('function');
  });

  test('expect the length of the randomely generated order id to be 16 (e.g. 6320-375719-2099)', () => {
    expect(generateOrderId().length).toBe(16);
  });

  test('expect the randomely generated orderId to match the format (e.g. 6320-375719-2099)', () => {
    const orderIdRegEx = /[0-9]{4}-[0-9]{6}-[0-9]{4}/;
    expect(generateOrderId()).toMatch(orderIdRegEx);
  });
});
