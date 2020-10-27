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

const formatPizzaMenu = require('../util/menu-formatter');

/**
 *
 * @param {string} message - message to be logged.
 * @returns {void}
 */
const testLogger = (message) => console.log(message);

describe('Unit Tests: menu-formatter.formatPizzaMenu for English', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for English ========'
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

  let hasOrdersAnsNo = true;

  let expected =
    'Our Pizza menu includes: Greek Pizza (Toppings: feta, spinach, and olives). Price (Small: $10, Medium: $13, Large: $16, Extra-large: $19). New York Pizza (Toppings: tomato sauce, and mozzarella cheese). Price (Small: $11, Medium: $13, Large: $17, Extra-large: $20). Vegetarian Pizza (Toppings: black olives, bell pepper, tomatoes, and mushrooms). Price (Small: $9, Medium: $12, Large: $15, Extra-large: $18). What type of pizza would you like?';

  test('expect the type of formatPizzaMenu to be function', () => {
    expect(typeof formatPizzaMenu).toBe('function');
  });

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('en-US', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Welcome to our Pizza Ordering Service. Our Pizza menu includes: Greek Pizza (Toppings: feta, spinach, and olives). Price (Small: $10, Medium: $13, Large: $16, Extra-large: $19). New York Pizza (Toppings: tomato sauce, and mozzarella cheese). Price (Small: $11, Medium: $13, Large: $17, Extra-large: $20). Vegetarian Pizza (Toppings: black olives, bell pepper, tomatoes, and mushrooms). Price (Small: $9, Medium: $12, Large: $15, Extra-large: $18). What type of pizza would you like?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('en-US', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  /** expect the function to throw an error for insupported languages */
  expect(() => {
    formatPizzaMenu('Ar-EU', menu.menuItems, hasOrdersAnsNo);
  }).toThrow('menu-formatter.formatMenu: unspported language...');
});

describe('Unit Tests: menu-formatter.formatPizzaMenu for Portuguese', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for Portuguese ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Grega',
        D: 'Coberturas: queijo feta, espinafre e azeitonas',
        P: [10, 13, 16, 19],
      },
      {
        T: 'Nova York',
        D: 'Coberturas: molho de tomate e queijo mussarela',
        P: [11, 13, 17, 20],
      },
      {
        T: 'Vegetariana',
        D: 'Coberturas: azeitonas pretas, pimentão, tomate e cogumelos',
        P: [9, 12, 15, 18],
      },
    ],
  };

  let hasOrdersAnsNo = true;

  let expected =
    'Nosso menu de pizza inclui: Grega Pizza (Coberturas: queijo feta, espinafre e azeitonas). Preço (Mini: $10, Média: $13, grande: $16, Extra-grande: $19). Nova York Pizza (Coberturas: molho de tomate e queijo mussarela). Preço (Mini: $11, Média: $13, grande: $17, Extra-grande: $20). Vegetariana Pizza (Coberturas: azeitonas pretas, pimentão, tomate e cogumelos). Preço (Mini: $9, Média: $12, grande: $15, Extra-grande: $18). Que tipo de pizze você gostaria?';

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('pt-BR', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Bem-vindo ao nosso serviço de pedidos de pizza. Nosso menu de pizza inclui: Grega Pizza (Coberturas: queijo feta, espinafre e azeitonas). Preço (Mini: $10, Média: $13, grande: $16, Extra-grande: $19). Nova York Pizza (Coberturas: molho de tomate e queijo mussarela). Preço (Mini: $11, Média: $13, grande: $17, Extra-grande: $20). Vegetariana Pizza (Coberturas: azeitonas pretas, pimentão, tomate e cogumelos). Preço (Mini: $9, Média: $12, grande: $15, Extra-grande: $18). Que tipo de pizze você gostaria?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('pt-BR', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });
});

