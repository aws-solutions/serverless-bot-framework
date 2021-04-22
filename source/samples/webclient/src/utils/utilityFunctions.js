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

import { API, Auth } from 'aws-amplify';
declare var awsConfig;

export function extractResponse(responseData) {
    if (responseData.text) {
        return responseData.text;
    } else if (responseData.conversation.sync) {
        return responseData.conversation.sync.city.ask.text;
    } else if (responseData.conversation.async) {
        return responseData.conversation.async.ask.text;
    }
}

export function constructRequest(responseData, userInput) {
    let request = {};
    if (Object.keys(responseData).length === 0 || responseData.text) { //test if last response is empty (first resquest)
        request = {
            text: userInput,
            pollyOnServer: true,
            lang: awsConfig.language,
        };
    } else if (responseData.conversation.sync) { // following requests after the first
        request = {
            pollyOnServer: true,
            lang: awsConfig.language,
            _id: responseData.conversation._id,
            rawIntent: responseData.rawIntent,
            entities: [],
            payload: {
                [Object.keys(responseData.conversation.sync)[0]]: {
                    response: userInput
                }
            }
        }
    } else if (responseData.conversation.async) {
        if(responseData.conversation.async.endConversation) {
            request = {
                text: userInput,
                pollyOnServer: true,
                lang: awsConfig.language,
            };
        } else {
            request = {
                pollyOnServer: true,
                lang: awsConfig.language,
                _id: responseData.conversation._id,
                rawIntent: responseData.rawIntent,
                entities: [],
                payload: {
                    ...responseData.conversation.async.payload,
                    [responseData.conversation.async.id]: {
                        response: userInput
                    }
                }
            };
        }
    }

    return request;
}

export function scrollToBottom(){
    let chatSpace = document.getElementsByClassName('chat-space')[0];
    chatSpace.scrollTop = chatSpace.scrollHeight;
}

export async function textToSpeech(text) {
    let params = {
        headers: { Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` },
        body: {
            text: text,
            voice: awsConfig.botVoice,
            lang: awsConfig.language
        }
    }
    const botName = awsConfig.API.endpoints[0].name;
    const response = await API.post(botName, 'services/polly/', params);
    const audioCtx = new AudioContext();
    const bufferSource = audioCtx.createBufferSource();
    const audioBuffer = new Uint8Array(response.data).buffer;
    bufferSource.buffer = await audioCtx.decodeAudioData(audioBuffer);
    bufferSource.connect(audioCtx.destination);
    bufferSource.start();
}