const fs = require('fs-extra');
const generateImage = require('./imageProcessing');
const { OUTPUT_DIR, downloadImagesOf } = require('./request');

const query = process.argv[2] || 'lion';
downloadImagesOf(query)
    .then(() => console.log('Downloaded images of', query))
    .then(async () => {
        const downloadedImagePaths = fs.readdirSync(OUTPUT_DIR);
        await generateImage('img/map.jpg', downloadedImagePaths);
    })
    .then(() => fs.removeSync(OUTPUT_DIR))
    .catch(error => console.log('Error: index:', error.message));
