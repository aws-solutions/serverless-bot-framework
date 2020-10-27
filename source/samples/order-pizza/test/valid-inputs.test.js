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
  validPizzaSizes,
  validPizzaCrust,
  validPizzaCountResponse,
  validConfirmationResponse,
  validEndOrderFlowSignal,
} = require('../util/valid-inputs');

/**
 *
 * @param {string} message - message to be logged.
 * @returns {void}
 */
const testLogger = (message) => console.log(message);

describe('Unit Tests: valid-inputs.validPizzaSizes', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.validPizzaSizes ========'
    )
  );

  const validSizes = {
    'en-US': ['small', 'medium', 'large', 'extra-large'],
    'pt-BR': ['pequeno', 'médio', 'grande', 'extra-grande'],
    'es-US': ['pequeño', 'mediano', 'grande', 'extra-grande'],
    'fr-FR': ['petit', 'moyen', 'grand', 'très-grand'],
    'it-IT': ['piccolo', 'medio', 'grande', 'extra-grande'],
    'de-DE': ['klein', 'mittel', 'groß', 'extra-groß'],
    'ru-RU': ['маленький', 'средний', 'большой', 'очень-большой'],
  };

  test('expect the type of validPizzaSizes to be object', () => {
    expect(typeof validPizzaSizes).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(validPizzaSizes['en-US']).toEqual(validSizes['en-US']);
    expect(validPizzaSizes['pt-BR']).toEqual(validSizes['pt-BR']);
    expect(validPizzaSizes['es-US']).toEqual(validSizes['es-US']);
    expect(validPizzaSizes['fr-FR']).toEqual(validSizes['fr-FR']);
    expect(validPizzaSizes['it-IT']).toEqual(validSizes['it-IT']);
    expect(validPizzaSizes['de-DE']).toEqual(validSizes['de-DE']);
    expect(validPizzaSizes['ru-RU']).toEqual(validSizes['ru-RU']);
  });
});

describe('Unit Tests: valid-inputs.validPizzaCrust', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.validPizzaCrust ========'
    )
  );

  const validCrust = {
    'en-US': ['thin', 'thick'],
    'pt-BR': ['fina', 'grossa'],
    'es-US': ['fina', 'gruesa'],
    'fr-FR': ['mince', 'épais'],
    'it-IT': ['sottile', 'spesso'],
    'de-DE': ['dünn', 'dick'],
    'ru-RU': ['тонкий', 'толстый'],
  };

  test('expect the type of validPizzaCrust to be object', () => {
    expect(typeof validPizzaCrust).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(validPizzaCrust['en-US']).toEqual(validCrust['en-US']);
    expect(validPizzaCrust['pt-BR']).toEqual(validCrust['pt-BR']);
    expect(validPizzaCrust['es-US']).toEqual(validCrust['es-US']);
    expect(validPizzaCrust['fr-FR']).toEqual(validCrust['fr-FR']);
    expect(validPizzaCrust['it-IT']).toEqual(validCrust['it-IT']);
    expect(validPizzaCrust['de-DE']).toEqual(validCrust['de-DE']);
    expect(validPizzaCrust['ru-RU']).toEqual(validCrust['ru-RU']);
  });
});

describe('Unit Tests: valid-inputs.validPizzaCountResponse', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.validPizzaCountResponse ========'
    )
  );

  const validCount = {
    'en-US': 'Please provide an integer between 1 and 100 (inclusive)',
    'pt-BR': 'Forneça um número inteiro entre 1 e 100 (inclusive)',
    'es-US': 'Proporcione un número entero entre 1 y 100 (inclusive)',
    'fr-FR': 'Veuillez fournir un entier entre 1 et 100 (inclus)',
    'it-IT': 'Fornisci un numero intero compreso tra 1 e 100 (inclusi)',
    'de-DE':
      'Bitte geben Sie eine Ganzzahl zwischen 1 und 100 (einschließlich)',
    'ru-RU': 'Укажите целое число от 1 до 100 (включительно)',
  };

  test('expect the type of validPizzaSizes to be object', () => {
    expect(typeof validPizzaCountResponse).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(validPizzaCountResponse['en-US']).toBe(validCount['en-US']);
    expect(validPizzaCountResponse['pt-BR']).toBe(validCount['pt-BR']);
    expect(validPizzaCountResponse['es-US']).toBe(validCount['es-US']);
    expect(validPizzaCountResponse['fr-FR']).toBe(validCount['fr-FR']);
    expect(validPizzaCountResponse['it-IT']).toBe(validCount['it-IT']);
    expect(validPizzaCountResponse['de-DE']).toBe(validCount['de-DE']);
    expect(validPizzaCountResponse['ru-RU']).toBe(validCount['ru-RU']);
  });
});

describe('Unit Tests: valid-inputs.validConfirmationResponse', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.validConfirmationResponse ========'
    )
  );

  const validConfirmation = {
    'en-US': ['yes', 'no'],
    'pt-BR': ['sim', 'não'],
    'es-US': ['si', 'no'],
    'fr-FR': ['oui', 'non'],
    'it-IT': ['si', 'no'],
    'de-DE': ['ja', 'Nein'],
    'ru-RU': ['да', 'нет'],
  };

  test('expect the type of validPizzaSizes to be object', () => {
    expect(typeof validConfirmationResponse).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(validConfirmationResponse['en-US']).toEqual(
      validConfirmation['en-US']
    );
    expect(validConfirmationResponse['pt-BR']).toEqual(
      validConfirmation['pt-BR']
    );
    expect(validConfirmationResponse['es-US']).toEqual(
      validConfirmation['es-US']
    );
    expect(validConfirmationResponse['fr-FR']).toEqual(
      validConfirmation['fr-FR']
    );
    expect(validConfirmationResponse['it-IT']).toEqual(
      validConfirmation['it-IT']
    );
    expect(validConfirmationResponse['de-DE']).toEqual(
      validConfirmation['de-DE']
    );
    expect(validConfirmationResponse['ru-RU']).toEqual(
      validConfirmation['ru-RU']
    );
  });
});

describe('Unit Tests: valid-inputs.validEndOrderFlowSignal', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.validEndOrderFlowSignal ========'
    )
  );

  const validEndSignal = {
    'en-US': 'cancel',
    'pt-BR': 'cancelar',
    'es-US': 'cancelar',
    'fr-FR': 'annuler',
    'it-IT': 'annulla',
    'de-DE': 'stornieren',
    'ru-RU': 'oтмена',
  };

  test('expect the type of validPizzaSizes to be object', () => {
    expect(typeof validEndOrderFlowSignal).toBe('object');
  });

  test('expect the correct answers for the language', () => {
    expect(validEndOrderFlowSignal['en-US']).toBe(validEndSignal['en-US']);
    expect(validEndOrderFlowSignal['pt-BR']).toBe(validEndSignal['pt-BR']);
    expect(validEndOrderFlowSignal['es-US']).toBe(validEndSignal['es-US']);
    expect(validEndOrderFlowSignal['fr-FR']).toBe(validEndSignal['fr-FR']);
    expect(validEndOrderFlowSignal['it-IT']).toBe(validEndSignal['it-IT']);
    expect(validEndOrderFlowSignal['de-DE']).toBe(validEndSignal['de-DE']);
    expect(validEndOrderFlowSignal['ru-RU']).toBe(validEndSignal['ru-RU']);
  });
});
