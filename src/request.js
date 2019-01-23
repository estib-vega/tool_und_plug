const requestPromise = require('request-promise');
const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');

const REQUEST_HEADER = { 'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36' };
const OUTPUT_DIR = 'downloaded_imgs';
const IMAGE_DATA_CONTAINER_SELECTOR = 'div.rg_meta';
const NUMBER_OF_DOWNLOADED_IMAGES = 32;
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png'];

const outputDirPath = path.join(process.cwd(), OUTPUT_DIR);

const buildUrl = (query) => `https://www.google.co.in/search?q=${query.join('+')}&tbs=isz:m&source=lnms&tbm=isch`;

const isAllowedImageType = type => ALLOWED_IMAGE_TYPES.includes(type.toLowerCase());

const getGoogleImagesSiteFor = query => requestPromise({
    uri: buildUrl(query),
    headers: REQUEST_HEADER,
});

const getImageData = (allDivs, divId) => {
    const imageDataString = allDivs[divId].children.find(child => child.type === 'text').data;
    return JSON.parse(imageDataString);
};

const setUpDownloadDirectory = () => {
    fs.removeSync(outputDirPath);
    fs.mkdirpSync(outputDirPath);
};

const getAllDivs = response => {
    const $ = cheerio.load(response);
    return $(IMAGE_DATA_CONTAINER_SELECTOR);
};

const getImagesTypeAndUrlList = (response) => {
    const allDivs = getAllDivs(response);
    const imageDataList = [];
    let indexShift = 1;

    for(let i = 0; i < NUMBER_OF_DOWNLOADED_IMAGES; i++) {
        const divId = String(i + indexShift);
        const imageData = getImageData(allDivs, divId);
        if(isAllowedImageType(imageData.ity))
            imageDataList.push({ imageType: imageData.ity, imageUrl: imageData.ou });
        else {
            i--;
            indexShift += 1;
        }
    }

    return imageDataList;
};

const buildImagePath = (index, imageType) => {
    const imageName = `${index + 1}.outImage.${imageType}`;
    return path.join(outputDirPath, imageName);
};

const downloadSingleImage = ({ imageType, imageUrl }, index) => new Promise((resolve, reject) => {
    const stream = request({ uri: imageUrl, headers: REQUEST_HEADER }, (error) => {
        if(error)
            reject('Could not download');
    })
        .pipe(
            fs.createWriteStream(
                buildImagePath(index, imageType)
            )
        );
    stream.on('close', resolve);
});

const downloadImagesFromList = imageDataList =>
    imageDataList.forEach(async (imageData, index) => {
        await downloadSingleImage(imageData, index).catch(error => error);
    });

const downloadImagesOf = searchQuery =>{
    setUpDownloadDirectory();
    return getGoogleImagesSiteFor(searchQuery)
        .then(getImagesTypeAndUrlList)
        .then(downloadImagesFromList)
        .catch(e => console.log(e.message));
};

module.exports = { downloadImagesOf, OUTPUT_DIR };