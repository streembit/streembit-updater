'use strict';

const { execSync } = require('child_process');
const config = require('./config');

let stdout = '', cmd = '';

// since we're running both branches in the same folder
// checkout to main branch after each pull
/*
 - develop : staging
 - master : prod
*/
const MAIN_BRANCH = 'develop';

exports.exec = function exec(repo, payload) {
    stdout = execSync('pm2 show streembit | grep "script args" | awk \'{split($0,a,"│"); print a[3]}\' | cut -d " " -f 2');
    const pwd = stdout.toString().trim();

    cmd = `
        cd ${config[repo]['path'][payload.branch]} && \
        (git checkout ${MAIN_BRANCH} \
        pm2 delete streembit \
        node pm2start ${pwd})
    `;

    stdout = execSync(cmd);
};
