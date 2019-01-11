const requestPromise = require('request-promise');
const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');

const REQUEST_HEADER = { 'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36' };
const OUTPUT_DIR = 'downloaded_imgs';
const buildUrl = query => `https://www.google.co.in/search?q=${query}&source=lnms&tbm=isch`;


const getGoogleImagesSiteFor = query => requestPromise({
    uri: buildUrl(query),
    headers: REQUEST_HEADER,
});

getGoogleImagesSiteFor('raccoon')
    .then(response => {
        const $ = cheerio.load(response);
        const allDivs = $('div.rg_meta');
        const imageDataString = allDivs['1'].children.find(child => child.type === 'text').data;
        const imageData = JSON.parse(imageDataString);

        return { imageType: imageData.ity, imageUrl: imageData.ou };
    }).then(({ imageType, imageUrl }) => {
        const outputDirPath = path.join(process.cwd(), OUTPUT_DIR);
        fs.mkdirpSync(outputDirPath);
        const imageName = `outImage.${imageType}`;
        const imagePath = path.join(outputDirPath, imageName);

        request({ uri: imageUrl, headers: REQUEST_HEADER }).pipe(fs.createWriteStream(imagePath));
    });
