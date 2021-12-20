/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import {
  Aws,
  Construct,
  CfnCondition,
  Fn,
} from '@aws-cdk/core';
import { PolicyStatement, Effect, Policy, CfnPolicy } from '@aws-cdk/aws-iam';
import { Function } from '@aws-cdk/aws-lambda';

export interface WeatherForecastToSSMProps {
  readonly weatherAPIProvider: string;
  readonly weatherAPIChosen: CfnCondition;
  readonly weatherForecastLambda: Function;
}

export class WeatherForecastToSSM extends Construct {
  private readonly _weatherForecastLambda: Function;
  constructor(scope: Construct, id: string, props: WeatherForecastToSSMProps) {
    super(scope, id);

    /** Build WeatherForecast Lambda */
    this._weatherForecastLambda = props.weatherForecastLambda;

    /** Add environment variables to the lambda function */
    this._weatherForecastLambda.addEnvironment(
      'API_PROVIDER',
      Fn.conditionIf(
        props.weatherAPIChosen.logicalId,
        props.weatherAPIProvider,
        Aws.NO_VALUE
      ).toString()
    );
    this._weatherForecastLambda.addEnvironment(
      'SSM_REFERENCE_TO_API_KEY',
      Fn.conditionIf(
        props.weatherAPIChosen.logicalId,
        `${Aws.STACK_NAME}-weather-api-key`,
        Aws.NO_VALUE
      ).toString(),
    );

    /** Add permissions to SSM */
    const SSMPolicy = new Policy(this, 'SSMGet', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['ssm:GetParameter'],
          resources: [
            `arn:${Aws.PARTITION}:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/${Aws.STACK_NAME}-weather-api-key`,
          ],
        }),
      ],
    });

    /** Attach SSM Policy to the Lambda's Role */
    this._weatherForecastLambda.role?.attachInlinePolicy(SSMPolicy); //NOSONAR it is a valid expression

    /** Add the WeatherAPIChosen Condition */
    (SSMPolicy.node.defaultChild as CfnPolicy).cfnOptions.condition =
      props.weatherAPIChosen;
  }

  public get weatherForecastLambda(): Function {
    return this._weatherForecastLambda;
  }
}
