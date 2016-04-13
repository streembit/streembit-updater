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

var util = require("util");
var EventEmitter = require("events").EventEmitter;
var ds18b20 = require('ds18x20');

util.inherits(Sensor, EventEmitter);

function Sensor(options) {
    if (!(this instanceof Sensor)) {
        return new Sensor(options);
    }

    EventEmitter.call(this);
    
    this.logger = options.logger;
    this.sample_interval = options.sample_interval;

    this.init();
}


Sensor.prototype.init = function () {
    try {
        var self = this;
        
        this.logger.debug('initializing ds18b20 sensor');

        ds18b20.isDriverLoaded(function (err, isLoaded) {
            this.logger.debug('ds18b20 driver loaded: ' + isLoaded);
            if (!isLoaded) {
                //  try to load the driver
                ds18b20.loadDriver(function (err) {
                    if (err) {
                        self.logger.error('Loading the driver failed. Error: %j', err)
                    }
                    else {
                        self.logger.debug('driver is loaded');
                        if (self.sample_interval) {
                            self.read_loop();
                        }
                    }
                });
            }
            else {
                if (self.sample_interval) {
                    self.read_loop();
                }
            }
        });

    }
    catch (err) {
        this.logger.error('ds18b20 init error: %j', err);
    }    
}


Sensor.prototype.read_loop = function () {
    try {
                
        var self = this;
        
        this.logger.debug('read from ds18b20 sensor');
        
        var list_of_sensors = ds18b20.list();
        this.logger.debug("ds18b20 sensors: %j", list_of_sensors );
        
        if (!list_of_sensors || list_of_sensors.length == 0) {
            return;
        }
        
        var device = list_of_sensors[0];
        
        this.timer = setInterval(
            function () {
                try {
                    ds18b20.get(device, function (err, temperature) {
                        if (err) {
                            return self.logger.error('ds18b20 read temperature error: %j', err);     
                        }

                        self.logger.debug("temperature: " + temperature);
                        // raise the event
                        self.emit("temperature", temperature);
                    });
                }
                catch (err) {
                    this.logger.error('ds18b20 read error: %j', err);
                }
            },
            this.sample_interval
        );

    }
    catch (err) {
        this.logger.error('ds18b20 read error: %j', err);
    }
}


module.exports.init_sensor = function(options) {
    return new Sensor(options);
};