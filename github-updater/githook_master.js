const gith = require('gith').create(8001);
const { execSync } = require('child_process');

const config = require('./config');

let stdout = '', cmd = '';

stdout = execSync('whereis git');
if (stdout.toString().length < 1) {
    console.log('Could not find git');
    process.exit(-1);
}

gith({
    repo: /streembit\/streembit(.*)/
}).on('all', function(payload){
    const repo = payload.repo.replace(/^streembit\//, '');
    if (config.hasOwnProperty(repo)) {
        try {
            cmd = `
                cd ${config[repo]["path"]}        
                git reset --hard HEAD^
                git checkout ${payload.branch}
                ${config[repo]["command"]}
            `;

            stdout = execSync(cmd);

            if (!/error/i.test(stdout)) {
                if (repo === 'streembit-cli') {
                    stdout = execSync('pm2 show streembit | grep "script args" | awk \'{split($0,a,"│"); print a[3]}\' | cut -d " " -f 2');
                    const pwd = stdout.toString().trim();
                    cmd = `
                       cd ${config[repo]["path"]}
                       pm2 delete streembit
                       node pm2start ${pwd}
                    `;

                    stdout = execSync(cmd);
                }
                if (config[repo]["nodes"].length) {
                    // ToDo: update configured nodes
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
