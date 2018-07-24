function require(script, callback) {
  jQuery.ajax({
      url: script,
      dataType: "script",
      async: false,
      success: function () {
          if (callback) {
            callback();
          }
      },
      error: function () {
          throw new Error("Could not load script " + script);
      }
  });
}

var JaoClient = function () {}

var recognition = undefined;
var jaoClient   = undefined;
var piscar      = true;
var context;    // Audio context
var buf;        // Audio buffer
var source;
var sessionID;
var UID;
var conversation = undefined;
var router = undefined;
var response = undefined;
var totalRetry = 0;
var pollyOnServer = true;
var entities = undefined;
var youtube_api_ready;
var voice = "Ricardo";

var callbacks   = {}
var commands    = {}
var richObjects = {}

JaoClient.prototype = {
  init: function(params, callback) {
    require("resources/js/config.js", function(){
      jaoClient.registerCoreCommands(function(){
        if (callback) {
          callback(jaoClient);
        }
      });
    });
  },
  getInstance: function() {
    return this;
  },
  extend: function (property, obj) {
    var objAtual = jaoClient[property];
    var merged = Object.assign(objAtual, obj);
    jaoClient[property] = merged;
  },
  registerCallback: function (id, callback) {
    callbacks[id] = callback;
  },
  registerCommand: function (id, command) {
    commands[id] = command;
  },
  runCallback: function (id, params) {
    if (callbacks[id]) {
      if (params != undefined) {
        callbacks[id](params);
      } else {
        callbacks[id]();
      }
    }
  },
  registerCoreCommands: function (callback) {
    this.registerCommand("stopBlink", function () {
      piscar = false;
    });

    this.registerCommand("cleanScreen", function () {
      jQuery("#conversation").html("");
    });

    this.registerCommand("ajuda", function () {
      jaoClient.jaoCoreRequest("ajuda");
    });

    if (callback) {
      callback();
    }
  },
  registerRichObjects: function (id, richObject) {
    richObjects[id] = richObject;
  }
};

JaoClient.prototype.utils = {
  replaceAll: function (str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  },
  base64ToUint: function(b64Encoded) {
      var string = new Uint8Array(atob(b64Encoded).split("").map(function(c) {return c.charCodeAt(0); }));
      return new Uint8Array(string);
  },
  uintToBase64: function(uint) {
    return btoa(uint);
  }
};

JaoClient.prototype.ui = {
  appendRichObject: function (richObj, callback) {
    var span = jQuery("<span class=\"label label-default\"></span>").append(richObj);
    var obj = jQuery("<div class=\"step to\"></div>").append(span);
    $("#conversation").append(obj);
    this.updateScroll();

    if (callback) {
      callback();
    }
  },
  fromCustomer: function (text, callback) {
    var obj = "<div class=\"step from\"><span class=\"label label-default\">" + text + "</span></div>";
    $("#conversation").append(obj);
    var objWait = "<div class=\"step to\"><span class=\"label label-default\"> ..... </span></div>";
    $("#conversation").append(objWait);
    this.updateScroll();
    if (callback) {
      callback();
    }
  },
  fromCore: function (text, callback) {
    jQuery("div.step:last").find("span:contains(' ..... ')").html(text);
    this.updateScroll();

    if (callback) {
      callback();
    }
  },
  directFromCore: function (text, callback) {
    var totalEncontrado = jQuery("div.step:last").find("span:contains(' ..... ')");

    if(totalEncontrado.length == 0) {
      var objWait = "<div class=\"step to\"><span class=\"label label-default\"> ..... </span></div>";
      $("#conversation").append(objWait);
    }

    jQuery("div.step:last").find("span:contains(' ..... ')").html(text);
    this.updateScroll();

    if (callback) {
      callback();
    }
  },
  errorMessage: function (text, callback) {
  },
  message: function (text, callback) {
  },
  blink: function () {
    if (piscar) {
      jQuery("#eyes").css("height", "13px");
      jQuery("#eyes").css("margin-top", "30px");

      setTimeout(function(){
        jQuery("#eyes").css("height", "23px");
        jQuery("#eyes").css("margin-top", "20px");
      }, 200);

      // Next Item
      var tempo = Math.floor((Math.random() * 10000) + 1000);

      setTimeout(function(){
        jaoClient.ui.blink();
      }, tempo);
    }
  },
  updateScroll: function (){
    $("#conversation").animate({ scrollTop: $('#conversation').prop("scrollHeight") + 110}, 1000);
  },
  startPlaying: function () {
    if (callbacks["stt.startPlaying"]) {
      callbacks["stt.startPlaying"];
    }
  },
  stopPlaying: function () {
    if (callbacks["stt.stopPlaying"]) {
      callbacks["stt.stopPlaying"];
    }
  }
};

