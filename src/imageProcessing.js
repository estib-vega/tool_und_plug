const path = require('path');
var readline = require('readline');
const { read, AUTO, intToRGBA } = require('jimp');

const NUMBER_OF_ROWS_AND_COLUMNS = 32;
const COLORIZATION_LEVEL = 55;
const ERROR_MESSAGE_OF_INVALID_IMAGE = 'Unsupported MIME type:';

const totalPixelsToRender = NUMBER_OF_ROWS_AND_COLUMNS * NUMBER_OF_ROWS_AND_COLUMNS;

const isUnsupportedImage = error => error.message.startsWith(ERROR_MESSAGE_OF_INVALID_IMAGE);

const getPercentage = (currentProgress, total) => {
    const unit = total / 100.0;
    return Math.floor(currentProgress / unit);
};

const printProgressMessage = (i, j) => {
    const pixelsRendered = j + NUMBER_OF_ROWS_AND_COLUMNS * i + 1;
    const percentage = getPercentage(pixelsRendered, totalPixelsToRender);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${percentage}% - Rendered ${pixelsRendered} out of ${totalPixelsToRender} pixels`);
};

const calculatePixelSize = ({ width, height, img }) => {
    const minSize = width < height ? width : height;
    const pixelSize = Math.floor(minSize / NUMBER_OF_ROWS_AND_COLUMNS);
    return { img, pixelSize };
};

const pixelateAndResize = ({ img, pixelSize }) => {
    const size = pixelSize * NUMBER_OF_ROWS_AND_COLUMNS;
    img.resize(size, size)
        .pixelate(pixelSize);
    return { img, pixelSize };
};

const openAndPixelateImage = imagePath => read(imagePath)
    .then(img => ({ width: img.bitmap.width, height: img.bitmap.height, img }))
    .then(calculatePixelSize)
    .then(pixelateAndResize);

const resizeSubImage = (subImage, pixelSize) => {
    const width = subImage.bitmap.width;
    const height = subImage.bitmap.height;

    if(width < height)
        subImage.resize(pixelSize, AUTO);

    else
        subImage.resize(AUTO, pixelSize);

    subImage.crop(0, 0, pixelSize, pixelSize);
    return subImage;

};

const openAndColorizeSubImage = (subImagePath, color, pixelSize) => read(subImagePath)
    .then(subImage => resizeSubImage(subImage, pixelSize))
    .then(subImage => {
        subImage.color([{ apply: 'mix', params:[color, COLORIZATION_LEVEL] }]);
        return subImage;
    });

const getRandomPathFrom = downloadedImages => {
    const randomIndex = Math.floor(Math.random() * downloadedImages.length);
    return downloadedImages[randomIndex];
};

const generateImage = (srcImage, downloadedImagePaths) =>
    openAndPixelateImage(srcImage)
        .then(async imageData => {
            const cache = {};
            cache.imagePaths = downloadedImagePaths;

            for(let i = 0; i < NUMBER_OF_ROWS_AND_COLUMNS; i++) {
                for(let j = 0; j < NUMBER_OF_ROWS_AND_COLUMNS; j++) {
                    const randomImage = getRandomPathFrom(cache.imagePaths);
                    const pathOfRandomDownloadedImage = path.join('downloaded_imgs', randomImage);

                    const x = i * imageData.pixelSize;
                    const y = j * imageData.pixelSize;

                    const colorInt = imageData.img.getPixelColor(x, y);
                    const color = intToRGBA(colorInt);

                    try {
                        const subImage = await openAndColorizeSubImage(pathOfRandomDownloadedImage, color, imageData.pixelSize);
                        imageData.img.composite(subImage, x, y);
                        printProgressMessage(i, j);
                    } catch (error) {
                        if(isUnsupportedImage(error)) {
                            const indexOfInvalidImage = cache.imagePaths.indexOf(randomImage);
                            cache.imagePaths.splice(indexOfInvalidImage, 1);
                        }
                        j--;
                    }
                }
            }
            return imageData.img;
        })
        .then(img => img.write('img/out.jpg'))
        .catch(error => console.log('Error: generateImage:', error.message));

module.exports = generateImage;