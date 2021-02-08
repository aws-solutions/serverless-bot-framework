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
  validConfirmationResponse,
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
      'Quelle taille aimeriez-vous (petit, moyen, grand, ou très-grand)?',
    'it-IT': 'Che taglia vorresti, (piccola, media, grande o extra-grande)?',
    'de-DE': 'Welche Größe möchten Sie (klein, mittel, groß oder extra-groß)?',
    'ru-RU':
      'Какой размер вам нужен (маленький, средний, большой или очень-большой)?',
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
    testLogger('======== Running Unit Tests for pizzaResponses.STEP_4 ========')
  );

  const validResponses = {
    'en-US': 'What crust would you like, (thin or thick)?',
    'pt-BR': 'Que crosta você gostaria, (fina ou grossa)?',
    'es-US': '¿Qué corteza te gustaría, (fina o gruesa)?',
    'fr-FR': 'Quelle croûte aimeriez-vous (mince ou épaisse)?',
    'it-IT': 'Quale crosta vorresti, (sottile o spessa)?',
    'de-DE': 'Welche Kruste möchten Sie (dünn oder dick)?',
    'ru-RU': 'Какую корочку вы хотите (тонкий или толстую)?',
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

describe('Unit Tests: pizzaResponses.STEP_5', () => {
  beforeAll(() =>
    testLogger('======== Running Unit Tests for pizzaResponses.STEP_5 ========')
  );

  const orderInfo = {
    'en-US': {
      pizzaType: 'Greek',
      pizzaSize: 'small',
      pizzaCount: '1',
      pizzaCrust: 'thin',
    },
    'pt-BR': {
      pizzaType: 'Grega',
      pizzaSize: 'pequeno',
      pizzaCount: '1',
      pizzaCrust: 'fina',
    },
    'es-US': {
      pizzaType: 'Griega',
      pizzaSize: 'pequeño',
      pizzaCount: '1',
      pizzaCrust: 'fina',
    },
    'fr-FR': {
      pizzaType: 'Grecque',
      pizzaSize: 'petit',
      pizzaCount: '1',
      pizzaCrust: 'mince',
    },
    'it-IT': {
      pizzaType: 'Greca',
      pizzaSize: 'piccola',
      pizzaCount: '1',
      pizzaCrust: 'sottile',
    },
    'de-DE': {
      pizzaType: 'Griechische',
      pizzaSize: 'klein',
      pizzaCount: '1',
      pizzaCrust: 'dünn',
    },
    'ru-RU': {
      pizzaType: 'Греческая',
      pizzaSize: 'маленький',
      pizzaCount: '1',
      pizzaCrust: 'тонкий',
    },
  };

  const validResponses = {
    'en-US': `Here is a summary of your order. Type: ${orderInfo['en-US'].pizzaType}, Size: ${orderInfo['en-US'].pizzaSize}, Number of Pizzas: ${orderInfo['en-US'].pizzaCount}, and Crust: ${orderInfo['en-US'].pizzaCrust}. Would you like to place your order, (yes or no)?`,
    'pt-BR': `Aqui está um resumo do seu pedido. Tipo: ${orderInfo['pt-BR'].pizzaType}, Tamanho: ${orderInfo['pt-BR'].pizzaSize}, Quantidade de Pizzas: ${orderInfo['pt-BR'].pizzaCount}, e Borda: ${orderInfo['pt-BR'].pizzaCrust}. Você gostaria de fazer seu pedido, (sim ou não)?`,
    'es-US': `A continuación se muestra un resumen de su pedido. Tipo: ${orderInfo['es-US'].pizzaType}, Tamaño: ${orderInfo['es-US'].pizzaSize}, Numero de pizzas: ${orderInfo['es-US'].pizzaCount}, y Corteza: ${orderInfo['es-US'].pizzaCrust}. ¿Le gustaría realizar su pedido (si o no)?`,
    'fr-FR': `Voici un récapitulatif de votre commande. Type: ${orderInfo['fr-FR'].pizzaType}, Taille: ${orderInfo['fr-FR'].pizzaSize}, Nombre de pizzas: ${orderInfo['fr-FR'].pizzaCount}, et croûte: ${orderInfo['fr-FR'].pizzaCrust}. Souhaitez-vous passer votre commande (oui ou non)?`,
    'it-IT': `Ecco un riepilogo del tuo ordine. Tipo: ${orderInfo['it-IT'].pizzaType}, Taglia: ${orderInfo['it-IT'].pizzaSize}, Numero di pizze: ${orderInfo['it-IT'].pizzaCount}, e Crosta: ${orderInfo['it-IT'].pizzaCrust}. Vorresti effettuare l'ordine, (sì o no)?`,
    'de-DE': `Hier ist eine Zusammenfassung Ihrer Bestellung. Art: ${orderInfo['de-DE'].pizzaType}, Größe: ${orderInfo['de-DE'].pizzaSize}, Anzahl der Pizzen: ${orderInfo['de-DE'].pizzaCount}, und Kruste: ${orderInfo['de-DE'].pizzaCrust}. Möchten Sie Ihre Bestellung aufgeben (ja oder nein)?`,
    'ru-RU': `Вот краткое изложение вашего заказа. Тип: ${orderInfo['ru-RU'].pizzaType}, Размер: ${orderInfo['ru-RU'].pizzaSize}, Количество пицц: ${orderInfo['ru-RU'].pizzaCount}, а также Корочка: ${orderInfo['ru-RU'].pizzaCrust}. Вы бы хотели разместить заказ (да или нет)?`,
  };

  test('expect the type of pizzaBotResponses.STEP_5 to be function', () => {
    expect(typeof pizzaBotResponses.STEP_5).toBe('function');
  });

  test('expect the correct answers for the language', () => {
    expect(pizzaBotResponses.STEP_5('en-US', orderInfo['en-US'])).toEqual(
      validResponses['en-US']
    );
    expect(pizzaBotResponses.STEP_5('pt-BR', orderInfo['pt-BR'])).toEqual(
      validResponses['pt-BR']
    );
    expect(pizzaBotResponses.STEP_5('es-US', orderInfo['es-US'])).toEqual(
      validResponses['es-US']
    );
    expect(pizzaBotResponses.STEP_5('fr-FR', orderInfo['fr-FR'])).toEqual(
      validResponses['fr-FR']
    );
    expect(pizzaBotResponses.STEP_5('it-IT', orderInfo['it-IT'])).toEqual(
      validResponses['it-IT']
    );
    expect(pizzaBotResponses.STEP_5('de-DE', orderInfo['de-DE'])).toEqual(
      validResponses['de-DE']
    );
    expect(pizzaBotResponses.STEP_5('ru-RU', orderInfo['ru-RU'])).toEqual(
      validResponses['ru-RU']
    );
  });
});

describe('Unit Tests: pizzaResponses.STEP_6', () => {
  beforeAll(() =>
    testLogger('======== Running Unit Tests for pizzaResponses.STEP_6 ========')
  );

  const orderId = '6320-375719-2099';
  const totalBill = 25.34;

  test('expect the type of pizzaBotResponses.STEP_6 to be function', () => {
    expect(typeof pizzaBotResponses.STEP_6).toBe('function');
  });

  const languageYesRespones = {
    'en-US': `Your order has been placed. Here is the order's number: ${orderId}. Your total bill, including tax, is $${totalBill}. Thank you for using our service!`,
    'pt-BR': `Seu pedido foi feito. Aqui está o número do pedido: ${orderId}. Sua fatura total incluindo impostos é $${totalBill}. Obrigado por usar o nosso serviço!`,
    'es-US': `Su orden ha sido puesta. Aquí está el número de pedido: ${orderId}. Su factura total, incluidos los impuestos, es $${totalBill}. ¡Gracias por usar nuestro servicio!`,
    'fr-FR': `Votre commande a bien été reçue. Voici le numéro de commande: ${orderId}. Votre facture totale, taxes comprises, est $${totalBill}. Merci d'utiliser notre service!`,
    'it-IT': `Il tuo ordine è stato inoltrato. Ecco il numero dell'ordine: ${orderId}. Il conto totale comprensivo di tasse è $${totalBill}. Grazie per aver utilizzato il nostro servizio!`,
    'de-DE': `Deine Bestellung wurde aufgenommen. Hier ist die Bestellnummer: ${orderId}. Ihre Gesamtrechnung einschließlich Steuern beträgt $${totalBill}. Vielen Dank, dass Sie unseren Service nutzen!`,
    'ru-RU': `Ваш заказ был размещен. Вот номер заказа: ${orderId}. Ваш общий счет, включая налоги, составляет $${totalBill}. Спасибо, что воспользовались нашим сервисом!`,
  };

  test('expect the correct answers for the language if the confirmation = "yes" ', () => {
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'en-US',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['en-US'][0],
      })
    ).toEqual(languageYesRespones['en-US']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'pt-BR',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['pt-BR'][0],
      })
    ).toEqual(languageYesRespones['pt-BR']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'es-US',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['es-US'][0],
      })
    ).toEqual(languageYesRespones['es-US']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'fr-FR',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['fr-FR'][0],
      })
    ).toEqual(languageYesRespones['fr-FR']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'it-IT',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['it-IT'][0],
      })
    ).toEqual(languageYesRespones['it-IT']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'de-DE',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['de-DE'][0],
      })
    ).toEqual(languageYesRespones['de-DE']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'ru-RU',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['ru-RU'][0],
      })
    ).toEqual(languageYesRespones['ru-RU']);
  });

  const languageNoRespones = {
    'en-US': 'Your order has been cancelled. Thank you!',
    'pt-BR': 'Seu pedido foi cancelado. Obrigado!',
    'es-US': 'Tu pedido ha sido cancelado. ¡Gracias!',
    'fr-FR': 'Votre commande a été annulée. Je vous remercie!',
    'it-IT': 'Il tuo ordine è stato annullato. Grazie!',
    'de-DE': 'Ihre Bestellung wurde storniert. Dankeschön!',
    'ru-RU': 'Ваш заказ был отменен. Спасибо!',
  };

  test('expect the correct answers for the language if the confirmation = "no" ', () => {
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'en-US',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['en-US'][1],
      })
    ).toEqual(languageNoRespones['en-US']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'pt-BR',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['pt-BR'][1],
      })
    ).toEqual(languageNoRespones['pt-BR']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'es-US',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['es-US'][1],
      })
    ).toEqual(languageNoRespones['es-US']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'fr-FR',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['fr-FR'][1],
      })
    ).toEqual(languageNoRespones['fr-FR']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'it-IT',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['it-IT'][1],
      })
    ).toEqual(languageNoRespones['it-IT']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'de-DE',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['de-DE'][1],
      })
    ).toEqual(languageNoRespones['de-DE']);
    expect(
      pizzaBotResponses.STEP_6({
        lang: 'ru-RU',
        orderId,
        totalBill,
        confirmation: validConfirmationResponse['ru-RU'][1],
      })
    ).toEqual(languageNoRespones['ru-RU']);
  });

  /** expect the function to throw an error for unknown confirmation */
  expect(() => {
    pizzaBotResponses.STEP_6({
      lang: 'ru-RU',
      orderId,
      totalBill,
      confirmation: 'unknown-confirmation',
    });
  }).toThrow(
    'pizza-responses.STEP_6: Unknown confirmationMessage: unknown-confirmation'
  );
});

describe('Unit Tests: pizza-responses.createResponse', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for pizza-responses.createResponse ========'
    )
  );

  test('expect the type of pizza-responses.createResponse to be function', () => {
    expect(typeof createResponse).toBe('function');
  });

  test('expect pizza-responses.createResponse to return the correct object', () => {
    const args = [
      'pizzaSize',
      'what type of pizza would you like?',
      'what type of pizza would you like?',
      {
        lang: 'en-US',
        userInfo: {
          email: 'useremail',
          sub: 'sub_random_id',
        },
        orderStep: 'STEP_2',
        _tags: [],
        _entities: [],
      },
    ];
    const expected = {
      asyncConversation: {
        id: 'pizzaSize',
        payload: {
          lang: 'en-US',
          userInfo: {
            email: 'useremail',
            sub: 'sub_random_id',
          },
          orderStep: 'STEP_2',
          _tags: [],
          _entities: [],
        },
        endConversation: false,
        ask: {
          text: 'what type of pizza would you like?',
          speech: 'what type of pizza would you like?',
        },
      },
    };

    expect(createResponse(...args)).toEqual(expected);
  });
});