JaoClient.prototype.jaoCoreRequest = function (textRec, callback) {

  AWS.config.region = clientConfig.region;

  if (clientConfig.cognitoIdentityPool !== "") {
    var cognitoidentity = new AWS.CognitoIdentity();
    var params = {
      IdentityPoolId: clientConfig.cognitoIdentityPool
    };

    cognitoidentity.getId(params, function(err, data) {
      if (err) console.log(err, err.stack);

      var params = {
        IdentityId: data.IdentityId
      };

      cognitoidentity.getCredentialsForIdentity(params, function(err, data) {
        if (err) console.log(err, err.stack);

        var apigClient = apigClientFactory.newClient({
          accessKey: data.Credentials.AccessKeyId,
          secretKey: data.Credentials.SecretKey,
          sessionToken: data.Credentials.SessionToken,
          apiKey: clientConfig.xapikey,
          region: clientConfig.region
        });

        var params = {
        };
        var body = {
          "text": textRec.toLowerCase(),
          "pollyOnServer": pollyOnServer,
          "sessionID": sessionID,
          "lang": clientConfig.language
        };

        apigClient.corePost(params, body).then(function(result) {
          jaoClient.evalResponse(result.data, callback);
        }).catch(function(result) {
          console.log(result);
        });
      })
    });

  } else {
    var apigClient = apigClientFactory.newClient({
      apiKey: clientConfig.xapikey,
      region: clientConfig.region
    });

    var params = {
    };
    var body = {
      "text": textRec.toLowerCase(),
      "pollyOnServer": pollyOnServer,
      "sessionID": sessionID,
      "lang": clientConfig.language
    };

    apigClient.corePost(params, body).then(function(result) {
      jaoClient.evalResponse(result.data, callback);
    }).catch(function(result) {
      console.log(result);
    });
  }

};

JaoClient.prototype.isAnotherIntent = function (textoReconhecido, callback) {
  if (callback) {
    callback(false);
  }
}

JaoClient.prototype.jaoDirectCoreRequest = function (_id, payload, rawIntent, callback) {

  AWS.config.region = clientConfig.region;

  if (clientConfig.cognitoIdentityPool !== "") {
    var cognitoidentity = new AWS.CognitoIdentity();
    var params = {
      IdentityPoolId: clientConfig.cognitoIdentityPool
    };

    cognitoidentity.getId(params, function(err, data) {
      if (err) console.log(err, err.stack);

      var params = {
        IdentityId: data.IdentityId
      };

      cognitoidentity.getCredentialsForIdentity(params, function(err, data) {
        if (err) console.log(err, err.stack);

        var apigClient = apigClientFactory.newClient({
          accessKey: data.Credentials.AccessKeyId,
          secretKey: data.Credentials.SecretKey,
          sessionToken: data.Credentials.SessionToken,
          apiKey: clientConfig.xapikey,
          region: clientConfig.region
        });

        var params = {
        };
        var body = {
          "_id": _id,
          "pollyOnServer": pollyOnServer,
          "sessionID": sessionID,
          "payload": payload,
          "lang": clientConfig.language,
          "rawIntent": rawIntent,
          "entities": entities
        };

        apigClient.corePost(params, body).then(function(result) {
          jaoClient.evalResponse(result.data, callback);
        }).catch(function(result) {
          console.log(result);
        });
      })
    });

  } else {
    var apigClient = apigClientFactory.newClient({
      apiKey: clientConfig.xapikey,
      region: clientConfig.region
    });

    var params = {
    };
    var body = {
      "_id": _id,
      "pollyOnServer": pollyOnServer,
      "sessionID": sessionID,
      "payload": payload,
      "lang": clientConfig.language,
      "rawIntent": rawIntent,
      "entities": entities
    };

    apigClient.corePost(params, body).then(function(result) {
      jaoClient.evalResponse(result.data, callback);
    }).catch(function(result) {
      console.log(result);
    });
  }

};

