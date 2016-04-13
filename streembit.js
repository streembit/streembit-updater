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

var DEFAULT_STREEMBIT_PORT = 32321;

var config = require("./config.json");

// use the nodejs crypto library
global.cryptolib = "crypto";

global.streembit_node = 0;

var logger = require("streembitlib/logger/logger");
global.applogger = logger;

if (!global.appevents) {
    var AppEvents = require("streembitlib/events/AppEvents");
    global.appevents = new AppEvents();
}

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var levelup = require('levelup');
var async = require('async');
var util = require('util');
var assert = require('assert');
var wotkad = require('streembitlib/streembitkad/kaddht');
streembit.bootclient = require("./bootclient");
streembit.PeerNet = require("./peercomm").PeerNet;


var config_node = config.node;
if (!config_node) {
    throw new Exception("Application error: the seed configuration is missing")
}

assert(config_node, "Invalid start arguments. Corect start format -config 'config settings' where 'config settings' is a field in the seedsconf.js file");
assert(config_node.address, "address must exists in the config field of seedsconf.js file");
assert(config_node.port, "port must exists in the config field of seedsconf.js file");
assert(config_node.seeds, "seeds must exists in the config field of seedsconf.js file");
assert(Array.isArray(config_node.seeds), 'Invalid seeds supplied. "seeds" must be an array');

// initialize the database path
var maindb_path = path.join(__dirname, 'db', 'streembitdb');

async.waterfall(
    [
        function (callback) {
            var wdir = process.cwd();
            var logspath = path.join(wdir, 'logs');
            var logConfig = config.log;
            var loglevel = logConfig && logConfig.level ? logConfig.level : "debug";
            logger.init(loglevel, logspath, null, callback);
        },      
        function (callback) {
            // create the db directory
            logger.info("initializing database directory");
            logger.info("maindb_path: %s", maindb_path);
            fs.open(maindb_path, 'r', function (err, fd) {
                if (err && err.code == 'ENOENT') {
                    /* the DB directory doesn't exist */
                    logger.info("Creating database directory ...");
                    var dbdir_path = path.join(__dirname, 'db');
                    try {
                        fs.mkdirSync(dbdir_path);
                    }
                    catch (e) {
                        logger.error("creating database error: %j", e);
                    }
                    try {
                        fs.mkdirSync(maindb_path);
                    }
                    catch (e) {
                        logger.error("creating database error: %j", e);
                    }
                    fs.open(maindb_path, 'r', function (err, fd) {
                        if (err) {
                            callback(err)
                        }
                        else {
                            logger.info("DB directory created");
                            callback();
                        }
                    });
                }
                else {
                    callback();
                }
            });
        },    
        function (callback) {
            // bootstrap the app with the streembit network
            logger.info("Bootstrap the network");
            streembit.bootclient.boot(config_node.seeds, callback);
        },    
        function (bootseeds, callback) {
            if (!bootseeds || !bootseeds.seeds || !bootseeds.seeds.length) {
                return callback("Error in populating the seed list. Please make sure the 'bootseeds' configuration is correct and a firewall doesn't block the Streembit software!");
            }
            
            logger.debug("seeds: %j", bootseeds.seeds);
            
            // initialize the Peer Network
            logger.info("Connecting to Streembit network");
            var maindb = levelup(maindb_path);
            streembit.PeerNet.init(bootseeds, maindb).then(
                function () {
                    logger.debug("PeerNet is initialized");
                    streembit.seeds = bootseeds.seeds;
                    callback(null);
                },
                function (err) {
                    logger.error("PeerNet init error %j", err);
                    callback(err);
                }
            );
        },
        function (callback) {
            // validate the connection
            logger.info("Validating Streembit network connection");
            streembit.PeerNet.validate_connection().then(
                function () {
                    appboot_msg_handler("PeerNet connection is validated");
                    logger.debug("PeerNet connection is validated");
                    callback(null);
                },
                function (err) {
                    logger.error("Error in P2P connection %j", err);
                    callback(err);
                }
            );
        },
        function (callback) {
            streembit.PeerNet.publish_user(callback);
        }
    ], 
    function (err, result) {
        if (err) {
            console.log("Main init error: %j", err);
            logger.error("Main init error: %j", err);
        }
    }
);

