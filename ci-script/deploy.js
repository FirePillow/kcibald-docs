let oss = require('ali-oss');
const uploadFileName = 'index.html';

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

        console.log(`uploading using access key ${ossAccessKeyId}`);
        await ossStore.put(uploadFileName, `output/${uploadFileName}`);
    } catch (e) {
        console.warn(`upload failed!, ${e}`);
        process.exit(-1)
    }
}());
