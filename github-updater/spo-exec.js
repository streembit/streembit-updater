'use strict';

const { execSync } = require('child_process');

exports.exec = function exec(path) {

    const cmd = `
        cd ${path} && \
        git checkout master && \
        pm2 restart streemster
    `;

    execSync(cmd);
};
