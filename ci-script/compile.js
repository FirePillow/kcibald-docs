let join = require("path").join;
let readFileSync = require("fs").readFileSync;

let loadAndBundleSpec = require("redoc").loadAndBundleSpec;
let fs = require("fs");
let createStore = require('redoc').createStore;
let ServerStyleSheet = require('styled-components').ServerStyleSheet;
let renderToString = require('react-dom/server').renderToString;
let React = require('react');
let Redoc = require('redoc').Redoc;
let compile = require('handlebars').compile;
let git = require('git-rev-sync');
let minify = require('html-minifier').minify;

let redoc_version = require('../package').dependencies.redoc;

const configFilePath = 'api.json';
const uploadFileName = 'index.html';

(async function () {
    try {
        let spec = await loadAndBundleSpec(configFilePath);
        const store = await createStore(spec, configFilePath, {hideDownloadButton: true});
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
        fs.copyFileSync(configFilePath, 'output/' + configFilePath)
    } catch (e) {
        console.log(e);
        process.exit(-1)
    }
})();

