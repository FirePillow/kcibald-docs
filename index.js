let join = require("path").join;
let readFileSync = require("fs").readFileSync;

let loadAndBundleSpec = require("redoc").loadAndBundleSpec;
let dirname = require("path").dirname;
let writeFileSync = require("fs").writeFileSync;
let copyFileSync = require("fs").copyFileSync;
let createStore = require('redoc').createStore;
let ServerStyleSheet = require('styled-components').ServerStyleSheet
let renderToString = require('react-dom/server').renderToString;
let React = require('react');
let Redoc = require('redoc').Redoc;
let compile = require('handlebars').compile;

let ossStore;
if (process.env.oss_region && process.env.oss_accessKeyId && process.env.oss_accessKeySecret && process.env.bucket_name) {
    let oss = require('ali-oss');
    store = oss({
        region: process.env.oss_region,
        accessKeyId: process.env.oss_accessKeyId,
        accessKeySecret: process.env.oss_accessKeySecret,
        bucket: process.env.bucket_name
    });
} else
    null

const configFilePath = 'api.json';
const uploadFileName = 'index.html';

(async function () {
    let spec = await loadAndBundleSpec(configFilePath);
    const store = await createStore(spec, 'f.json', {});
    const sheet = new ServerStyleSheet();
    let element = React.createElement(Redoc, {store});
    html = renderToString(sheet.collectStyles(element));
    css = sheet.getStyleTags();
    state = await store.toJS();
    let templateFileName = join(__dirname, './template.hbs');
    let template = compile(readFileSync(templateFileName).toString());
    let result = template({
        redocHTML: `<div id="redoc">${html}</div>`,
        redoc_state: JSON.stringify(state),
        redoc_styles: css,
        redocjs: '<script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0-rc.4/bundles/redoc.standalone.min.js"></script>',
        title: `${spec.info.title} documtation`
    });

    if (ossStore) {
        console.log(`uploading using access key ${process.env.oss_accessKeyId}`)
        let promiseHTML = ossStore.put(uploadFileName, Buffer.from(result));
        let promiseConfig = ossStore.put(configFilePath, configFilePath);
        Promise.all([promiseHTML, promiseConfig])
    } else {
        writeFileSync('output/' + uploadFileName, result)
        copyFileSync(configFilePath, 'output/' + configFilePath)
    }

})();