JaoClient.prototype.trataInputSilent = function (textoRec, callback) {
  if (conversation) {
    jaoClient.stt.stop();

    if (conversation.sync) {
      console.log("Calling flowPayloadSync...");
      jaoClient.conversation.flowPayloadSync(textoRec);
    } else {
      console.log("Calling flowPayloadAsync...");
      jaoClient.conversation.flowPayloadAsync(textoRec);
    }
  } else {
    jaoClient.jaoCoreRequest(textoRec);
    jaoClient.stt.stop();
  }
}

JaoClient.prototype.trataInput = function (textoRec, callback) {
  if (conversation) {
    jaoClient.stt.stop();

    console.log("Conversation Text Recognized: " + textoRec);
    jaoClient.ui.fromCustomer(textoRec);

    if (conversation.sync) {
      console.log("Calling flowPayloadSync...");
      jaoClient.conversation.flowPayloadSync(textoRec);
    } else {
      console.log("Calling flowPayloadAsync...");
      jaoClient.conversation.flowPayloadAsync(textoRec);
    }
  } else {
    console.log("Text Recognized: " + textoRec);
    jaoClient.ui.fromCustomer(textoRec);

    jaoClient.jaoCoreRequest(textoRec);
    jaoClient.stt.stop();
  }
}

JaoClient.prototype.services = {
  polly: function (text, callback) {

    AWS.config.region = clientConfig.region;

    if (clientConfig.cognitoIdentityPool !== "") {
      var cognitoidentity = new AWS.CognitoIdentity();
      var params = {
        IdentityPoolId: clientConfig.cognitoIdentityPool
      };

      cognitoidentity.getId(params, function(err, data) {
        if (err) console.log(err, err.stack);

        var params = {
          IdentityId: data.IdentityId
        };

        cognitoidentity.getCredentialsForIdentity(params, function(err, data) {
          if (err) console.log(err, err.stack);

          var apigClient = apigClientFactory.newClient({
            accessKey: data.Credentials.AccessKeyId,
            secretKey: data.Credentials.SecretKey,
            sessionToken: data.Credentials.SessionToken,
            apiKey: clientConfig.xapikey,
            region: clientConfig.region
          });

          var params = {
          };
          var body = {
            "text": text,
            "voice": clientConfig.voice,
            "lang": clientConfig.language
          }

          apigClient.servicesPollyPost(params, body).then(function(result) {

            console.log("Return from Polly: " + JSON.stringify(result.data));
            if (callback) {
              callback(result.data);
            }

          }).catch(function(result) {
            console.log(result);
          });
        })
      });

    } else {
      var apigClient = apigClientFactory.newClient({
        apiKey: clientConfig.xapikey,
        region: clientConfig.region
      });

      var params = {
      };
      var body = {
        "text": text,
        "voice": clientConfig.voice,
        "lang": clientConfig.language
      }

      apigClient.servicesPollyPost(params, body).then(function(result) {

        console.log("Return from Polly: " + JSON.stringify(result.data));
        if (callback) {
          callback(result.data);
        }

      }).catch(function(result) {
        console.log(result);
      });
    }

  }
}

