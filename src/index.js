const { read } = require('jimp')

read('img/map.jpeg', (err, img) => {
	if (err) console.log(err.message)

	const width = img.bitmap.width
	const height = img.bitmap.height

	console.log(width, height)

	img.pixelate(30).write('img/out.jpg')
    
})