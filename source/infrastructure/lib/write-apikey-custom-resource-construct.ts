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
  CustomResource,
  Duration,
  CfnCondition,
  CfnCustomResource,
} from '@aws-cdk/core';
import { PolicyStatement, Effect, Policy, CfnPolicy } from '@aws-cdk/aws-iam';
import { CfnFunction, Code, Runtime } from '@aws-cdk/aws-lambda';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { CfnNagHelper } from './cfn-nag-helper';


export interface WriteApiKeyCustomResourceProps {
  readonly weatherAPIKey: string;
  readonly weatherAPIChosen: CfnCondition;
}

export class WriteApiKeyCustomResource extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: WriteApiKeyCustomResourceProps
  ) {
    super(scope, id);

    /** Build CustomResource Lambda */
    const writeApiKeyToSSMLambda = buildLambdaFunction(this, {
      lambdaFunctionProps: {
        description: 'Write APIKey to SSM',
        runtime: Runtime.PYTHON_3_8,
        handler: 'index.lambda_handler',
        timeout: Duration.minutes(3),
        code: Code.fromAsset('../samples/write-api-to-ssm-custom-resource'),
        memorySize: 128,
      },
    });

    /** Add permissions to SSM */
    const SSMPolicy = new Policy(this, 'SSMUpdate', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['ssm:PutParameter', 'ssm:DeleteParameter'],
          resources: [
            `arn:${Aws.PARTITION}:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/${Aws.STACK_NAME}-weather-api-key`,
          ],
        }),
      ],
    });

    /** Attach SSM Policy to the Lambda's Role */
    writeApiKeyToSSMLambda.role?.attachInlinePolicy(SSMPolicy); //NOSONAR it is a valid expression

    /** Create Custom resource */
    const customwriteApiKeyToSSM = new CustomResource(this, 'CreateBotConfig', {
      resourceType: 'Custom::WriteKey',
      serviceToken: writeApiKeyToSSMLambda.functionArn,
      properties: {
        APIKey: props.weatherAPIKey,
        SSMKeyNameAPI: `${Aws.STACK_NAME}-weather-api-key`,
      },
    });

    /** Add the WeatherAPIChosen Condition */
    (SSMPolicy.node.defaultChild as CfnPolicy).cfnOptions.condition =
      props.weatherAPIChosen;
    (writeApiKeyToSSMLambda.node
      .defaultChild as CfnFunction).cfnOptions.condition =
      props.weatherAPIChosen;
    (customwriteApiKeyToSSM.node
      .defaultChild as CfnCustomResource).cfnOptions.condition =
      props.weatherAPIChosen;

    /** Suppression for cfn nag W92 */
    const cfnFunction = writeApiKeyToSSMLambda.node.defaultChild as CfnFunction;
    CfnNagHelper.addSuppressions(cfnFunction, {
        Id: 'W92',
        Reason: 'This function does not need to have specified reserved concurrent executions'
    });
  }
}