JaoClient.prototype.printAndSpeak = function (ask, callback) {
  console.log("pollyOnServer ? " + pollyOnServer);
  console.log("Using Callback: " + callback);

  if (pollyOnServer) {
    jaoClient.services.polly(ask.speech, function(data){
      var print = ask.text;

      jaoClient.ui.directFromCore(print, function(){
          var voice = jaoClient.utils.base64ToUint(data.binary);
          jaoClient.audioSupport.addToQueue(voice, callback);
      });
    });
  } else {
      var print = ask.text;
      jaoClient.ui.directFromCore(print, callback);
  }
};

JaoClient.prototype.evalRouter = function (data, callback) {
  // Check Route Engine
  if (router.mode === "silent") {
    var commandID = router.commandID;
    jaoClient.jaoDirectCoreRequest(commandID, {"last_uid": data.uid, "lastParsedIntent": data.parsedIntent}, data.rawIntent);
  } else if (router.mode === "text") {
    var ask    = {};
    ask.text   = router.text;
    ask.speech = router.speech;

    jaoClient.printAndSpeak(ask, function(){
      var commandID = router.commandID;
      jaoClient.jaoDirectCoreRequest(commandID, {"last_uid": data.uid, "lastParsedIntent": data.parsedIntent}, data.rawIntent);
    });
  }
};

JaoClient.prototype.evalNIFResponse = function (data, callback) {
    if (data.nif) {
      console.log("evalNIFResponse: " + JSON.stringify(data));

      if (data.router !== undefined) {
        router = data.router;
        jaoClient.evalRouter(data, callback);
      } else {
        if (pollyOnServer) {
          if (data.binary != undefined) {
            var obj = jaoClient.utils.base64ToUint(data.binary);
            jaoClient.audioSupport.addToQueue(obj);
          }
        }
        if (data.text != undefined) {
          var imprimir = data.text;
          jaoClient.ui.fromCore(imprimir);
        }

        var richObject = data.richResponseObject;

        if (richObject != undefined) {
          if (richObjects[richObject.type]) {
            richObjects[richObject.type](richObject);
          }
        }

        // Eval commands
        if (commands[data.command]) {
          try {
            commands[data.command](data);
          } catch (e) {console.log(e);}
        }

        if (callback) {
          callback(data);
        }
      }
    } else {
      if (pollyOnServer) {
        if (data.binary != undefined) {
          var obj = jaoClient.utils.base64ToUint(data.binary);
          jaoClient.audioSupport.addToQueue(obj);
        }
      } else {
        if (data.text != undefined) {
          var imprimir = data.text;
          jaoClient.ui.fromCore(imprimir);
        }
      }

      if (callback) {
        callback(data);
      }
    }
};

