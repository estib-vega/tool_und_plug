const { read, RESIZE_BEZIER } = require('jimp')

read('img/map.jpg', (err, img) => {
	if (err) console.log(err.message)

	const width = img.bitmap.width
	const height = img.bitmap.height

	const minSize = width < height ? width : height
    const pixelSize = Math.floor(minSize / 32)
    const size = pixelSize * 32
    
	img.resize(size, size)
		.pixelate(pixelSize)
        
        
    read('img/croc.jpg', (err, croc) => {
        croc.resize(pixelSize, pixelSize, RESIZE_BEZIER)
        for(let i = 0; i < 32; i++) {
            for(let j = 0; j < 32; j++) {
                img.composite(croc, i * pixelSize, j * pixelSize, {opacitySource: 0.65})
            }
        }
        img.write('img/out.jpg')
    })  
})
