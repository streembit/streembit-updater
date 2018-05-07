const gith = require('gith').create(8001);
const { execSync } = require('child_process');

const config = require('./config');

let stdout = '', cmd = '';

stdout = execSync('whereis git');
const isgit = stdout.toString().trim();
if (!/\/git/.test(isgit)) {
    console.log('Could not find git');
    process.exit(-1);
}

gith({
    repo: /streembit\/streembit(.*)/
}).on('all', function(payload){
    const repo = 'streembit/streembit-cli'.replace(/^streembit\//, '');
    if (config.hasOwnProperty(repo)) {
        try {
            cmd = `
                cd ${config[repo]["path"]}
                git add -A && git stash && git stash drop
                git checkout ${payload.branch}
                ${config[repo]["command"]}
            `;

            stdout = execSync(cmd);

            if (!/error/i.test(stdout)) {
                if (config[repo].hasOwnProperty('repo-exec')) {
                    const specialDeploy = require(config[repo]['repo-exec']);
                    specialDeploy.exec(repo);
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