JaoClient.prototype.evalResponse = function (data, callback) {
  console.log("Evaluating Response: " + JSON.stringify(data, '', 3));

  if (data.voice !== undefined) {
    voice = data.voice;
  }

  if ((data == null) || (data.errorMessage != null) || (data.nif == true)) {
    jaoClient.evalNIFResponse(data, callback);
  } else {
    sessionID = data.sessionID;
    UID       = data.uid;
    entities  = data.entities;

    if (data.conversation != undefined) {
      if (data.conversation.sync != undefined) {
        console.log("Evaluating Response => Conversation Sync.");
        jaoClient.conversation.startFlowSync(data);
      }
      if (data.conversation.async != undefined) {
        console.log("Evaluating Response => Conversation Async.");
        if (data.conversation.async.endConversation) {
          conversation = data.conversation;
          console.log("Evaluating Response => Ending Conversation Async.");
          var ask = conversation.async.ask;
          console.log("Evaluating Response => ASK: " + JSON.stringify(ask, '', 3));
          var history = conversation.async.history;
          console.log("Evaluating Response => History: " + JSON.stringify(ask, '', 3));

          var endConversationFlow = function (){
            if (data.router !== undefined) {
              router = data.router;
              jaoClient.evalRouter(data, callback);
            } else {
              var richObject = conversation.async.richResponseObject;

              if (richObject != undefined) {
                if (richObjects[richObject.type]) {
                  richObjects[richObject.type](richObject);
                }
              }

              if (commands[conversation.async.command]) {
                try {
                  commands[conversation.async.command](data);
                } catch (e) {console.log(e);}
              }
            }

            console.log("Ending conversation...");
            conversation = undefined;
            entities     = undefined;
            UID          = undefined;
            response     = undefined;
          };

          if (ask !== undefined) {
            jaoClient.printAndSpeak(ask, endConversationFlow);
          }

          if (history !== undefined) {
            jaoClient.history.start(data, endConversationFlow);
          }
        } else {
          jaoClient.conversation.startFlowAsync(data);
        }
      }
    } else if (data.history != undefined) {
      console.log("Evaluating Response => History Type");
      jaoClient.history.start(data);
    } else {
      if (data.binary !== undefined) {
        var obj = jaoClient.utils.base64ToUint(data.binary);
        jaoClient.audioSupport.addToQueue(obj);

        if (data.text != undefined) {
          var imprimir = data.text;
          jaoClient.ui.directFromCore(imprimir);
        }
      } else {
        if (data.text != undefined) {
          var imprimir = data.text;
          jaoClient.ui.directFromCore(imprimir);
        }
      }

      if (data.router !== undefined) {
        router = data.router;
        jaoClient.evalRouter(data, callback);
      } else {
        var richObject = data.richResponseObject;

        if (richObject != undefined) {
          if (richObjects[richObject.type]) {
            richObjects[richObject.type](richObject);
          }
        }

        // Eval commands
        if (commands[data.command]) {
          try {
            commands[data.command](data);
          } catch (e) {console.log(e);}
        }

        if (callback) {
          callback(data);
        }
      }
    }
  }
};

