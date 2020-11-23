/**********************************************************************************************************************
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
 *********************************************************************************************************************/

import { SynthUtils } from '@aws-cdk/assert';
import { Stack, Aws, Duration } from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { OrderPizzaLambdaDynamoDBTables } from '../lib/orderpizza-dynampdb-tables-construct';
import '@aws-cdk/assert/jest';

test('test OrderPizzaLambdaDynamoDBTables construct', () => {
  const stack = new Stack();

  new OrderPizzaLambdaDynamoDBTables(stack, 'OrderPizzaLambdaDynamoDB', {
    orderPizzaLambdaProps: {
      functionName: `${Aws.STACK_NAME}-OrderPizzaLambda`,
      description: 'Serverless-bot-framework OrderPizza Sample lambda',
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset('../samples/order-pizza'),
      handler: 'index.handler',
      timeout: Duration.minutes(5),
      memorySize: 128,
      environment: {
        PIZZA_MENUS_INITIALIZATION_BUCKET: 'brainBucket',
        PIZZA_MENUS_INITIALIZATION_FILE: 'pizza-menus/pizza-menu.json',
        PIZZA_MENU_ID: 'main_menu_1',
        PIZZA_ORDERS_GLOBAL_INDEX_NAME: 'customerId-orderTimestamp-index',
        RE_INITIALIZE_MENUS_TABLE: 'false',
      },
    },
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
