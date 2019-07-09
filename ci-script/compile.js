let join = require("path").join;
let readFileSync = require("fs").readFileSync;

let loadAndBundleSpec = require("redoc").loadAndBundleSpec;
let fs = require("fs");
let pathUtil = require('path');
let createStore = require('redoc').createStore;
let ServerStyleSheet = require('styled-components').ServerStyleSheet;
let renderToString = require('react-dom/server').renderToString;
let React = require('react');
let Redoc = require('redoc').Redoc;
let compile = require('handlebars').compile;
let git = require('git-rev-sync');
let minify = require('html-minifier').minify;
let JSON5 = require('json5');

let util = require('./utils');

let redoc_version = require('../package').dependencies.redoc;

const tempFolder = "./tmp/";

const configFolder = "./src/";
const masterConfigFile = 'index.json';
const uploadFileName = 'index.html';

(async function () {
    try {

        // convert json5 files to json
        let processDirectory = (folder, file) => {
            let path = pathUtil.join(folder, file);
            let outputPath = pathUtil.join(tempFolder, path);

            if (util.isDirectory(path)) {
                fs.mkdirSync(outputPath);
                util.forEachInDirectory(path, file => processDirectory(path, file));
            } else {
                let specTree;
                if (file.includes(".json5")) {
                    specTree = JSON5.parse(fs.readFileSync(path).toString());
                } else {
                    specTree = JSON.parse(fs.readFileSync(path).toString());
                }
                fs.writeFileSync(outputPath, JSON.stringify(specTree));
            }
        };

        // prepare temporary folder for conversion
        util.createCleanFolder(tempFolder);
        fs.mkdirSync(pathUtil.join(tempFolder, configFolder));

        // convert
        util.forEachInDirectory(configFolder, file => processDirectory(configFolder, file));

        let convertedMasterConfigLocation = pathUtil.join(tempFolder, configFolder, masterConfigFile);

        // compile
        let spec = await loadAndBundleSpec(convertedMasterConfigLocation);
        const store = await createStore(spec, convertedMasterConfigLocation, {hideDownloadButton: true});
        const sheet = new ServerStyleSheet();
        let element = React.createElement(Redoc, {store});
        let html = renderToString(sheet.collectStyles(element));
        let css = sheet.getStyleTags();
        let state = await store.toJS();
        let templateFileName = join(__dirname, './template.hbs');
        let template = compile(readFileSync(templateFileName).toString());
        // noinspection JSUnresolvedLibraryURL
        let result = template({
            redocHTML: `<div id="redoc">${html}</div>`,
            redoc_state: JSON.stringify(state),
            redoc_styles: css,
            redocjs:
                `<script src="https://cdn.jsdelivr.net/npm/redoc@${redoc_version}/bundles/redoc.standalone.min.js"></script>`,
            title: `${spec.info.title} documtation`,
            buildTime: new Date(),
            buildBranchName: git.branch(),
            buildCommit: `${git.short()} (${git.message()})`,
            buildCommitUrl: `https://github.com/FirePillow/kcibald-docs/commit/${git.long()}`
        });

        result = minify(
            result,
            {
                log: console.log,
                collapseBooleanAttributes: true,
                collapseInlineTagWhitespace: true,
                collapseWhitespace: true,
                conservativeCollapse: true,
                keepClosingSlash: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeEmptyElements: false,
                removeScriptTypeAttributes: true,
                useShortDoctype: true
            }
        );

        if (!fs.existsSync('output')) {
            fs.mkdirSync('output');
        }
        fs.writeFileSync('output/' + uploadFileName, result);

    } catch (e) {
        console.log(e);
        process.exit(-1)
    }
})();