JaoClient.prototype.conversation = {
  startFlowAsync: function (data) {
    conversation = data.conversation;
    var ask = conversation.async.ask;

    jaoClient.printAndSpeak(ask, function(){
      var richObject = conversation.async.richResponseObject;

      if (richObject != undefined) {
        if (richObjects[richObject.type]) {
          richObjects[richObject.type](richObject);
        }
      }

      if (conversation.async.goToNode != undefined) {
        var nodeID = conversation.async.goToNode.id;
        jaoClient.trataInputSilent("goto:" + nodeID);
      }

      if (commands[conversation.async.command]) {
        try {
          commands[conversation.async.command](data);
        } catch (e) {console.log(e);}
      }
    });
  },
  startFlowSync: function (data) {
    var keys = Object.keys(data.conversation.sync);
    var total = keys.length;

    console.log("Total Steps: " + total);
    console.log(JSON.stringify(data));

    conversation = {
      "_id": data.conversation._id,
      "asks": data.conversation.sync,
      "generateReturn": data.conversation.generateReturn,
      "total": total,
      "sync": true,
      "step": 0,
      "payload": {},
      "rawIntent": data.rawIntent
    }

    var i = keys[conversation.step];
    this.flowStepSync(conversation.step, conversation.asks[i].ask);
  },
  flowPayloadAsync: function (resposta) {
    var payload = {};

    if (conversation.async.payload != undefined) {
      payload = conversation.async.payload;
    }

    var id = conversation.async.id;
    payload[id] = {
      "response": resposta
    }

    conversation.payload = payload;

    jaoClient.jaoDirectCoreRequest(conversation._id, conversation.payload, conversation.rawIntent, function(data){
      jaoClient.evalResponse(data);
    });
  },
  flowStepSync: function (step, ask) {
    var keys = Object.keys(conversation.asks);

    if (conversation != undefined) {
      if (totalRetry > 0) {
        var i = keys[conversation.step];
        var richObject = conversation.asks[i].richResponseObject;

        if (richObject != undefined) {
          if (richObjects[richObject.type]) {
            richObjects[richObject.type](richObject);
          }
        }

        if (commands[conversation.asks[i].command]) {
          try {
            commands[conversation.asks[i].command](data);
          } catch (e) {console.log(e);}
        }

      } else {
        jaoClient.printAndSpeak(ask, function(){
          var i = keys[conversation.step];
          var richObject = conversation.asks[i].richResponseObject;

          if (richObject != undefined) {
            if (richObjects[richObject.type]) {
              richObjects[richObject.type](richObject);
            }
          }

          if (commands[conversation.asks[i].command]) {
            try {
              commands[conversation.asks[i].command](data);
            } catch (e) {console.log(e);}
          }
        });
      }
    }
  },
  flowPayloadSync: function (textoReconhecido) {
    // Input Validation
    var keys = Object.keys(conversation.asks);
    var j = keys[conversation.step];
    var funcaoValidadora = conversation.asks[j].validation;

    if (funcaoValidadora == undefined) {
        funcaoValidadora = "jaoClient.validators.simpleReturnTrue('$value')";
    }

    this.validateEntry(funcaoValidadora, textoReconhecido,
      function(textoReconhecido){
        jaoClient.isAnotherIntent(textoReconhecido, function(isAnother){
            var validationSuccessMessage = "OK";
            var i = keys[conversation.step];

            console.log(conversation.asks[i].validationSuccessMessage);

            if (conversation.asks[i].validationSuccessMessage != undefined) {
              var pos = Math.floor(Math.random() * conversation.asks[i].validationSuccessMessage.length) + 1
              validationSuccessMessage = conversation.asks[i].validationSuccessMessage[pos - 1];
            }

            jaoClient.printAndSpeak(validationSuccessMessage, function(){
              totalRetry = 0;
              var payload = conversation.payload;

              payload[i] = {
                "response": textoReconhecido
              }

              conversation.payload = payload;

              if (conversation.step == conversation.total - 1) {
                console.log(JSON.stringify(conversation));

                if (conversation.generateReturn) {
                  jaoClient.jaoDirectCoreRequest(conversation._id, conversation.payload, conversation.rawIntent, function(){
                    conversation = undefined;
                  });
                } else {
                  conversation = undefined;
                }
              } else {
                conversation.step = conversation.step + 1;
                var k = keys[conversation.step];
                jaoClient.conversation.flowStepSync(conversation.step, conversation.asks[k].ask);
              }
            });

        });
      }, function(textoReconhecido){ // callback error
        var maxRetry = conversation.asks[keys[conversation.step]].maxRetry;
        totalRetry = totalRetry + 1;
        var i = keys[conversation.step];

        var validationErrorMessage = "Validation Error";

        if (conversation.asks[i].validationErrorMessage != undefined) {
          var pos = Math.floor(Math.random() * conversation.asks[i].validationErrorMessage.length) + 1
          validationErrorMessage = conversation.asks[i].validationErrorMessage[pos - 1];
        }

        if (maxRetry != undefined) {
          if (maxRetry === 0) {
            var hangoutMessage = conversation.asks[conversation.step].hangoutMessage;
            if (hangoutMessage != undefined) {
              validationErrorMessage = hangoutMessage;
            }
            conversation = undefined;
            totalRetry   = 0;
          } else if (maxRetry == totalRetry) {
            var hangoutMessage = conversation.asks[conversation.step].hangoutMessage;
            if (hangoutMessage != undefined) {
              validationErrorMessage = hangoutMessage;
            }
            conversation = undefined;
            totalRetry   = 0;
          }
        }

        jaoClient.printAndSpeak(validationErrorMessage, function(){
          if (conversation !== undefined) {
            jaoClient.conversation.flowStepSync(conversation.step, conversation.asks[conversation.step].ask);
          }
        });
      }
    );
  },
  validateEntry: function (funcaoValidadora, textoReconhecido, callbackSucesso, callbackFalha) {
    var keys = Object.keys(conversation.asks);
    var maxRetry = conversation.asks[keys[conversation.step]].maxRetry;

    var resultado = false;
    funcaoValidadora = funcaoValidadora.replace("$value", textoReconhecido);
    console.log(funcaoValidadora);
    resultado = eval(funcaoValidadora);
    console.log("Validando Entrada... [funcao=" + funcaoValidadora + ", resultado=" + resultado + ", retry=" + totalRetry + ", maxRetry=" + maxRetry + "]");

    if (resultado) {
      callbackSucesso(textoReconhecido);
    } else {
      callbackFalha(textoReconhecido);
    }
  }
};

