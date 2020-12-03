import { createRandomDarkColor, colors, operatorColors } from "../colors"

test("should create valid color", () => {
	expect(createRandomDarkColor()).toMatch(/^#[a-f0-9]{6}$/)
})

test("should have valid colors", () => {
	for (const color of colors) {
		expect(color).toMatch(/^#[a-f0-9]{6}$/)
	}

	for (const color of Object.values(operatorColors)) {
		expect(color).toMatch(/^#[a-f0-9]{6}$/)
	}
})
