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

var async = require("async");
var nodecrypto = require(global.cryptolib);
var EccKey = require('streembitlib/crypto/EccKey');
var secrand = require('secure-random');
streembit.config = require("./config.json");
streembit.DEFS = require("./appdefs.js");
streembit.accountsDB = require("./streembitdb").accountsdb;
streembit.Message = require("./message");

streembit.account = (function (accountobj, logger, config, events) {
    
    var m_name = null;
    var key = null;
    var ecdhkey = null;
    var m_port = null;
    var m_address = null;
    var m_ecdhkeys = null;
    var m_lastpkey = null;
    
    Object.defineProperty(accountobj, "name", {
        get: function () {
            return m_name;
        },
        
        set: function (value) {
            m_name = value;
        }
    });
    
    Object.defineProperty(accountobj, "port", {
        get: function () {
            return m_port;
        },
        
        set: function (value) {
            m_port = value;
        }
    });
    
    Object.defineProperty(accountobj, "address", {
        get: function () {
            return m_address;
        },
        
        set: function (value) {
            m_address = value;
        }
    });
    
    Object.defineProperty(accountobj, "crypto_key", {
        get: function () {
            return key;
        },
        
        set: function (value) {
            key = value;
        }
    });
    
    Object.defineProperty(accountobj, "private_key", {
        get: function () {
            return key ? key.privateKey : '';
        }
    });
    
    Object.defineProperty(accountobj, "ecdh_key", {
        get: function () {
            return ecdhkey;
        },
        
        set: function (value) {
            ecdhkey = value;
        }
    });
    
    Object.defineProperty(accountobj, "ecdh_public_key", {
        get: function () {
            return ecdhkey ? ecdhkey.getPublicKey('hex') : '';
        }
    });
    
    Object.defineProperty(accountobj, "ecdh_private_key", {
        get: function () {
            return ecdhkey ? ecdhkey.getPrivateKey('hex') : '';
        }
    });
    
    Object.defineProperty(accountobj, "public_key", {
        get: function () {
            return key ? key.publicKeyStr : '';
        }
    });
    
    Object.defineProperty(accountobj, "last_public_key", {
        get: function () {
            return m_last_key;
        },
        
        set: function (value) {
            m_last_key = value;
        }
    });
    
    Object.defineProperty(accountobj, "is_user_initialized", {
        get: function () {
            var isuser = m_name && key && ecdhkey;
            return isuser ? true : false;
        }
    });
    
    Object.defineProperty(accountobj, "ecdhkeys", {
        get: function () {
            return m_ecdhkeys;
        },
        
        set: function (value) {
            m_ecdhkeys = value;
        }
    });
    
    function getCryptPassword(password, account) {
        var text = password + account;
        var salt = nodecrypto.createHash('sha1').update(text).digest().toString('hex');
        var pbkdf2key = nodecrypto.pbkdf2Sync(text, salt, 100, 64, 'sha512');
        var pwdhex = pbkdf2key.toString('hex');
        return pwdhex;
    }
    
    function addToDB(account, publickey, cipher_context, callback) {
        var accountobj = {
            "account": account, 
            "public_key": publickey,
            "cipher": cipher_context
        };
        
        var json = JSON.stringify(accountobj);

        streembit.accountsDB.put(account, json, function (err) {
            if (err) {
                return logger.error("Database update error %j", err);
            }
           
            logger.info("database for account " + account + " updated");
            
            if (callback) {
                callback();
            }
        });
    }
    
    accountobj.create = function (account, password, callback) {
        try {
            
            if (!account || !password) {
                return callback("create_account invalid parameters");
            }

            var pbkdf2 = getCryptPassword(password, account);
            
            // get an entropy for the ECC key
            var entropy = secrand.randomBuffer(32).toString("hex");
            
            // create ECC key
            var key = new EccKey(entropy);
            
            // create a ECDH key
            var ecdh_key = nodecrypto.createECDH('secp256k1');
            ecdh_key.generateKeys();
            
            //  encrypt this
            var user_context = {
                "pk_entropy": entropy,
                "timestamp": Date.now(),
                "ecdhkeys": []
            };
            
            user_context.ecdhkeys.push({
                ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                ecdh_public_key: ecdh_key.getPublicKey('hex')
            });
            
            var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(user_context));
            
            addToDB(account, key.publicKeyStr, cipher_context, function () {
                accountobj.crypto_key = key;
                accountobj.ecdh_key = ecdh_key;
                accountobj.name = account;
                accountobj.ecdhkeys = user_context.ecdhkeys;
                
                callback();
            });
        }
        catch (err) {
            callback("create_account error: " + err.message);
        }
    };
    
    accountobj.initialize = function (user, password, callback) {
        try {
            if (!user || !password) {
                return logger.error("Invalid parameters, the account object and passwords are required");
            }
            
            var account_name = user.account;
            if (!account_name) {
                return callback("Invalid account name");
            }
            
            var pbkdf2 = getCryptPassword(password, account_name);
            
            // decrypt the cipher
            var plain_text;
            try {
                plain_text = streembit.Message.aes256decrypt(pbkdf2, user.cipher);
            }
            catch (err) {
                if (err.message && err.message.indexOf("bad decrypt") > -1) {
                    return callback("User initialize error: incorrect password");
                }
                else {
                    return callback("User initialize error: " + err.message);
                }
            }
            
            var userobj = JSON.parse(plain_text);
            
            var entropy = userobj.pk_entropy;
            
            // create ECC key
            var key = new EccKey(entropy);
            
            if (key.publicKeyStr != user.public_key) {
                return callback("Error in initializing the account, invalid password");
            }
            
            // the account exists and the encrypted entropy is correct!
            
            if (!userobj.ecdhkeys) {
                userobj.ecdhkeys = [];
            }
            
            var ecdh_key = nodecrypto.createECDH('secp256k1');
            
            if (userobj.ecdhkeys.length == 0) {
                // create a ECDH key
                ecdh_key.generateKeys();
                
                userobj.timestamp = Date.now();
                userobj.ecdhkeys.push({
                    ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                    ecdh_public_key: ecdh_key.getPublicKey('hex')
                });
            }
            else {
                try {
                    var ecdhprivate = userobj.ecdhkeys[0].ecdh_private_key;
                    ecdh_key.setPrivateKey(ecdhprivate, 'hex');
                }
                catch (e) {
                    userobj.ecdhkeys = [];
                    ecdh_key.generateKeys();
                    userobj.timestamp = Date.now();
                    userobj.ecdhkeys.push({
                        ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                        ecdh_public_key: ecdh_key.getPublicKey('hex')
                    });

                    logger.error("ECDH exception occured when setting private key. New ECDH array is created");
                }
            }
            
            var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(userobj));
            
            addToDB(account_name, key.publicKeyStr, cipher_context, function () {
                
                accountobj.crypto_key = key;
                accountobj.ecdh_key = ecdh_key;
                accountobj.name = account_name;
                accountobj.ecdhkeys = userobj.ecdhkeys;
                
                callback();
            });                      
        }
        catch (err) {
            callback("User initialize error: " + err.message);
        }
    };
    
    accountobj.backup = function () {
        try {
            if (!accountobj.name) {
                throw new Error("the account is not initialized");
            }
            
            streembit.AccountsDB.get(accountobj.name, function (err, user) {
                if (err) {
                    throw new Error(err);
                }
                if (!user) {
                    throw new Error("The account does not exists");
                }
                
                streembit.Fdialog.initialize({
                    type: 'save',
                    accept: ['streembit.dat'],
                    path: '~/Documents',
                    defaultSavePath: 'streembit.dat'
                });
                
                var objext = JSON.stringify(user);
                var encoded = window.btoa(objext);
                
                var text = "---BEGIN STREEMBIT KEY---\n";
                text += encoded;
                text += "\n---END STREEMBIT KEY---";
                
                var file_name = "streembit_" + accountobj.name + ".dat";
                streembit.Fdialog.saveTextFile(text, file_name, function () {
                    logger.debug("File saved in", path);
                });
                
            });
        }
        catch (err) {
            logger.error("Account backup error: %j", err);
        }
    };
    
    accountobj.restore = function () {
        try {
            var user = null;
            var account = null;
            
            streembit.Fdialog.initialize({
                type: 'open',
                accept: ['.dat'],
                path: '~/Documents'
            });
            
            streembit.Fdialog.readTextFile(function (err, buffer, path) {
                var text = null;
                try {
                    if (!buffer) {
                        throw new Error("invalid key backup buffer");
                    }
                    
                    var data = buffer.toString();
                    var find1 = "---BEGIN STREEMBIT KEY---\n";
                    var pos1 = data.indexOf(find1);
                    if (pos1 == -1) {
                        throw new Error("invalid key backup data");
                    }
                    var pos2 = data.indexOf("\n---END STREEMBIT KEY---");
                    if (pos2 == -1) {
                        throw new Error("invalid key backup data");
                    }
                    
                    var start = find1.length;
                    var decoded = data.substring(start, pos2);
                    text = window.atob(decoded);
                }
                catch (e) {
                    return logger.error("Invalid key backup data. Error: %j", e);
                }
                
                if (!text) {
                    return logger.error("Invalid key backup data");
                }
                
                user = JSON.parse(text);
                account = user.account;
                
                // get the password
                var box = bootbox.dialog({
                    title: "Private key password", 
                    message: '<div class="row"><div class="col-md-12">   ' +
                    '<input id="privkeypwd" name="privkeypwd" type="password" class="form-control input-md"> ' +
                    '</div></div>',
                    buttons: {
                        danger: {
                            label: "Cancel",
                            className: 'btn-default',
                            callback: function () {
                                
                            }
                        },
                        success: {
                            label: "Login",
                            className: 'btn-default',
                            callback: function () {
                                try {
                                    var result = $('#privkeypwd').val();
                                    if (result === null) {
                                        return bootbox.alert("Enter the private key password!");
                                    }
                                    
                                    var pbkdf2 = getCryptPassword(result, account);
                                    
                                    // decrypt the cipher
                                    var plain_text = streembit.Message.aes256decrypt(pbkdf2, user.cipher);
                                    var userobj = JSON.parse(plain_text);
                                    
                                    var entropy = userobj.pk_entropy;
                                    
                                    // create ECC key
                                    var key = new EccKey(entropy);
                                    
                                    if (key.publicKeyStr != user.public_key) {
                                        return bootbox.alert("Error in initializing the account, invalid password");
                                    }
                                    
                                    // the account exists and the encrypted entropy is correct!
                                    
                                    // create a ECDH key
                                    var ecdh_key = nodecrypto.createECDH('secp256k1');
                                    ecdh_key.generateKeys();
                                    
                                    userobj.timestamp = Date.now();
                                    userobj.ecdhkeys.push({
                                        ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                                        ecdh_public_key: ecdh_key.getPublicKey('hex')
                                    });
                                    
                                    if (userobj.ecdhkeys.length > 5) {
                                        userobj.ecdhkeys.shift();
                                        if (userobj.ecdhkeys.length > 5) {
                                            var removecount = userobj.ecdhkeys.length - 5;
                                            userobj.ecdhkeys.splice(0, removecount);
                                        }
                                    }
                                    
                                    var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(userobj));
                                    
                                    addToDB(account, key.publicKeyStr, cipher_context, function (err) {
                                        
                                        accountobj.crypto_key = key;
                                        accountobj.ecdh_key = ecdh_key;
                                        accountobj.name = account;
                                        accountobj.ecdhkeys = userobj.ecdhkeys;
                                        
                                        events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);
                                        
                                        streembit.UI.set_account_title(account);
                                        
                                        streembit.notify.success("The account has been initialized");
                                        
                                        streembit.UI.show_startscreen();

                                    });
                                }
                                catch (e) {
                                    bootbox.alert("Error in initializing the account: " + e.message);
                                }
                            }
                        }
                    }
   
                });
            });
                
            
        }
        catch (e) {
            logger.error("Account restore error: %j", e);
        }
    };
    
    accountobj.update_public_key = function (new_key_password) {
        logger.debug("Publish update_public_key");
        
        try {
            if (!accountobj.is_user_initialized) {
                return logger.error("The user account has not been initialized. To change the passphrase you must be connected to the Streembit network.");
            }
            
            if (!new_key_password) {
                return logger.error("Invalid parameters, the passphrase is required");
            }
            
            var current_public_key = accountobj.public_key;
            if (!current_public_key) {
                return logger.error("The user account has not been initialized. To change the passphrase you must be connected to the Streembit network.");
            }
            
            var account = accountobj.name;
            if (!account) {
                return logger.error("The user account has not been initialized. To change the passphrase you must be connected to the Streembit network.");
            }
            
            var pbkdf2 = getCryptPassword(new_key_password, account);
            
            // get an entropy for the ECC key
            var entropy = secrand.randomBuffer(32).toString("hex");
            
            // create ECC key
            var key = new EccKey(entropy);
            var new_public_key = key.publicKeyStr;
            
            logger.debug("Updating public key on the network");
            streembit.PeerNet.update_public_key(new_public_key, function (err) {
                if (err) {
                    return logger.error("Publish updated public key error %j", err);
                }
                
                //  encrypt this
                var user_context = {
                    "pk_entropy": entropy,
                    "timestamp": Date.now(),
                    "ecdhkeys": accountobj.ecdhkeys
                };
                
                var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(user_context));
                
                addToDB(account, new_public_key, cipher_context, function () {
                    accountobj.crypto_key = key;
                    
                    streembit.notify.success("The public key has been updloaded to the network");
                    events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
                });
            });
        }
        catch (err) {
            logger.error("User initialize error: %j", err);
            callback(err);
        }
    }
    
    accountobj.clear = function () {
        accountobj.crypto_key = null;
        accountobj.name = null;
        accountobj.ecdh_key = null;
    }
    
    return accountobj;

}(streembit.account || {}, global.applogger, streembit.config, global.appevents));


module.exports = streembit.account;