JaoClient.prototype.stt = {
  startDictation: function(callback) {
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
      if (callbacks["stt.startDictation"]) {
        callbacks["stt.startDictation"]();
      }

      recognition = new webkitSpeechRecognition();

      recognition.continuous     = false;
      recognition.interimResults = false;

      recognition.lang = clientConfig.language;
      jaoClient.stt.start();

      recognition.onresult = function(e) {
        var textoRec = e.results[0][0].transcript;

        jaoClient.trataInput(textoRec);
      };
      recognition.onerror = function(e) {
        recognition.stop();

        if (callbacks["stt.error"]) {
          callbacks["stt.error"](e);
        }
      }
    }
  },
  stop: function(callback) {
    if (recognition != undefined)
      recognition.stop();

    if (callbacks["stt.stop"]) {
      callbacks["stt.stop"]();
    }
  },
  start: function (callback) {
    if (recognition != undefined)
      recognition.start();

    if (callbacks["stt.start"]) {
      callbacks["stt.start"]();
    }
  }
};

JaoClient.prototype.audioSupport = {
  queue: [],
  playing: false,
  playByteArray: function(byteArray, callback) {
    var _self = this;
    _self.playing = true;
    var arrayBuffer = new ArrayBuffer(byteArray.length);
    var bufferView = new Uint8Array(arrayBuffer);

    for (var i = 0; i < byteArray.length; i++) {
      bufferView[i] = byteArray[i];
    }

    context.decodeAudioData(arrayBuffer, function(buffer) {
        buf = buffer;
        jaoClient.audioSupport.play(callback);
    });
  },
  play: function(callback) {
    var _self = this;
    _self.playing = true;
    jaoClient.ui.startPlaying();
    // Create a source node from the buffer
    source = context.createBufferSource();
    source.buffer = buf;
    // Connect to the final output node (the speakers)
    source.connect(context.destination);

    source.addEventListener('ended', function(e){
        jaoClient.ui.stopPlaying();
        _self.playing = false;

        if (callback) {
          callback();
        }
    }, false);

    // Play immediately
    source.start(0);
  },
  stop: function () {
    _self.playing = false;
    source.stop();

    if (callbacks["stt.stop"]) {
      callbacks["stt.stop"];
    }
  },
  addToQueue: function (byteArray, callback) {
    var _self = this;
    var q = jaoClient.audioSupport.queue;

    var audio = {};
    audio.byteArray = byteArray;
    audio.callback  = callback;

    q.push(audio);
    console.log("Audio Added: " + q.length);

    if (!_self.playing) {
      _self.playQueue();
    }
  },
  playQueue: function () {
    var _self = this;
    var q = jaoClient.audioSupport.queue;
    console.log("Checking Queue Size... [" + q.length + "]");

    if (q[0] !== undefined) {
      console.log("Playing Queue...");
      var audio = q[0];
      _self.playByteArray(audio.byteArray, function () {
        console.log("Audio Ended...");
        q = q.splice(0, 1);

        if (audio.callback) {
          console.log("Running Native Function Callback...");
          audio.callback();
        } else {
          _self.playQueue();
        }
      });
    }
  }
};

/*
Validators
*/
JaoClient.prototype.validators = {
  simpleList: function (lista, valor) {
    valor = valor.toLowerCase();
    if(lista.indexOf(valor) !== -1){
    	return true;
    }else{
    	return false;
    }
  },
  simpleReturnTrue: function () {
    return true;
  }
}

