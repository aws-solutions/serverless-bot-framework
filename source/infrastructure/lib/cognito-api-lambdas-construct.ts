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

import { Construct, Aws } from '@aws-cdk/core';
import { Function } from '@aws-cdk/aws-lambda';
import { CfnAuthorizer, RestApi } from '@aws-cdk/aws-apigateway';
import {
  LambdaIntegration,
  PassthroughBehavior,
  Model,
} from '@aws-cdk/aws-apigateway';
import {
  AccountRecovery,
  CfnIdentityPoolRoleAttachment,
  UserPool,
  CfnUserPoolUser,
  UserPoolClient,
  CfnIdentityPool,
} from '@aws-cdk/aws-cognito';
import {
  Role,
  FederatedPrincipal,
  Policy,
  PolicyStatement,
  Effect,
  CfnPolicy,
} from '@aws-cdk/aws-iam';
import { buildIdentityPool } from '@aws-solutions-constructs/core';
import { CognitoToApiGatewayToLambda } from '@aws-solutions-constructs/aws-cognito-apigateway-lambda';

export interface CognitoApiLambdaProps {
  readonly coreLambda: Function;
  readonly pollyLambda: Function;
  readonly adminUserName: string;
  readonly adminEmail: string;
  readonly webClientDomainName: string;
}
export class CognitoApiLambda extends Construct {
  private readonly _botApi: RestApi;
  private readonly _botCognitoUserPool: UserPool;
  private readonly _botCognitoUserPoolClient: UserPoolClient;
  private readonly _botCognitoAuthorizer: CfnAuthorizer;
  private readonly _botCognitoIdentityPool: CfnIdentityPool;

