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
 * Contains valid pizza size for the supported languages by the Bot
 * @type {object}
 */
const validPizzaSizes = {
  'en-US': ['small', 'medium', 'large', 'extra-large'],
  'pt-BR': ['pequeno', 'médio', 'grande', 'extra-grande'],
  'es-US': ['pequeño', 'mediano', 'grande', 'extra-grande'],
  'fr-FR': ['petit', 'moyen', 'grand', 'très-grand'],
  'it-IT': ['piccola', 'media', 'grande', 'extra-grande'],
  'de-DE': ['klein', 'mittel', 'groß', 'extra-groß'],
  'ru-RU': ['маленький', 'средний', 'большой', 'очень-большой'],
};

/**
 * Contains valid pizza crust for the supported languages by the Bot
 * @type {object}
 */
const validPizzaCrust = {
  'en-US': ['thin', 'thick'],
  'pt-BR': ['fina', 'grossa'],
  'es-US': ['fina', 'gruesa'],
  'fr-FR': ['mince', 'épais'],
  'it-IT': ['sottile', 'spesso'],
  'de-DE': ['dünn', 'dick'],
  'ru-RU': ['тонкий', 'толстый'],
};

/**
 * Contains valid number of pizzas message for the supported languages by the Bot
 * @type {object}
 */
const validPizzaCountResponse = {
  'en-US': 'Please provide an integer between 1 and 100 (inclusive)',
  'pt-BR': 'Forneça um número inteiro entre 1 e 100 (inclusive)',
  'es-US': 'Proporcione un número entero entre 1 y 100 (inclusive)',
  'fr-FR': 'Veuillez fournir un entier entre 1 et 100 (inclus)',
  'it-IT': 'Fornisci un numero intero compreso tra 1 e 100 (inclusi)',
  'de-DE': 'Bitte geben Sie eine Ganzzahl zwischen 1 und 100 (einschließlich)',
  'ru-RU': 'Укажите целое число от 1 до 100 (включительно)',
};

/**
 * Contains valid confirmation responses for the supported languages by the Bot
 * @type {object}
 */
const validConfirmationResponse = {
  'en-US': ['yes', 'no'],
  'pt-BR': ['sim', 'não'],
  'es-US': ['si', 'no'],
  'fr-FR': ['oui', 'non'],
  'it-IT': ['sì', 'no'],
  'de-DE': ['ja', 'Nein'],
  'ru-RU': ['да', 'нет'],
};

/**
 * Contains valid pizza size for the supported languages by the Bot
 * @type {object}
 */
const validEndOrderFlowSignal = {
  'en-US': 'cancel',
  'pt-BR': 'cancelar',
  'es-US': 'cancelar',
  'fr-FR': 'annuler',
  'it-IT': 'annulla',
  'de-DE': 'stornieren',
  'ru-RU': 'oтмена',
};

module.exports = {
  validPizzaSizes,
  validPizzaCountResponse,
  validPizzaCrust,
  validConfirmationResponse,
  validEndOrderFlowSignal,
};
