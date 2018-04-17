## Streembit Updater

#### Github hook listener

directory `./github updater`

The purpose of this script is to auto update corresponding code base
right after another commit was pushed to github.

There are limited set of option to configure the script, and you'll find all of them in config.json file

As you may noticed, each item on the main level object represents a repository.
An object key MUST match of repo you want to auto update.

Next, considering the following excerpt
```json
"streembit-cli": {
    "path": "/home/streembit/apps/streembit-cli",
     "command": "git reset --hard HEAD^ && git pull > /dev/null 2>&1",
     "nodes": []
}
```
 - streembit-cli : is the repo name
 - path : represents full, or absolute path to folder where corresponding repo deployed
 - command : typical git pull command. we have added here reset command to flush off all sudden changes made on a go

 ---------------

 **How to use**

 straight forward

 ```bash
 cd INSTALL_DIR
 git clone https://github.com/streembit/streembit-updater.git .
 npm install
 ```

 and then, make a daemon out of it (make sure pm2 installed; if not `npm pm2 -g` should do it)

 ```bash
 pm2 start hook_master.js --name=puller
 ```

 That is made all set and you should see corresponding repo updated each time you push to github
