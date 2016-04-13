var path = require('path');
var fs = require('fs');

exports.ensure_dbdir_exists = function (dbdir, callback) {
    
    var dbpath = path.join(__dirname, 'db', dbdir);

    fs.open(dbpath, 'r', function (err, fd) {
        if (err && err.code == 'ENOENT') {
            // not exists
            try {
                fs.mkdirSync(dbpath);
            }
            catch (e) {
                logger.error("creating " + dbpath + " directory error: " + e.message);
            }

            fs.open(dbpath, 'r', function (err, fd) {
                callback(err)
            });
        }
        else {
            // directory exists
            callback();
        }
    });
}
