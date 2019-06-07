let oss = require('ali-oss');

(async function () {
    try {
        let ossStore;
        let ossRegion = process.env.oss_region;
        let ossAccessKeyId = process.env.oss_accessKeyId;
        let ossAccessKeySecret = process.env.oss_accessKeySecret;
        let bucketName = process.env.bucket_name;

        if (ossRegion && ossAccessKeyId && ossAccessKeySecret && bucketName) {
            ossStore = oss({
                region: ossRegion,
                accessKeyId: ossAccessKeyId,
                accessKeySecret: ossAccessKeySecret,
                bucket: bucketName
            });
        } else {
            console.warn(`oss config not set on environmental variables, exiting`);
            process.exit(-1)
        }

        const configFilePath = 'api.json';
        const uploadFileName = 'index.html';

        console.log(`uploading using access key ${ossAccessKeyId}`);
        let promiseHTML = ossStore.put(uploadFileName, `output/${uploadFileName}`);
        let promiseConfig = ossStore.put(configFilePath, `output/${configFilePath}`);
        await Promise.all([promiseHTML, promiseConfig])
    } catch (e) {
        console.warn(`upload failed!, ${e}`);
        process.exit(-1)
    }

}());
