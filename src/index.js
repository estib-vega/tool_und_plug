const fs = require('fs-extra');
const generateImage = require('./imageProcessing');
const { OUTPUT_DIR, downloadImagesOf } = require('./request');

const COLOR_RED = '\x1b[91m%s\x1b[0m';

const getArguments = () => {
    const args = {};
    let lastFlag;
    const argumentLength = process.argv.length;
    for(let i = 3; i < argumentLength; i++) {
        const argument = process.argv[i];
        if (argument.startsWith('-')){
            const flagName = argument.replace(/[-]/g, '').trim();
            if(flagName === '') {
                console.log(COLOR_RED, 'Invalid flag!');
                process.exit(1);
            }
            lastFlag = flagName;
            args[flagName] = [];
        } else {
            if(lastFlag)
                args[lastFlag].push(argument);
        }
    }

    if(!args.q && !args.query) {
        console.log(COLOR_RED, 'Please specify a query to do the Google image search: `-q some query` or `--query some other query`');
        process.exit(1);
    }

    return args;
};

const parseQuery = args => (args.query && args.query.length > 0 && args.query) || (args.q && args.q.length > 0 && args.q) || ['lion'];

const sourceImage = process.argv[2];

if(!fs.existsSync(sourceImage)) {
    console.log(COLOR_RED, 'First argument should be a path to a valid image. Image unexistant!');
    process.exit(1);
}

const args = getArguments();

const query = parseQuery(args);

downloadImagesOf(query, args)
    .then(() => console.log('Downloaded images of', ...query))
    .then(async () => {
        const downloadedImagePaths = fs.readdirSync(OUTPUT_DIR);
        await generateImage(sourceImage, downloadedImagePaths, args);
    })
    .then(() => fs.removeSync(OUTPUT_DIR))
    .catch(error => console.log(COLOR_RED, 'Error: index:', error.message));
