const { read, RESIZE_BEZIER, intToRGBA } = require('jimp');

read('img/map.jpg')
    .then(img => {
        const width = img.bitmap.width;
        const height = img.bitmap.height;

        const minSize = width < height ? width : height;
        const pixelSize = Math.floor(minSize / 32);
        const size = pixelSize * 32;

        img.resize(size, size)
            .pixelate(pixelSize);

        return {
            img,
            pixelSize,
        };
    })
    .then(pixelImg => {
        read('img/srcImg/croc.jpg')
            .then(croc => {
                croc.resize(pixelImg.pixelSize, pixelImg.pixelSize, RESIZE_BEZIER);

                for(let i = 0; i < 32; i++) {
                    for(let j = 0; j < 32; j++) {
                        const copy = croc.clone();
                        let x = i * pixelImg.pixelSize;
                        let y = j * pixelImg.pixelSize;

                        const color = pixelImg.img.getPixelColor(x, y);
                        const { r, g, b } = intToRGBA(color);

                        copy.color([{ apply: 'mix', params: [{ r, g, b }, 55] }]);
                        pixelImg.img.composite(copy, x, y);
                    }
                }
                return pixelImg.img;
            })
            .then(img => img.write('img/out.jpg'));
    });
