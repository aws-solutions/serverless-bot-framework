'use strict';

var AWS = require('aws-sdk');
var B2  = require('b2.core');

global.callback = "";
global.context  = "";
global.event    = "";
var jaoInstance = undefined;

exports.handler = (event, context, callback) => {
    global.callback = callback;
    global.context  = context;
    global.initTime = new Date().getTime();
    global.event    = event;
    var retorno     = {}
    retorno         = event;

    if (event.voice === undefined) {
        if (process.env.voice === undefined) {
            event.voice = "Ricardo";
        } else {
            event.voice = process.env.voice;
        }
    }

    // Cache Improvements
    var hashBase = event.voice + "|" + event.text + "|" + event.customPronunciation;
    var hashCode = B2.generateHashCode(hashBase);

    B2.getAudioFromCache(hashCode, function(binary){
        if (binary !== undefined) {                    
            retorno.binary   = binary;
            retorno.hashBase = hashCode;
            retorno.text     = event.text;
            retorno.cacheHit = true;

            if (callback) {
                callback(null, retorno);
            }                    
        } else {
            var startPollyTime = new Date().getTime();
            B2.getModule("AWS", undefined, function(aws){
                aws.polly.speech(event.text, event.voice, function(voiceBinary) {
                    var b64encoded = new Buffer(voiceBinary.AudioStream).toString('base64');
                    retorno.binary   = b64encoded;
                    retorno.hashBase = hashCode;
                    retorno.text     = event.text;
                    retorno.cacheHit = false;

                    if (callback) {
                        callback(null, retorno);
                    }
                    B2.saveAudioCache(hashCode, b64encoded);
                });
            }, event.customPronunciation);
        }
    });
};
