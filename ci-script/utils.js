let fs = require('fs');
let pathUtil = require('path');

let cleanupFolder = path => {
    if (fs.existsSync(path)) {
        if (fs.lstatSync(path).isDirectory()) {
            forEachInDirectory(path, cleanupFolder);
        } else {
            fs.unlinkSync(path);
        }
    }
};

let createCleanFolder = path => {
    if (fs.existsSync(path)) {
        forEachInDirectory(path, file => _createCleanFolderInner(pathUtil.join(path, file)))
    } else {
        fs.mkdirSync(path);
    }
};

let _createCleanFolderInner = path => {
    if (isDirectory(path)) {
        forEachInDirectory(path, file => _createCleanFolderInner(pathUtil.join(path, file)));
        fs.rmdirSync(path)
    } else {
        fs.unlinkSync(path);
    }
};

let isDirectory = path => fs.lstatSync(path).isDirectory();

let forEachInDirectory = (path, callback) => fs
    .readdirSync(path)
    .forEach(callback);


module.exports = {
    cleanupFolder: cleanupFolder,
    createCleanFolder: createCleanFolder,
    isDirectory: isDirectory,
    forEachInDirectory: forEachInDirectory
};