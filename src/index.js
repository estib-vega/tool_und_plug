const fs = require('fs-extra');
const generateImage = require('./imageProcessing');
const { OUTPUT_DIR, downloadImagesOf } = require('./request');

const getQuery = () => {
    const queryList = [];
    const argumentLength = process.argv.length;
    for(let i = 2; i < argumentLength; i++)
        queryList.push(process.argv[i]);

    return argumentLength === 2 ? null : queryList;
};

const query = getQuery() || ['lion'];
downloadImagesOf(query)
    .then(() => console.log('Downloaded images of', ...query))
    .then(async () => {
        const downloadedImagePaths = fs.readdirSync(OUTPUT_DIR);
        await generateImage('img/yo.jpg', downloadedImagePaths);
    })
    .then(() => fs.removeSync(OUTPUT_DIR))
    .catch(error => console.log('Error: index:', error.message));
