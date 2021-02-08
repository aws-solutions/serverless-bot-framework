/*********************************************************************************************************************
 *  Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

import { Aws, Construct, Duration, CustomResource } from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';

export interface LexBotProps {
    readonly botName: string;
    readonly botLanguage: string;
    readonly childDirected: string;
    readonly botBrain: string;
}

export class LexCustomResource extends Construct {
  private CustomResource: CustomResource;

  public get BotId(): string {
    return this.CustomResource.getAttString('BotId');
  }

  public get BotAliasId(): string {
    return this.CustomResource.getAttString('BotAliasId');
  }

  constructor(scope: Construct, id: string, props: LexBotProps) {
    super(scope, id);

    const LexV2Role = new Role(this, 'LexV2Role', {
      assumedBy: new ServicePrincipal('lexv2.amazonaws.com'),
    });

    const helperFunction = buildLambdaFunction(this, {
      lambdaFunctionProps: {
        runtime: Runtime.PYTHON_3_8,
        handler: 'lambda_function.handler',
        description:
          'This function creates a Lex bot using AWS SDK (boto3).',
        code: Code.fromAsset('../services/lex-bot'),
        timeout: Duration.seconds(60),
        environment: {
          botName: props.botName,
          botLanguage: props.botLanguage,
          childDirected: props.childDirected,
          botRole: LexV2Role.roleArn,
          botBrain: props.botBrain,
        }
      },
    });

    /** Grant permission to the lambda function to create Lex Bot */
    helperFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:${Aws.PARTITION}:lex:${Aws.REGION}:${Aws.ACCOUNT_ID}:bot/*`,
          `arn:${Aws.PARTITION}:lex:${Aws.REGION}:${Aws.ACCOUNT_ID}:bot-alias/*`,
          LexV2Role.roleArn,
        ],
        actions: [
          'lex:CreateBot', 'lex:DeleteBot', 'lex:CreateBotVersion',
          'lex:CreateBotLocale', 'lex:CreateSlotType', 'lex:DescribeBot', 'lex:TagResource',
          'lex:DescribeBotLocale', 'lex:CreateSlot', 'lex:CreateIntent','lex:BuildBotLocale',
          'lex:UpdateIntent', 'lex:ListBotAliases', 'lex:DeleteBotLocale', 'lex:DeleteIntent',
          'lex:DeleteSlot', 'lex:DeleteBotVersion', 'lex:DeleteBotChannel', 'lex:DeleteSlotType',
          'iam:PassRole'
        ],
      })
    );

    this.CustomResource = new CustomResource(this, 'LexCustomResource', {
        serviceToken: helperFunction.functionArn,
        resourceType: 'Custom::LexBotCustomResource'
    });
  }

}
