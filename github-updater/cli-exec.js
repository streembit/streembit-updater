'use strict';

const { execSync } = require('child_process');
const config = require('./config');

let stdout = '', cmd = '';

exports.exec = function exec(repo) {
    stdout = execSync('pm2 show streembit | grep "script args" | awk \'{split($0,a,"│"); print a[3]}\' | cut -d " " -f 2');
    const pwd = stdout.toString().trim();
    cmd = `
        cd ${config[repo]["path"]}
        pm2 delete streembit
        node pm2start ${pwd}
    `;

    stdout = execSync(cmd);
};
