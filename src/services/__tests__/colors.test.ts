import { createRandomColor, colors } from "../colors"

test("should create valid color", () => {
	expect(createRandomColor()).toMatch(/^#[a-f0-9]{6}$/)
})

test("should have valid colors", () => {
	for (const color of colors) {
		expect(color).toMatch(/^#[a-f0-9]{6}$/)
	}
})
