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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../logo.png';
import mic from '../mic_c.png';

declare var awsConfig;

class Banner extends React.Component {
    constructor(props) {
        super(props);

        this.myFunction = this.myFunction.bind(this);
    }

    myFunction() {
        if (!window.webkitSpeechRecognition) {
            toast.info("Your browser doesn't support voice to speech API",
              {
                position: "top-center",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              }
            );
          } else {
            var recognition = new window.webkitSpeechRecognition();
            recognition.lang = awsConfig.language;
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.start();
            recognition.onresult = function(event) {
              let final_transcript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  final_transcript += event.results[i][0].transcript;
                  recognition.stop();
                }
              }
              document.getElementById('message').value = final_transcript;
              document.getElementById('chat-send').click();
            };

          }
    }

    render() {
        return (
            <div className='banner'>
                <span className='banner--logo'><img src={logo} alt={'logo'}/></span>
                <span className='banner--mic-container' onClick={this.myFunction}> <img className='banner--mic-image' src={mic} alt={'mic'}/></span>
                <button className='banner--language'>{awsConfig.language}</button>
                <ToastContainer />
            </div>
        )
    }
}

export default Banner;