 /*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

var awsConfig = {
    Auth: {

        // OPTIONAL - Amazon Cognito User Pool ID
        // userPoolId: 'us-east-2_iPt7EDs4O',
        userPoolId: "%%COGNITO_USER_POOL_ID%%",

        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        // userPoolWebClientId: '2f52skhif0qno07lvlfqu97fr4',
        userPoolWebClientId: "%%COGNITO_USER_POOL_CLIENT_ID%%",

        // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
        mandatorySignIn: true,

        // REQUIRED - Amazon Cognito Region
        region: "%%AWS_REGION%%",
    },
    API: {
      endpoints: [
        {
            name: "%%BOT_NAME%%",
            endpoint: "%%API_URI%%"

        }
      ]
    },
    language: "%%LANGUAGE_TAG%%",
    botVoice: "%%BOT_VOICE%%",
    cognitoIdentityPool: "%%COGNITO_IDENTITY_POOL%%",
    clientMetadata: { customUserAgent: "AwsSolution/SOL0027/1.6.0" },
};
