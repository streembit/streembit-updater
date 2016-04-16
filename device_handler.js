/*
 
This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/


'use strict';

var streembit = streembit || {};

streembit.config = require("./config.json");
streembit.ContactList = require("./contactlist");
streembit.DEFS = require("./appdefs.js");
streembit.PeerNet = require("./peercomm").PeerNet;

streembit.DeviceHandler = (function (handler, logger, config, events) {
    
    var list_of_devices = {};

    handler.init = function () {
        var devices = config.devices;
        
        if (!devices || devices.length == 0) {
            logger.debug("No devices configured in the the config file.");
            return;
        }
        
        for (var i = 0; i < devices.length; i++) {
            var device = devices[i].device;
            if (device == "ds18b20") {
                var ds18b20 = require("./device/ds18b20");
                var options = {
                    logger: logger,
                    sample_interval: devices[i].sample_interval
                };
                var sensor = ds18b20.init_sensor(options);
                sensor.on("temperature", function (value) {
                    logger.debug("device event temperature: " + value);
                });

                list_of_devices[device] = sensor;
            }
        }
    };
    
    handler.device_request = function (payload) {
        try {
            var sender = payload.sender;
            logger.debug("sending device_request to " + sender);
            
            var devdescs = [];
            
            var devices = config.devices;
            for (var i = 0; i < devices.length; i++) {
                var device = list_of_devices[devices[i].device];
                if (device) {
                    var desc = device["get_description"]();
                    if (desc) {
                        devdescs.push(desc);
                    }
                }
            }
            
            var contact = streembit.ContactList.get(sender);
            var message = { cmd: streembit.DEFS.PEERMSG_DEVDESC, devices: devdescs };
            streembit.PeerNet.send_peer_message(contact, message);

        }
        catch (err) {
            logger.error("DeviceHandler.device_request error: %j", err);
        }
    }
    
    handler.read_property = function (payload) {
        try {
            var sender = payload.sender;
            if (!sender) {
                throw new Error("read_request error: invalid sender parameter")
            }

            logger.debug("read request from " + sender);
            
            if (!payload.data) {
                throw new Error("read_request error: invalid data parameter")
            }
            
            if (!payload.data.device) {
                throw new Error("read_request error: invalid device name parameter")
            }

            // get the device name
            var device_name = payload.data.device.toLowerCase();     
            var device = list_of_devices[device_name];
            if (device) {
                device["read"]( params, function (err, data) {
                    var contact = streembit.ContactList.get(sender);
                    var message = { cmd: streembit.DEFS.PEERMSG_DEVREAD_PROP_REPLY, data: data };
                    streembit.PeerNet.send_peer_message(contact, message);
                });                    
            }
                     
        }
        catch (err) {
            logger.error("DeviceHandler.device_request error: %j", err);
        }
    }    
    
    return handler;

}(streembit.DeviceHandler || {}, global.applogger, streembit.config, global.appevents));


module.exports = streembit.DeviceHandler;