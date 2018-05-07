'use strict';

const { execSync } = require('child_process');
const config = require('./config');

let stdout = '', cmd = '';

exports.exec = function exec(repo) {

    cmd = `
        cd ${config[repo]["path"]}
        bundle exec middleman build --clean
    `;

    stdout = execSync(cmd);
};
