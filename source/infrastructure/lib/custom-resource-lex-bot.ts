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

import { Aws, Construct, Duration, CustomResource } from '@aws-cdk/core';
import { Runtime, Code, CfnFunction } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { CfnNagHelper } from './cfn-nag-helper';

export interface LexBotProps {
    readonly botName: string;
    readonly botLanguage: string;
    readonly childDirected: string;
    readonly lexLambdaARN: string;
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
          lexLambdaARN: props.lexLambdaARN,
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
          'lex:CreateBot', 'lex:CreateBotVersion', 'lex:CreateBotLocale', 'lex:CreateSlotType',
          'lex:CreateSlot', 'lex:CreateIntent',
          'lex:DeleteBot', 'lex:DeleteBotLocale', 'lex:DeleteIntent', 'lex:DeleteSlot',
          'lex:DeleteBotVersion', 'lex:DeleteBotChannel', 'lex:DeleteSlotType',
          'lex:DescribeBot', 'lex:DescribeBotLocale',
          'lex:UpdateIntent', 'lex:UpdateBotAlias',
          'lex:ListBotAliases',
          'lex:TagResource',
          'lex:BuildBotLocale',
          'iam:PassRole'
        ],
      })
    );
    helperFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          /** ListBots requires service level permission for lex hence the
           * lex:region:accoun:* specified for resource. It is separated from
           * the rest of Lex actions to prevent service level permission for
           * other Lex actions.
           */
          `arn:${Aws.PARTITION}:lex:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`,
        ],
        actions:['lex:ListBots']
      })
    );

    /** Grant permission to the lex bot to invoke feedback lambda function */
    LexV2Role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [props.lexLambdaARN],
        actions: ['lambda:InvokeFunction']
      })
    )

    this.CustomResource = new CustomResource(this, 'LexCustomResource', {
        serviceToken: helperFunction.functionArn,
        resourceType: 'Custom::LexBotCustomResource',
        properties: {
          botLanguage: props.botLanguage,
          botName: props.botName,
          childDirected: props.childDirected,
        }
    });

    /** Suppression for cfn nag W92 */
    const cfnFunction = helperFunction.node.defaultChild as CfnFunction;
    CfnNagHelper.addSuppressions(cfnFunction, {
        Id: 'W92',
        Reason: 'This function does not need to have specified reserved concurrent executions'
    });
  }

}
