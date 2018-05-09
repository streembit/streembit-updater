#### Github hook listener

directory `./github-updater`

The purpose of this script is to auto update corresponding code base
right after another commit was pushed to github.

There are limited set of option you have to configure the script,
you'll find all of them in `config.json` file

config.json is an object of objects.
Each lower level object represent a single repository you want to update on a server of installation
The object key MUST match a name of repo.

Next, considering the following excerpt
```json
"streembitui": {
    "path": {
        "master": ""PATH/TO/PRODUCTION/ROOT",
        "dev": ""PATH/TO/STAGING/ROOT"
    },
    "command": "git pull > /dev/null 2>&1",
    "repo-exec": "./ui-exec.js"
}
```
 - streembit-cli : is the repo name
 - path : is an object where each item has a "key" equal to a branch name, and "value" equal to an absolute path to git root of the branch
 - command : typical git pull command
 - repo-exec : specific to each repository command that need to be ran on update (server restart, build commands, etc.)

 ---------------

 **How to use**

 straightforward

 ```bash
 cd ARBITRARY_DIR
 git clone https://github.com/streembit/streembit-updater.git .
 cd github-updater
 npm install
 ```

 and then,
 make a daemon out of it (make sure pm2 installed; if not `npm install -g pm2` should do it)

 ```bash
 pm2 start autodeploy.js --name=puller
 ```

 That made everything set, and you should see corresponding repo updated each time you push to github
