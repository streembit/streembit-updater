var http = require('http');
var querystring = require('querystring');
const { execSync } = require('child_process');

let stdout = '', rawdata = '';

stdout = execSync('whereis git');
if (stdout.toString().length < 1) {
    console.log('Could not find git');
    process.exit(-1);
}

const updater = function(data) {
    // ToDo validate and process data
}

const end = function(req, resp, code) {
    resp.writeHead(code, {'Content-Type': 'text/plain'});
    resp.end();
    req.connection.destroy();
}

http.createServer(function(request, response) {
    if(request.method === 'POST') {
        request.on('data', function(data) {
            rawdata += data;
            if(rawdata.length > 1e6) {
                end(request, response, 413);
            }
        });

        request.on('end', function() {
            const postdata = querystring.parse(rawdata);
            updater(postdata);
        });
    } else {
        end(response);
    }

}).listen(8002);