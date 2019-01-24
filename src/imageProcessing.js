const path = require('path');
var readline = require('readline');
const { read, AUTO, intToRGBA } = require('jimp');

const NUMBER_OF_ROWS_AND_COLUMNS = 32;
const COLORIZATION_LEVEL = 55;
const ERROR_MESSAGE_OF_INVALID_IMAGE = 'Unsupported MIME type:';
const DEFAULT_OUTPUT_IMAGE_PATH = path.join(process.cwd(), 'out.jpg');

let globalArgs = {};

const isUnsupportedImage = error => error.message.startsWith(ERROR_MESSAGE_OF_INVALID_IMAGE);

<<<<<<< HEAD
const getNumberOfRowsAndColumns = () => (globalArgs.size && globalArgs.size.length > 0 && globalArgs.size[0]) ||
                                        (globalArgs.s && globalArgs.s.length > 0 && globalArgs.s[0]) ||
                                        NUMBER_OF_ROWS_AND_COLUMNS;

const parseOutput = () => (globalArgs.output && globalArgs.output.length === 1 && globalArgs.output[0]) ||
                          (globalArgs.o && globalArgs.o.length === 1 && globalArgs.o[0]) ||
                          DEFAULT_OUTPUT_IMAGE_PATH;

=======
const getNumberOfRowsAndColumns = () => (globalArgs.size && globalArgs.size.length > 0 && globalArgs.size) ||
                                        (globalArgs.s && globalArgs.s.length > 0 && globalArgs.s) ||
                                        NUMBER_OF_ROWS_AND_COLUMNS;

>>>>>>> 07a92399784353430ee9078b8da79c952c079a34

const getTotalPixelsToRender = () => getNumberOfRowsAndColumns() * getNumberOfRowsAndColumns();

const getPercentage = (currentProgress, total) => {
    const unit = total / 100.0;
    return Math.floor(currentProgress / unit);
};

const printProgressMessage = (i, j) => {
    const pixelsRendered = j + getNumberOfRowsAndColumns() * i + 1;
    const percentage = getPercentage(pixelsRendered, getTotalPixelsToRender());
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${percentage}% - Rendered ${pixelsRendered} out of ${getTotalPixelsToRender()} pixels`);
};

const calculatePixelSize = ({ width, height, img }) => {
    const minSize = width < height ? width : height;
    const pixelSize = Math.floor(minSize / getNumberOfRowsAndColumns());
    return { img, pixelSize, width, height };
};

const pixelateAndResize = ({ img, pixelSize, width, height }) => {
    const size = pixelSize * getNumberOfRowsAndColumns();
    if(width < height)
        img.resize(size, AUTO);
    else
        img.resize(AUTO, size);
    img.crop(0, 0, size, size).pixelate(pixelSize);

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

const generateImage = async (srcImage, downloadedImagePaths, args) => {
    globalArgs = args;
    await openAndPixelateImage(srcImage)
        .then(async imageData => {
            const cache = {};
            cache.imagePaths = downloadedImagePaths;

            for(let i = 0; i < getNumberOfRowsAndColumns(); i++) {
                for(let j = 0; j < getNumberOfRowsAndColumns(); j++) {
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
        .then(img => img.write(parseOutput()))
        .catch(error => console.log('Error: generateImage:', error.message));
};
module.exports = generateImage;