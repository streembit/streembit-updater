const gith = require('gith').create(8001);
const { execSync } = require('child_process');

const config = require('./config');

let stdout = '';

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
            const cmd = `
                cd ${config[repo]["path"]}        
                git reset --hard HEAD^
                git checkout ${payload.branch}
                ${config[repo]["command"]}
            `;
            
            stdout = execSync(cmd);

            if (!/error/i.test(stdout)) {
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
