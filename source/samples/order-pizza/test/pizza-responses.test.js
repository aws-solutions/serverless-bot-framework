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
  pizzaBotResponses,
  createResponse,
  validPizzaSizes,
  validPizzaCrust,
  validConfirmationResponse,
  validPizzaCountResponse,
} = require('../util/pizza-responses');

/**
 *
 * @param {string} message - message to be logged.
 * @returns {void}
 */
const testLogger = (message) => console.log(message);

describe('Unit Tests: pizza-responses.STEP_0', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for pizza-responses.STEP_0 ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Greek',
        D: 'Toppings: feta, spinach, and olives',
        P: [10, 13, 16, 19],
      },
      {
        T: 'New York',
        D: 'Toppings: tomato sauce, and mozzarella cheese',
        P: [11, 13, 17, 20],
      },
      {
        T: 'Vegetarian',
        D: 'Toppings: black olives, bell pepper, tomatoes, and mushrooms',
        P: [9, 12, 15, 18],
      },
    ],
  };

  test('expect the type of pizzaBotResponses to be function', () => {
    expect(typeof pizzaBotResponses.STEP_0).toBe('function');
  });

  const orderAttributes = {
    pizzaType: 'Greek',
    pizzaSize: 'small',
    pizzaCount: '2',
    pizzaCrust: 'thin',
  };

  const expected =
    'Welcome back to our Pizza Ordering Service. Would you like to order the same order as your last one?. Type: Greek, Size: small, Number of Pizzas: 2, and Crust: thin, (yes or no)?';

  console.log(
    pizzaBotResponses.STEP_0('en-US', menu.menuItems, orderAttributes)
  );
  test('expect the correct format for the language', () => {
    expect(
      pizzaBotResponses.STEP_0('en-US', menu.menuItems, orderAttributes)
    ).toBe(expected);
  });

  const hasOrdersAnsNo = true;
  const expectedNoOrder =
    'Our Pizza menu includes: Greek Pizza (Toppings: feta, spinach, and olives). Price (Small: $10, Medium: $13, Large: $16, Extra-large: $19). New York Pizza (Toppings: tomato sauce, and mozzarella cheese). Price (Small: $11, Medium: $13, Large: $17, Extra-large: $20). Vegetarian Pizza (Toppings: black olives, bell pepper, tomatoes, and mushrooms). Price (Small: $9, Medium: $12, Large: $15, Extra-large: $18). What type of pizza would you like?';
  test('expect the correct format for the language', () => {
    expect(
      pizzaBotResponses.STEP_0(
        'en-US',
        menu.menuItems,
        undefined,
        hasOrdersAnsNo
      )
    ).toBe(expectedNoOrder);
  });
});

/** TO-DO STEP_0 Unit tests for other languages */

describe('Unit Tests: pizzaResponses.STEP_2', () => {
  beforeAll(() =>
    testLogger('======== Running Unit Tests for pizzaResponses.STEP_2 ========')
  );

  const validResponses = {
    'en-US':
      'What size would you like, (small, medium, large, or extra-large)?',
    'pt-BR':
      'Qual tamanho você gostaria, (pequeno, médio, grande ou extra-grande)?',
    'es-US':
      '¿Qué tamaño le gustaría (pequeño, mediano, grande o extra-grande)?',
    'fr-FR':
      'Quelle taille aimeriez-vous (petite, moyenne, grande ou extra-large)?',
    'it-IT': 'Che taglia vorresti, (piccola, media, grande o extra-grande)?',
    'de-DE': 'Welche Größe möchten Sie (klein, mittel, groß oder extra-groß)?',
    'ru-RU':
      'Какой размер вам нужен (маленький, средний, большой или очень большой)?',
  };

  test('expect the type of validResponses to be object', () => {
    expect(typeof pizzaBotResponses.STEP_2).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(pizzaBotResponses.STEP_2['en-US']).toEqual(validResponses['en-US']);
    expect(pizzaBotResponses.STEP_2['pt-BR']).toEqual(validResponses['pt-BR']);
    expect(pizzaBotResponses.STEP_2['es-US']).toEqual(validResponses['es-US']);
    expect(pizzaBotResponses.STEP_2['fr-FR']).toEqual(validResponses['fr-FR']);
    expect(pizzaBotResponses.STEP_2['it-IT']).toEqual(validResponses['it-IT']);
    expect(pizzaBotResponses.STEP_2['de-DE']).toEqual(validResponses['de-DE']);
    expect(pizzaBotResponses.STEP_2['ru-RU']).toEqual(validResponses['ru-RU']);
  });
});

