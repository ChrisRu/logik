export const colors = [
	"#dc5fdc",
	"#69be53",
	"#6ca9a9",
	"#cd9766",
	"#cb665b",
	"#598fbf",
	"#6c6c6c",
	"#6567e1",
	"#feb953",
	"#953feb",
]

const hexLetters = "0123456789abcdef"
export function createRandomColor(): string {
	const color = Array(6)
		.fill("0")
		.map(() => hexLetters[Math.floor(Math.random() * 16)])

	const contrast = [
		hexLetters.indexOf(color[1]),
		hexLetters.indexOf(color[3]),
		hexLetters.indexOf(color[5]),
	]
	const tooBright = contrast.every((index) => index > 11)
	if (tooBright) {
		return createRandomColor()
	}

	return "#" + color.join("")
}