  constructor(scope: Construct, id: string, props: CognitoApiLambdaProps) {
    super(scope, id);

    const botApi = new CognitoToApiGatewayToLambda(this, 'BotApi', {
      existingLambdaObj: props.coreLambda,
      apiGatewayProps: {
        proxy: false,
        restApiName: `${Aws.STACK_NAME}-API`,
        restApiId: 'Serverless-bot-framework ApiId',
        description:
          'Serverless-bot-framework API that exposes the chatbot functionalities',
      },
      cognitoUserPoolProps: {
        userInvitation: {
          emailSubject: 'Welcome to Serverless Bot Framework',
          emailBody: `
            <p>You are invited to join the Serverless Bot Framework Solution.</p>
            <p>Username: <strong>{username}</strong></p>
            <p>Password: <strong>{####}</strong></p>
            <p>Console: <strong>${props.webClientDomainName}/</strong></p>
          `,
          smsMessage:
            'Your username is {username} and temporary password is {####}.',
        },
        signInAliases: { username: true, email: true },
        autoVerify: { email: true },
        userVerification: {
          emailSubject:
            'Your Serverless Bot Framework console verification code',
          emailBody:
            'Your Serverless Bot Framework console verification code is {####}.',
          smsMessage:
            'Your Serverless Bot Framework console verification code is {####}.',
        },
        accountRecovery: AccountRecovery.EMAIL_ONLY,
        standardAttributes: { email: { required: true, mutable: false } },
      },
      cognitoUserPoolClientProps: {
        disableOAuth: true,
        supportedIdentityProviders: [],
      },
    });

    const identityPool = buildIdentityPool(
      this,
      botApi.userPool,
      botApi.userPoolClient,
      {
        allowUnauthenticatedIdentities: false,
      }
    );

    const cognitoAuthenticatedRole = new Role(
      this,
      'CognitoAuthenticatedRole',
      {
        assumedBy: new FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
      }
    );

    const authoridedPolicy = new Policy(this, 'CognitoAuthoridedPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['execute-api:Invoke'],
          resources: [
            `arn:${Aws.PARTITION}:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${botApi.apiGateway.restApiId}/${botApi.apiGateway.deploymentStage.stageName}/core`,
            `arn:${Aws.PARTITION}:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${botApi.apiGateway.restApiId}/${botApi.apiGateway.deploymentStage.stageName}/services/polly`,
          ],
        }),
      ],
    });

    authoridedPolicy.attachToRole(cognitoAuthenticatedRole);

    const cognitoUnAuthenticatedRole = new Role(
      this,
      'CognitoUnAuthenticatedRole',
      {
        assumedBy: new FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {},
          'sts:AssumeRoleWithWebIdentity'
        ),
      }
    );
    // attach Roles
    new CfnIdentityPoolRoleAttachment(
      this,
      'BotIdentityPoolRole',
      {
        identityPoolId: identityPool.ref,
        roles: {
          unauthenticated: cognitoUnAuthenticatedRole.roleArn,
          authenticated: cognitoAuthenticatedRole.roleArn,
        },
      }
    );

    // create Cognito UserPool user
    new CfnUserPoolUser(
      this,
      'BotCognitoUserPoolUser',
      {
        userPoolId: botApi.userPool.userPoolId,
        username: props.adminUserName,
        desiredDeliveryMediums: ['EMAIL'],
        forceAliasCreation: true,
        userAttributes: [
          { name: 'email', value: props.adminEmail },
          { name: 'nickname', value: props.adminUserName },
          { name: 'email_verified', value: 'True' },
        ],
      }
    );
    //create request integration
    const requestTemplate = `{
      "body": $input.json("$"),
      "userInfo": {
        "email": "$context.authorizer.claims.email",
        "sub": "$context.authorizer.claims.sub"
      }
    }`;
    const apiCorePOSTIntegration = new LambdaIntegration(props.coreLambda, {
      proxy: false,
      allowTestInvoke: false,
      requestTemplates: { 'application/json': requestTemplate },
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: { 'application/json': '' },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'", // NOSONAR enabling CORS to allow cloudfront url front-end call apigateway
          },
        },
      ],
    });

    const coreResource = botApi.apiGateway.root.addResource('core');

    const methodResponse = [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true, // NOSONAR enabling CORS to allow cloudfront url front-end call apigateway
        },
        responseModels: {
          'application/json': Model.EMPTY_MODEL,
        },
      },
    ];

    const coreOptions = {
      allowOrigins: ['*'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
      ],
    };

    coreResource.addMethod('POST', apiCorePOSTIntegration, {
      methodResponses: methodResponse,
    });
    //Add OPTIONS method
    coreResource.addCorsPreflight(coreOptions);

    const pollyResource = botApi.apiGateway.root
      .addResource('services')
      .addResource('polly');

    const apiPollyPOSTIntegration = new LambdaIntegration(props.pollyLambda, {
      proxy: false,
      allowTestInvoke: false,
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: { 'application/json': '' },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'", // NOSONAR enabling CORS to allow cloudfront url front-end call apigateway
          },
        },
      ],
    });

    pollyResource.addMethod('POST', apiPollyPOSTIntegration, {
      methodResponses: methodResponse,
    });

    //Add OPTIONS method
    pollyResource.addCorsPreflight(coreOptions);

    /** Apply the Cognito Authorizers on all API methods */
    botApi.addAuthorizers();

    /** Assign values to class members  */
    this._botApi = botApi.apiGateway;
    this._botCognitoUserPool = botApi.userPool;
    this._botCognitoUserPoolClient = botApi.userPoolClient;
    this._botCognitoAuthorizer = botApi.apiGatewayAuthorizer;
    this._botCognitoIdentityPool = identityPool;
  }

  public get botApi(): RestApi {
    return this._botApi;
  }

  public get botCognitoUserPoolClient(): UserPoolClient {
    return this._botCognitoUserPoolClient;
  }

  public get botCognitoUserPool(): UserPool {
    return this._botCognitoUserPool;
  }

  public get botCognitoAuthorizer(): CfnAuthorizer {
    return this._botCognitoAuthorizer;
  }

  public get botCognitoIdentityPool(): CfnIdentityPool {
    return this._botCognitoIdentityPool;
  }
}
