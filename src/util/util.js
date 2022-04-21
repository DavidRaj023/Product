const fs = require('fs');
const path = require('path');

exports.deleteFile = (path) => {
    try {
        fs.unlinkSync(path);
        console.log('File Deleted: ' + path);
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}
exports.removeDir = (path) => {
    fs.rm(path, {
        recursive: true
    }, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${path} is deleted!`);
    });
};

exports.removeFilesinDir = (directory) => {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      });
}

exports.findFromSet = (value, recordset) => {
    try {
        var data = [];
        for (var i = 0; i < recordset.length; i++) {
            data.push(recordset[i].name);
        }
        return data.some(item => item.toLowerCase() == value.toLowerCase());
    } catch (error) {

    }
};

