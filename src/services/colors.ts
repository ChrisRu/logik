function calculateLuminance(r: number, g: number, b: number) {
	const a = [r, g, b].map((v) => {
		v /= 255
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
	})
	return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

export function createRandomDarkColor(): string {
	const r = Math.floor(Math.random() * 256)
	const g = Math.floor(Math.random() * 256)
	const b = Math.floor(Math.random() * 256)

	const luminance = calculateLuminance(r, g, b)
	const contrastRatioWithWhite = 1.05 / (luminance + 0.05)
	if (contrastRatioWithWhite < 3) {
		return createRandomDarkColor()
	}

	return "#" + [r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")
}

const reservedColors = [
	"#cb665b",
	"#cd9766",
	"#639d54",
	"#598fbf",
	"#7c4bae",
	"#bf6aa6",
	"#4f928c",
]

export const colors = [
	"#6c6c6c",
	"#765b4c",
	"#bcb65b",
	"#6567e1",
]

export const operatorColors = {
	NOT: reservedColors[0],
	INV: reservedColors[0],
	XOR: reservedColors[1],
	"X-OR": reservedColors[1],
	NOR: reservedColors[2],
	"N-OR": reservedColors[2],
	AND: reservedColors[3],
	NAND: reservedColors[4],
	"N-AND": reservedColors[5],
	OR: reservedColors[6],
}
