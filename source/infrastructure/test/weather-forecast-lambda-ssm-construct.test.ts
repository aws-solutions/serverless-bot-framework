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
import { Stack, CfnCondition, Fn } from '@aws-cdk/core';
import { WeatherForecastToSSM } from '../lib/weather-forecast-lambda-ssm-construct';
import '@aws-cdk/assert/jest';

test('test WeatherForecastToSSM construct', () => {
  const stack = new Stack();

  /** Create Condition for WeatherAPIChosen*/
  const weatherAPIChosen = new CfnCondition(stack, 'WeatherAPIChosen', {
    expression: Fn.conditionNot(
      Fn.conditionEquals('weatherAPIProvider', 'Random Weather Generator')
    ),
  });
  new WeatherForecastToSSM(stack, 'WeatherForecastLambda', {
    weatherAPIKey: 'weatherAPIKey',
    weatherAPIChosen: weatherAPIChosen,
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
