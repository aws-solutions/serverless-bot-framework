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

import React from 'react';
import { API, Auth } from 'aws-amplify';
import { extractResponse, constructRequest, scrollToBottom, textToSpeech } from '../utils/utilityFunctions';
declare var awsConfig;


class ChatSpace extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            lastResponse: {},
        };
        this.input = React.createRef();
        this.myFunction = this.myFunction.bind(this);
    }

    // function to process user's input
    async myFunction (event) {
        event.preventDefault();
        if(this.input.current.value) {
            let newState = {messages: [...this.state.messages, {request: this.input.current.value, response: '...'}]}
            let index=this.state.messages.length;
            let requestData = constructRequest(this.state.lastResponse, this.input.current.value);
            this.setState(newState);
            this.input.current.value = '';
            // call API asyncronously
            let params = {
                headers: { Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` },
                body: requestData
            }
            const botName = awsConfig.API.endpoints[0].name;
            const response = await API.post(botName, 'core/', params);
            let currentState = this.state;
            currentState.messages[index].response = response ? extractResponse(response) : "Error!";
            await textToSpeech(currentState.messages[index].response);
            currentState.lastResponse = response ? response : {};
            this.setState(currentState);
        }
    }

    // function to put request and response html elements on the page
    showConversation(messages) {
        let items = [];
        for (let item=0; item < messages.length; item++) {
            let {request, response} = messages[item];
            items.push(<div className="chat-space--message" key={item.toString() + 'request'}>{request}</div>);
            items.push(<div className="chat-space--response" key={item.toString() + 'response'}>{response}</div>);
        }
        return items;
    }

    // after user input scroll to the bottom so that user can see the response
    componentDidUpdate() {
        scrollToBottom();
    }

    render () {
        let {messages} = this.state;
        return (
            <div className="chat-container">
                <div className="chat-space">
                    {this.showConversation(messages)}
                </div>
                <form className="textbox" id="chat-form" onSubmit={this.myFunction}>
                    <input id='message' className="textbox--input" type='text' placeholder='Type your chatbot command here. E.g, help' ref={this.input}/>
                    <input type='submit' className="textbox--send" id="chat-send" value='Send'/>
                </form>
            </div>
        )
    }
}

export default ChatSpace;