# streembit-pi
Raspberry Pi IoT implementation of Streembit using Node.js 

Setting up the Streembit system on the Raspberry Pi device
----------------------------------------------------------

Login to the Raspberry Pi device via terminal.   
Default user: **pi**, default password: **raspberry**

Change the password to your secure password

```bash
$ sudo passwd pi
```

Resize your disk if there is no space left on the SD disk. (Normally the disk has 0 space upon burning the Raspbian image. You must reboot after resizing!)

```bash
sudo raspi-config
```


Install Node.js.
---------------

Build Node.js from source.

```bash
$ cd /usr/local/src   
```

Use the latest Node.js version instead of 10.1 of this readme.

```bash
$ wget https://nodejs.org/dist/v5.10.1/node-v5.10.1.tar.gz
```

```bash
$ tar -xvzf node-v5.10.1.tar.gz
```

```bash
cd node-v5.10.1
```

```bash
$ ./configure
```

```bash
$ make install
```

```bash
$ which node
```

The Node installation diectory should be displayed.

```bash
$ node -v
```

The installation version should be 10.1.

Install Git:

```bash
$ sudo apt-get update
```

```bash
$ sudo apt-get install git
```

```bash
$ git clone https://github.com/streembit/streembit-pi.git
```

```bash
$ cd streembit-pi
```

Change the account details of the config.json file. Your device is identified by the account name, and therefore to make accessible your device 
you must create a unique account entity on the Streembit network. For example, if you want the device to be identifed with the "myraspberrypi" then
put the "myraspberrypi" name at the node.account field.

```json
"node": {
        "account": "myraspberrypi",
        "address": "localhost",
        "port": 32321,
        "seeds": ["seed.streemio.org", "seed.streemio.net", "seed.streemio.biz", "seed.streemio.co"]
    }
```

Start the streembit application. You must define the private key password following the -pksecret in the command line to secure your PPKI private key. 
If the account does not exists then it will be created. Next time, you must use the same password to initialize the account.

```bash
$ cd node streembit.js -pksecret Password123456789
```

Open the Streembit GUI application, connect to the Strembit public network. Click on the "Machines/Connect to Internet of Things Device" menu item and enter "myraspberrypi" to find the device.    
Once the device is located on the network you should see the temperature sampling from the DS18B20 sensor.   
You can send an event subscription request to the device by setting the temperature threshold. Once the temperature is higher than the threshold, then the GUI should receive a notification.

Please submit your questions/comments/suggestions at the [Streembit Forum](https://gitter.im/streembit).







