const gith = require('gith').create(8001);
const { execSync } = require('child_process');

const config = require('./config');

let stdout = '',
    cmd = '';

stdout = execSync('whereis git');
const isgit = stdout.toString().trim();
if (!/\/git/.test(isgit)) {
    console.log('Could not find git');
    process.exit(-1);
}

gith({
    repo: /streembit\/streembit(.*)/
}).on('all', function(payload){
    const repo = payload.repo.replace(/^streembit\//, '');
    // do we care about this update
    if (config.hasOwnProperty(repo) && config[repo]['path'].hasOwnProperty(payload.branch)) {
        try {
            // typical for all repos
            const path = config[repo]['path'][payload.branch];
            cmd = `
                cd ${path} && \
                (git add -A; git stash && git stash drop; \
                git checkout ${payload.branch}; \
                ${config[repo]['command']})
            `;

            stdout = execSync(cmd);

            if (!/error/i.test(stdout)) {
                // specific for each repo
                if (config[repo].hasOwnProperty('repo-exec')) {
                    const specialDeploy = require(config[repo]['repo-exec']);
                    specialDeploy.exec(path);
                }
            } else {
                throw new Error(stdout);
            }
        } catch (err) {
            console.log(err.message);
            process.exit(-1);
        }
    }
});
