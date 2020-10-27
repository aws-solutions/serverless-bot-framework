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

const {
  askForValidInput,
  calculateTotalBill,
  extractOrderAttributes,
  isValidNumber,
  isEndOrderFlow,
} = require('../util/order-helpers');

const {
  validPizzaCrust,
  validEndOrderFlowSignal,
} = require('../util/valid-inputs');

/**
 *
 * @param {string} message - message to be logged.
 * @returns {void}
 */
const testLogger = (message) => console.log(message);

describe('Unit Tests: order-helpers.calculateTotalBill', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for order-helpers.calculateTotalBill ========'
    )
  );

  test('expect the type of calculateTotalBill to be function', () => {
    expect(typeof calculateTotalBill).toBe('function');
  });

  test('expect calculateTotalBill to give the right total price (price, number of pizzas)', () => {
    expect(calculateTotalBill(13, '2')).toBe('29.38');
  });
});

describe('Unit Tests: order-helpers.askForValidInput', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for order-helpers.askForValidInput ========'
    )
  );

  const expectedResponses = {
    'en-US': 'Please provide one of these options: ["thin","thick"]',
    'pt-BR': 'Forneça uma dessas opções: ["fina","grossa"]',
    'es-US': 'Proporcione una de estas opciones: ["fina","gruesa"]',
    'fr-FR': 'Veuillez fournir l une de ces options: ["mince","épais"]',
    'it-IT': 'Fornisci una di queste opzioni: ["sottile","spesso"]',
    'de-DE': 'Bitte geben Sie eine dieser Optionen an: ["dünn","dick"]',
    'ru-RU': 'Пожалуйста, укажите один из этих вариантов: ["тонкий","толстый"]',
  };

  test('expect the type of askForValidInput to be function', () => {
    expect(typeof askForValidInput).toBe('function');
  });

  test('expect the correct answers for the language', () => {
    expect(askForValidInput('en-US', validPizzaCrust['en-US'])).toEqual(
      expectedResponses['en-US']
    );
    expect(askForValidInput('pt-BR', validPizzaCrust['pt-BR'])).toEqual(
      expectedResponses['pt-BR']
    );
    expect(askForValidInput('es-US', validPizzaCrust['es-US'])).toEqual(
      expectedResponses['es-US']
    );
    expect(askForValidInput('fr-FR', validPizzaCrust['fr-FR'])).toEqual(
      expectedResponses['fr-FR']
    );
    expect(askForValidInput('it-IT', validPizzaCrust['it-IT'])).toEqual(
      expectedResponses['it-IT']
    );
    expect(askForValidInput('de-DE', validPizzaCrust['de-DE'])).toEqual(
      expectedResponses['de-DE']
    );
    expect(askForValidInput('ru-RU', validPizzaCrust['ru-RU'])).toEqual(
      expectedResponses['ru-RU']
    );
  });
});

describe('Unit Tests: order-helpers.isValidNumber', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for order-helpers.isValidNumber ========'
    )
  );

  test('expect the type of isEndOrderFlow to be function', () => {
    expect(typeof isValidNumber).toBe('function');
  });

  test('expect isValidNumber retun true if the string contains a valid number', () => {
    expect(isValidNumber('3')).toBeTruthy();
    expect(isValidNumber('')).toBeFalsy();
    expect(isValidNumber('1w')).toBeFalsy();
    expect(isValidNumber('req')).toBeFalsy();
    expect(isValidNumber('true')).toBeFalsy();
    expect(isValidNumber('1   3')).toBeFalsy();
    expect(isValidNumber(undefined)).toBeFalsy();
    expect(isValidNumber(null)).toBeFalsy();
  });
});

describe('Unit Tests: order-helpers.isEndOrderFlow', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for order-helpers.isEndOrderFlow ========'
    )
  );

  test('expect the type of isEndOrderFlow to be function', () => {
    expect(typeof isEndOrderFlow).toBe('function');
  });

  test('expect isEndOrderFlow retun true if the work matches the cancelation word for the language', () => {
    for (const lang of Object.keys(validEndOrderFlowSignal)) {
      expect(
        isEndOrderFlow(
          validEndOrderFlowSignal[lang],
          validEndOrderFlowSignal[lang]
        )
      ).toBeTruthy();
    }
  });
});

/** TO-DO write Unit Test to mock the remainng functions that use DynamoDB */
