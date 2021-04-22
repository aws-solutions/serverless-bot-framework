/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
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
import { Aws, Duration, Stack, CfnCondition, Fn } from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { WeatherForecastToSSM } from '../lib/weather-forecast-lambda-ssm-construct';
import { LexLambdaDynamoDBTable } from '../lib/lexlambda-dynamodb-table-construct';
import '@aws-cdk/assert/jest';

test('test WeatherForecastToSSM construct', () => {
  const stack = new Stack();

  /** Create Condition for WeatherAPIChosen*/
  const weatherAPIChosen = new CfnCondition(stack, 'WeatherAPIChosen', {
    expression: Fn.conditionNot(
      Fn.conditionEquals('weatherAPIProvider', 'Random Weather Generator')
    ),
  });
  ;
  const lexLambda = new LexLambdaDynamoDBTable(stack, 'LexLambdaDynamoDB', {
    lexLambdaProps: {
      functionName: `${Aws.STACK_NAME}-LexLambda`,
      description: 'Serverless-bot-framework Lex Sample lambda',
      runtime: Runtime.PYTHON_3_8,
      code: Code.fromAsset('../samples/lex-lambdas'),
      handler: 'index.handler',
      timeout: Duration.minutes(5),
    },
  }).lexLambda;
  new WeatherForecastToSSM(stack, 'WeatherForecastLambda', {
    weatherAPIProvider: 'Random Weather Generator',
    weatherAPIChosen: weatherAPIChosen,
    weatherForecastLambda: lexLambda
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