describe('Unit Tests: menu-formatter.formatPizzaMenu for Spanish', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for Spanish ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Griega',
        D: 'Ingredientes: queso feta, espinacas y aceitunas pizza griega',
        P: [10, 13, 16, 19],
      },
      {
        T: 'Nueva York',
        D: 'Ingredientes: salsa de tomate y queso mozzarella',
        P: [11, 13, 17, 20],
      },
      {
        T: 'vegetariana',
        D:
          'Ingredientes: aceitunas negras, pimiento morrón, tomates y champiñones',
        P: [9, 12, 15, 18],
      },
    ],
  };

  let hasOrdersAnsNo = true;

  let expected =
    'Nuestro menú de Pizza incluye: Griega Pizza (Ingredientes: queso feta, espinacas y aceitunas pizza griega). Precio (Pequeña: 10 $, Mediana: 13 $, Grande: 16 $, Extra-grande: 19 $). Nueva York Pizza (Ingredientes: salsa de tomate y queso mozzarella). Precio (Pequeña: 11 $, Mediana: 13 $, Grande: 17 $, Extra-grande: 20 $). vegetariana Pizza (Ingredientes: aceitunas negras, pimiento morrón, tomates y champiñones). Precio (Pequeña: 9 $, Mediana: 12 $, Grande: 15 $, Extra-grande: 18 $). Que tipo de pizza te gustaria?';

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('es-US', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Bienvenido a nuestro servicio de pedidos de pizza. Nuestro menú de Pizza incluye: Griega Pizza (Ingredientes: queso feta, espinacas y aceitunas pizza griega). Precio (Pequeña: 10 $, Mediana: 13 $, Grande: 16 $, Extra-grande: 19 $). Nueva York Pizza (Ingredientes: salsa de tomate y queso mozzarella). Precio (Pequeña: 11 $, Mediana: 13 $, Grande: 17 $, Extra-grande: 20 $). vegetariana Pizza (Ingredientes: aceitunas negras, pimiento morrón, tomates y champiñones). Precio (Pequeña: 9 $, Mediana: 12 $, Grande: 15 $, Extra-grande: 18 $). Que tipo de pizza te gustaria?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('es-US', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });
});

describe('Unit Tests: menu-formatter.formatPizzaMenu for French', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for French ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Grecque',
        D: 'Garnitures: feta, épinards et olives',
        P: [10, 13, 16, 19],
      },
      {
        T: 'New York',
        D: 'Garnitures: sauce tomate et fromage mozzarella',
        P: [11, 13, 17, 20],
      },
      {
        T: 'végétarienne',
        D: 'Garnitures: olives noires, poivrons, tomates et champignons',
        P: [9, 12, 15, 18],
      },
    ],
  };

  let hasOrdersAnsNo = true;

  let expected =
    'Notre menu Pizza comprend: Pizza Grecque (Garnitures: feta, épinards et olives). Prix (Petit: 10$, Moyen: 13$, Grand: 16$, Très grand: 19$). Pizza New York (Garnitures: sauce tomate et fromage mozzarella). Prix (Petit: 11$, Moyen: 13$, Grand: 17$, Très grand: 20$). Pizza végétarienne (Garnitures: olives noires, poivrons, tomates et champignons). Prix (Petit: 9$, Moyen: 12$, Grand: 15$, Très grand: 18$). Quel type de pizza souhaitez-vous?';

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('fr-FR', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Bienvenue dans notre service de commande de pizza. Notre menu Pizza comprend: Pizza Grecque (Garnitures: feta, épinards et olives). Prix (Petit: 10$, Moyen: 13$, Grand: 16$, Très grand: 19$). Pizza New York (Garnitures: sauce tomate et fromage mozzarella). Prix (Petit: 11$, Moyen: 13$, Grand: 17$, Très grand: 20$). Pizza végétarienne (Garnitures: olives noires, poivrons, tomates et champignons). Prix (Petit: 9$, Moyen: 12$, Grand: 15$, Très grand: 18$). Quel type de pizza souhaitez-vous?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('fr-FR', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });
});

describe('Unit Tests: menu-formatter.formatPizzaMenu for Italian', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for Italian ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Greca',
        D: 'Condimenti: feta, spinaci e olive',
        P: [10, 13, 16, 19],
      },
      {
        T: 'New York',
        D: 'Condimenti: salsa di pomodoro e mozzarella',
        P: [11, 13, 17, 20],
      },
      {
        T: 'vegetariana',
        D: 'Condimenti: olive nere, peperone, pomodori e funghi',
        P: [9, 12, 15, 18],
      },
    ],
  };

  let hasOrdersAnsNo = true;

  let expected =
    'Il nostro menù Pizza comprende: Greca Pizza (Condimenti: feta, spinaci e olive). Prezzo (Piccola: $10, Media: $13, Grande: $16, Extra-grande: $19). New York Pizza (Condimenti: salsa di pomodoro e mozzarella). Prezzo (Piccola: $11, Media: $13, Grande: $17, Extra-grande: $20). vegetariana Pizza (Condimenti: olive nere, peperone, pomodori e funghi). Prezzo (Piccola: $9, Media: $12, Grande: $15, Extra-grande: $18). Che tipo di pizze vorresti?';

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('it-IT', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Benvenuti nel nostro servizio di ordinazione di pizze. Il nostro menù Pizza comprende: Greca Pizza (Condimenti: feta, spinaci e olive). Prezzo (Piccola: $10, Media: $13, Grande: $16, Extra-grande: $19). New York Pizza (Condimenti: salsa di pomodoro e mozzarella). Prezzo (Piccola: $11, Media: $13, Grande: $17, Extra-grande: $20). vegetariana Pizza (Condimenti: olive nere, peperone, pomodori e funghi). Prezzo (Piccola: $9, Media: $12, Grande: $15, Extra-grande: $18). Che tipo di pizze vorresti?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('it-IT', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });
});

