export const colors = [
	"#dc5fdc",
	"#feb953",
	"#953feb",
	"#69be53",
	"#6ca9a9",
	"#cd9766",
	"#cb665b",
	"#598fbf",
	"#6c6c6c",
	"#6567e1",
]

export function createRandomColor(): string {
	var letters = "0123456789ABCDEF"
	var color = "#"
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)]
	}

	const contrast = [letters.indexOf(color[1]), letters.indexOf(color[3]), letters.indexOf(color[5])]

	if (contrast.every((index) => index > 11)) {
		return createRandomColor()
	}

	return color
}
