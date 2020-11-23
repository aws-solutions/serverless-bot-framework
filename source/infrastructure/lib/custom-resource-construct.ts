/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

import { Aws, Construct, CustomResource, Duration } from '@aws-cdk/core';
import { PolicyStatement, Effect, Policy } from '@aws-cdk/aws-iam';
import { Code, Runtime } from '@aws-cdk/aws-lambda';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';

export interface BotCustomResourceProps {
  readonly solutionId: string;
  readonly version: string;
  readonly UUID: string;
  readonly sendAnonymousUsageData: string;
  readonly botApiUrl: string;
  readonly botApiStageName: string;
  readonly botApiId: string;
  readonly botName: string;
  readonly botLanguage: string;
  readonly botGender: string;
  readonly brainBucketName: string;
  readonly conversationLogsTable: string;
  readonly entitiesTable: string;
  readonly contextTable: string;
  readonly cognitoIdentityPool: string;
  readonly cognitoUserPoolId: string;
  readonly cognitoUserPoolClientId: string;
  readonly trainModelArn: string;
  readonly sampleWebClientBucketName: string;
  readonly sampleWebclientPackage: string;
  readonly sampleLeaveFeedbackBotArn: string;
  readonly sampleWeatherForecastBotArn: string;
  readonly sampleOrderPizzaBotArn: string;
}

export class BotCustomResource extends Construct {
  constructor(scope: Construct, id: string, props: BotCustomResourceProps) {
    super(scope, id);

    /** Create BotCustomResource Policy */
    const botCustomResourcePolicy = new Policy(this, 'CustomResourcePolicy', {
      policyName: 'BotCustomResource',
      statements: [
        /** cloudformation permissions */
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['cloudformation:DescribeStacks'],
          resources: [
            `arn:aws:cloudformation:${Aws.REGION}:${Aws.ACCOUNT_ID}:stack/${Aws.STACK_NAME}/*`,
          ],
        }),
        /** Brain Bucket permissions */
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:ListBucket',
            's3:GetBucketLocation',
            's3:GetBucketNotification',
            's3:PutBucketNotification',
          ],
          resources: [`arn:aws:s3:::${props.brainBucketName}`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [`arn:aws:s3:::${props.brainBucketName}/*`],
        }),
        /** WebClient Bucket permissions */
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:ListBucket', 's3:GetBucketLocation'],
          resources: [`arn:aws:s3:::${props.sampleWebClientBucketName}`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [`arn:aws:s3:::${props.sampleWebClientBucketName}/*`],
        }),
        /** BotApi permissions */
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['apigateway:POST'],
          resources: [
            `arn:aws:apigateway:${Aws.REGION}::/restapis/${props.botApiId}/deployments`,
          ],
        }),
      ],
    });

    /** Build CustomResource Lambda */
    const customResourceLambda = buildLambdaFunction(this, {
      lambdaFunctionProps: {
        description: 'Function to configure Bot Files',
        runtime: Runtime.PYTHON_3_8,
        handler: 'index.lambda_handler',
        timeout: Duration.minutes(3),
        code: Code.fromAsset('../services/custom-resource'),
        memorySize: 128,
        environment: {
          SEND_ANONYMOUS_USAGE_DATA: props.sendAnonymousUsageData,
          SOLUTION_ID: props.solutionId,
          VERSION: props.version,
          UUID: props.UUID,
          REGION: Aws.REGION,
        },
      },
    });

    /** Attache CustomResource Policy to Lambda's role */
    customResourceLambda.role?.attachInlinePolicy(botCustomResourcePolicy);

    /** Create Custom resource */
    const customCreateBotConfig = new CustomResource(this, 'CreateBotConfig', {
      resourceType: 'Custom::CreateBotConfig',
      serviceToken: customResourceLambda.functionArn,
      properties: {
        AwsId: Aws.ACCOUNT_ID,
        AwsRegion: Aws.REGION,
        ApiUri: props.botApiUrl,
        ApiStageName: props.botApiStageName,
        ApiId: props.botApiId,
        BotName: props.botName,
        BotLanguage: props.botLanguage,
        BotGender: props.botGender,
        BrainBucket: props.brainBucketName,
        ConversationLogsTable: props.conversationLogsTable,
        EntitiesTable: props.entitiesTable,
        ContextTable: props.contextTable,
        SampleWebClientBucket: props.sampleWebClientBucketName,
        SampleWebclientPackage: props.sampleWebclientPackage,
        SampleLeaveFeedbackBotArn: props.sampleLeaveFeedbackBotArn,
        CognitoIdentityPool: props.cognitoIdentityPool,
        CognitoUserPoolId: props.cognitoUserPoolId,
        CognitoUserPoolClientId: props.cognitoUserPoolClientId,
        SampleWeatherForecastBotArn: props.sampleWeatherForecastBotArn,
        SampleOrderPizzaBotArn: props.sampleOrderPizzaBotArn,
        TrainModelArn: props.trainModelArn,
        StackName: Aws.STACK_NAME,
      },
    });
  }
}