JaoClient.prototype.history = {
  start: function (data, finalCallback) {
    var _self = this;
    var imprimir = data.text;
    jaoClient.ui.fromCore(imprimir);

    response = data;
    var stack = [];

    if (pollyOnServer) {
      var obj = jaoClient.utils.base64ToUint(data.binary);
      jaoClient.audioSupport.addToQueue(obj, function(){
        var total = data.history.length;

        for (var i = 0; i < total; i++) {
          var etapa = data.history[i];
          var func  = "jaoClient.history." + etapa;

          if (i < (total - 1)) {
            func = func.substring(0, func.length - 1) + ", next)";
          } else {
            func = func.substring(0, func.length - 1) + ", " + function (finalCallback) {
              console.log("done history");

              if (finalCallback) {
                finalCallback();
                return;
              }

              if (response.router !== undefined) {
                router = response.router;
                jaoClient.evalRouter(response);
              }
            } + ")";
          }

          stack[i] = func;
        }
        _self.runStack(stack, 0, function(){
        });
      });
    } else {
      var total = data.history.length;

      for (var i = 0; i < total; i++) {
        var etapa = data.history[i];
        var func  = "jaoClient.history." + etapa;

        if (i < (total - 1)) {
          func = func.substring(0, func.length - 1) + ", next)";
        } else {
          func = func.substring(0, func.length - 1) + ", " + function (finalCallback) {
            console.log("done history");

            if (finalCallback) {
              finalCallback();
              return;
            }

            if (response.router !== undefined) {
              router = response.router;
              jaoClient.evalRouter(response);
            }
          } + ")";
        }

        stack[i] = func;
      }

      _self.runStack(stack, 0, function(){
      });
    }
  },
  runStack: function (stack, step, callback) {
    var next = function(){
      jaoClient.history.runStack(stack, step + 1);
    }

    eval(stack[step]);
  },
  printAndSpeak:function (p, callback) {
    jaoClient.printAndSpeak(p, callback);
  },
  print: function (text, callback) {
    var p = {
      "speech": text,
      "text": text
    }
    jaoClient.printAndSpeak(p, callback);
  },
  timer: function (sleepValue, callback) {
    setTimeout(function () {
      if (callback) {
        callback();
      }
    }, sleepValue);
  },
  loadImage: function (src, w, h, callback) {
    var idContainer = "richObj_" + Math.random();

    var container = jQuery('<div/>', {
        id: idContainer
    });

    var item = jQuery("<img src=\"" + src + "\" height=\"" + h + "\" width=\"" + w + "\"></img>");

    $(container).append(item);

    jaoClient.ui.appendRichObject(container, null);

    if (callback) {
      callback();
    }
  },
  loadVideoIframe: function (src, w, h, callback) {
    var idContainer = "richObj_" + Math.random();

    var container = jQuery('<div/>', {
        id: idContainer
    });

    var item = jQuery("<iframe src=\"" + src + "\" height=\"" + h + "\" width=\"" + w + "\" frameborder=\"0\"></iframe>");

    $(container).append(item);

    jaoClient.ui.appendRichObject(container, null);

    if (callback) {
      callback();
    }
  },
  loadYoutubeVideo: function (src, w, h, callback) {
    jQuery.getScript("//www.youtube.com/player_api", function(){
      var idContainer = "richObj_" + Math.random();

      var container = jQuery('<div/>', {
          id: idContainer
      });

      jaoClient.ui.appendRichObject(container, function(){
        var playerFunc = function(){
          var player = new YT.Player(idContainer, {
            height: h,
            width: w,
            videoId: src,
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange
            }
          });
        };

        if (youtube_api_ready) {
          playerFunc();
        } else {
          window.onYouTubePlayerAPIReady = function() {
            youtube_api_ready = true;
            playerFunc();
          }
        }

        function onPlayerReady(event) {
          event.target.playVideo();
        }

        function onPlayerStateChange(event) {
          if(event.data === 0) {
            if (callback) {
              callback();
            }
          }
        }
      });
    });
  }
}

jaoClient = new JaoClient();