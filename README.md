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
you must create a unique account entity on the Streembit network. For example, if you want the device to be identifed with the "alicedevice0001" then
put the "alicedevice0001" name at the node.account field.

```json
"node": {
        "account": "alicedevice0001",
        "address": "localhost",
        "port": 32321,
        "seeds": ["seed.streemio.org", "seed.streemio.net", "seed.streemio.biz", "seed.streemio.co"]
    }
```