describe('Unit Tests: pizzaResponses.STEP_3', () => {
  beforeAll(() =>
    testLogger('======== Running Unit Tests for pizzaResponses.STEP_3 ========')
  );

  const validResponses = {
    'en-US': 'How many pizzas would you like?',
    'pt-BR': 'Quantas pizzas você gostaria?',
    'es-US': '¿Cuántas pizzas te gustaría?',
    'fr-FR': 'Combien de pizzas souhaitez-vous?',
    'it-IT': 'Quante pizze vorresti?',
    'de-DE': 'Wie viele Pizzen möchten Sie?',
    'ru-RU': 'Сколько пиццы вы хотите?',
  };

  test('expect the type of validResponses to be object', () => {
    expect(typeof pizzaBotResponses.STEP_3).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(pizzaBotResponses.STEP_3['en-US']).toEqual(validResponses['en-US']);
    expect(pizzaBotResponses.STEP_3['pt-BR']).toEqual(validResponses['pt-BR']);
    expect(pizzaBotResponses.STEP_3['es-US']).toEqual(validResponses['es-US']);
    expect(pizzaBotResponses.STEP_3['fr-FR']).toEqual(validResponses['fr-FR']);
    expect(pizzaBotResponses.STEP_3['it-IT']).toEqual(validResponses['it-IT']);
    expect(pizzaBotResponses.STEP_3['de-DE']).toEqual(validResponses['de-DE']);
    expect(pizzaBotResponses.STEP_3['ru-RU']).toEqual(validResponses['ru-RU']);
  });
});

describe('Unit Tests: pizzaResponses.STEP_4', () => {
  beforeAll(() =>
    testLogger('======== Running Unit Tests for pizzaResponses.STEP_3 ========')
  );

  const validResponses = {
    'en-US': 'What crust would you like, (thin or thick)?',
    'pt-BR': 'Que crosta você gostaria, (fina ou grossa)?',
    'es-US': '¿Qué corteza te gustaría, (fina o gruesa)?',
    'fr-FR': 'Quelle croûte aimeriez-vous (mince ou épaisse)?',
    'it-IT': 'Quale crosta vorresti, (sottile o spessa)?',
    'de-DE': 'Welche Kruste möchten Sie (dünn oder dick)?',
    'ru-RU': 'Какую корочку вы хотите (тонкую или толстую)?',
  };

  test('expect the type of validResponses to be object', () => {
    expect(typeof pizzaBotResponses.STEP_4).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(pizzaBotResponses.STEP_4['en-US']).toEqual(validResponses['en-US']);
    expect(pizzaBotResponses.STEP_4['pt-BR']).toEqual(validResponses['pt-BR']);
    expect(pizzaBotResponses.STEP_4['es-US']).toEqual(validResponses['es-US']);
    expect(pizzaBotResponses.STEP_4['fr-FR']).toEqual(validResponses['fr-FR']);
    expect(pizzaBotResponses.STEP_4['it-IT']).toEqual(validResponses['it-IT']);
    expect(pizzaBotResponses.STEP_4['de-DE']).toEqual(validResponses['de-DE']);
    expect(pizzaBotResponses.STEP_4['ru-RU']).toEqual(validResponses['ru-RU']);
  });
});

/** TO-DO write Unit Test to mock the remainng functions */
