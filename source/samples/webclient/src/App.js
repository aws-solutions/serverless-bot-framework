 /*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           
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
import './App.css';
import Banner from './components/Banner';
import ChatSpace from './components/ChatSpace';
import Amplify from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';

declare var awsConfig;
Amplify.configure(awsConfig);

function App() {
  return (
    <div className="App">
      <Banner />
      <ChatSpace />
    </div>
  );
}

export default withAuthenticator(App,{includeGreetings: true});
