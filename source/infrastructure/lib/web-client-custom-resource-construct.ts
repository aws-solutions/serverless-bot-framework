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

import { Aws, Construct, CustomResource, Duration } from '@aws-cdk/core';
import { PolicyStatement, Effect, Policy } from '@aws-cdk/aws-iam';
import { Code, Runtime, CfnFunction } from '@aws-cdk/aws-lambda';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { CfnNagHelper } from './cfn-nag-helper';


export interface WebClientCustomResourceProps {
  readonly botApiUrl: string;
  readonly botApiStageName: string;
  readonly botApiId: string;
  readonly botName: string;
  readonly botLanguage: string;
  readonly botGender: string;
  readonly cognitoIdentityPool: string;
  readonly cognitoUserPoolId: string;
  readonly cognitoUserPoolClientId: string;
  readonly sampleWebClientBucketName: string;
  readonly sampleWebclientPackage: string;
}

export class WebClientCustomResource extends Construct {
  constructor(scope: Construct, id: string, props: WebClientCustomResourceProps) {
    super(scope, id);

    /** Create BotCustomResource Policy */
    const botCustomResourcePolicy = new Policy(this, 'WebClientCustomResourcePolicy', {
      policyName: 'WebClientCustomResource',
      statements: [
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
        description: 'Function to setup webclient files',
        runtime: Runtime.PYTHON_3_8,
        handler: 'lambda_function.handler',
        timeout: Duration.minutes(3),
        code: Code.fromAsset('../services/webclient-setup'),
        memorySize: 128,
      },
    });

    /** Attache CustomResource Policy to Lambda's role */
    customResourceLambda.role?.attachInlinePolicy(botCustomResourcePolicy); //NOSONAR it is a valid expression

    /** Create Custom resource */
    new CustomResource(this, 'CreateWebClientConfig', {
      resourceType: 'Custom::CreateWebClientConfig',
      serviceToken: customResourceLambda.functionArn,
      properties: {
        AwsRegion: Aws.REGION,
        ApiUri: props.botApiUrl,
        BotName: props.botName,
        BotLanguage: props.botLanguage,
        BotGender: props.botGender,
        SampleWebClientBucket: props.sampleWebClientBucketName,
        SampleWebclientPackage: props.sampleWebclientPackage,
        CognitoIdentityPool: props.cognitoIdentityPool,
        CognitoUserPoolId: props.cognitoUserPoolId,
        CognitoUserPoolClientId: props.cognitoUserPoolClientId,
      },
    });

    /** Suppression for cfn nag W92 */
    const cfnFunction = customResourceLambda.node.defaultChild as CfnFunction;
    CfnNagHelper.addSuppressions(cfnFunction, {
        Id: 'W92',
        Reason: 'This function does not need to have specified reserved concurrent executions'
    });

  }
}