describe('Unit Tests: menu-formatter.formatPizzaMenu for German', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for German ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Griechische',
        D: 'Belag: Feta, Spinat und Oliven',
        P: [10, 13, 16, 19],
      },
      {
        T: 'New Yorker',
        D: 'Belag: Tomatensauce und Mozzarella',
        P: [11, 13, 17, 20],
      },
      {
        T: 'Vegetarische',
        D: 'Belag: schwarze Oliven, Paprika, Tomaten und Pilze',
        P: [9, 12, 15, 18],
      },
    ],
  };

  let hasOrdersAnsNo = true;
  let expected =
    'Unsere Pizza-Speisekarte beinhaltet: Griechische Pizza (Belag: Feta, Spinat und Oliven). Preis (Kleine: $10, Mittlere: $13, Große: $16, Extra-große: $19). New Yorker Pizza (Belag: Tomatensauce und Mozzarella). Preis (Kleine: $11, Mittlere: $13, Große: $17, Extra-große: $20). Vegetarische Pizza (Belag: schwarze Oliven, Paprika, Tomaten und Pilze). Preis (Kleine: $9, Mittlere: $12, Große: $15, Extra-große: $18). Welche Art von Pizze möchten Sie?';

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('de-DE', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Willkommen bei unserem Pizza-Bestellservice. Unsere Pizza-Speisekarte beinhaltet: Griechische Pizza (Belag: Feta, Spinat und Oliven). Preis (Kleine: $10, Mittlere: $13, Große: $16, Extra-große: $19). New Yorker Pizza (Belag: Tomatensauce und Mozzarella). Preis (Kleine: $11, Mittlere: $13, Große: $17, Extra-große: $20). Vegetarische Pizza (Belag: schwarze Oliven, Paprika, Tomaten und Pilze). Preis (Kleine: $9, Mittlere: $12, Große: $15, Extra-große: $18). Welche Art von Pizze möchten Sie?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('de-DE', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });
});

describe('Unit Tests: menu-formatter.formatPizzaMenu for Russian', () => {
  beforeAll(() =>
    testLogger(
      '======== Running Unit Tests for valid-inputs.menu-formatter.formatPizzaMenu for Russian ========'
    )
  );

  const menu = {
    menuItems: [
      {
        T: 'Греческая',
        D: 'Начинки: фета, шпинат и оливки',
        P: [10, 13, 16, 19],
      },
      {
        T: 'Нью-йоркская',
        D: 'Начинки: томатный соус и сыр моцарелла',
        P: [11, 13, 17, 20],
      },
      {
        T: 'Вегетарианская',
        D: 'Начинки: маслины, болгарский перец, помидоры и грибы.',
        P: [9, 12, 15, 18],
      },
    ],
  };

  let hasOrdersAnsNo = true;
  let expected =
    'В нашем меню пиццы: Греческая Пицца (Начинки: фета, шпинат и оливки). Цена (Маленькая: $10, Средняя: $13, Большая: $16, Очень-большая: $19). Нью-йоркская Пицца (Начинки: томатный соус и сыр моцарелла). Цена (Маленькая: $11, Средняя: $13, Большая: $17, Очень-большая: $20). Вегетарианская Пицца (Начинки: маслины, болгарский перец, помидоры и грибы.). Цена (Маленькая: $9, Средняя: $12, Большая: $15, Очень-большая: $18). Какую пиццу вы хотите?';

  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('ru-RU', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });

  hasOrdersAnsNo = false;
  expected =
    'Добро пожаловать в нашу службу заказа пиццы. В нашем меню пиццы: Греческая Пицца (Начинки: фета, шпинат и оливки). Цена (Маленькая: $10, Средняя: $13, Большая: $16, Очень-большая: $19). Нью-йоркская Пицца (Начинки: томатный соус и сыр моцарелла). Цена (Маленькая: $11, Средняя: $13, Большая: $17, Очень-большая: $20). Вегетарианская Пицца (Начинки: маслины, болгарский перец, помидоры и грибы.). Цена (Маленькая: $9, Средняя: $12, Большая: $15, Очень-большая: $18). Какую пиццу вы хотите?';
  test('expect the correct format for the language', () => {
    expect(formatPizzaMenu('ru-RU', menu.menuItems, hasOrdersAnsNo)).toBe(
      expected
    );
  });
});
