import {
	AND,
	NOT,
	NAND,
	OR,
	Component,
	CustomOperator,
	Operator,
	Pin,
	isSameChip,
	isSamePin,
	evaluate,
	computeTurnedOnPins,
	Connection,
} from "../computer"
import * as uuid from "uuid"

it("should not be the same component", () => {
	const TRUE: Operator = () => [true]
	const FALSE: Operator = () => [false]

	expect(
		isSameChip(
			{
				key: "x",
				x: 0,
				y: 0,
				component: new Component("x", TRUE, "#ff0000"),
			},
			{
				key: "y",
				x: 0,
				y: 0,
				component: new Component("y", FALSE, "#000000"),
			},
		),
	).toBeFalsy()
})

it("should not be the same component, even though they have similar contents", () => {
	const FALSE: Operator = () => [false]

	expect(
		isSameChip(
			{
				key: "x",
				x: 0,
				y: 0,
				component: new Component("name", FALSE, "#000000"),
			},
			{
				key: "y",
				x: 0,
				y: 0,
				component: new Component("name", FALSE, "#000000"),
			},
		),
	).toBeFalsy()
})

it("should be the same component", () => {
	const FALSE: Operator = () => [false]

	const component = {
		key: "x",
		x: 0,
		y: 0,
		component: new Component("name", FALSE, "#000000"),
	}

	expect(isSameChip(component, component)).toBeTruthy()
})

it("should not be the same pin", () => {
	const FALSE: Operator = () => [false]

	const pin1: Pin = {
		index: 0,
		chip: {
			key: "chip1",
			x: 0,
			y: 0,
			component: new Component("test", FALSE, "#ff0000"),
		},
		type: "output",
	}

	const pin2: Pin = {
		index: 1,
		type: "global-input",
	}

	expect(isSamePin(pin1, pin2)).toBeFalsy()
})

it("should not be the same pin with a different component", () => {
	const FALSE: Operator = () => [false]

	const pin1: Pin = {
		index: 0,
		chip: {
			key: "asdf",
			x: 0,
			y: 0,
			component: new Component("", FALSE, "#fffff"),
		},
		type: "output",
	}

	const pin2: Pin = {
		index: 0,
		chip: {
			key: "fdsa",
			x: 0,
			y: 0,
			component: new Component("", FALSE, "#fffff"),
		},
		type: "output",
	}

	expect(isSamePin(pin1, pin2)).toBeFalsy()
})

it("should be the same global input pin", () => {
	const pin1: Pin = {
		index: 1,
		type: "global-output",
	}

	const pin2: Pin = {
		index: 1,
		type: "global-output",
	}

	expect(isSamePin(pin1, pin2)).toBeTruthy()
})

it("should be the same component pin", () => {
	const FALSE: Operator = () => [false]

	const component1 = new Component("name", FALSE, "#000000")
	const component2 = Object.assign(
		new Component("", FALSE, "#ffffff"),
		JSON.parse(JSON.stringify(component1)),
	) as Component

	const pin1: Pin = {
		index: 1,
		chip: {
			key: "chip1",
			x: 0,
			y: 0,
			component: component1,
		},
		type: "output",
	}

	const pin2: Pin = {
		index: 1,
		chip: {
			key: "chip1",
			x: 0,
			y: 0,
			component: component2,
		},
		type: "output",
	}

	expect(isSamePin(pin1, pin2)).toBeTruthy()
})

it("should evaluate basic operator", () => {
	const operator: Operator = () => [false]
	const component = new Component('FALSE', operator, '#ff0000')

	expect(evaluate(component, [])).toEqual([false])
})

it("should evaluate NAND operator", () => {
	const operator = NAND
	const component = new Component('NAND', operator, '#ff0000')

	expect(evaluate(component, [false, false])).toEqual([true])
	expect(evaluate(component, [false, true])).toEqual([true])
	expect(evaluate(component, [false, true])).toEqual([true])
	expect(evaluate(component, [true, true])).toEqual([false])
})

it("should evaluate AND operator", () => {
	const operator = AND
	const component = new Component('AND', operator, '#ff0000')

	expect(evaluate(component, [false, false])).toEqual([false])
	expect(evaluate(component, [false, true])).toEqual([false])
	expect(evaluate(component, [false, true])).toEqual([false])
	expect(evaluate(component, [true, true])).toEqual([true])
})

it("should evaluate NOT operator", () => {
	const operator = NOT
	const component = new Component('NOT', operator, '#ff0000')

	expect(evaluate(component, [false])).toEqual([true])
	expect(evaluate(component, [true])).toEqual([false])
})

it("should evaluate OR operator", () => {
	const operator = OR
	const component = new Component('OR', operator, '#ff0000')

	expect(evaluate(component, [false, false])).toEqual([false])
	expect(evaluate(component, [false, true])).toEqual([true])
	expect(evaluate(component, [false, true])).toEqual([true])
	expect(evaluate(component, [true, true])).toEqual([true])
})

it("should evaluate custom direct component", () => {
	const operator: CustomOperator = {
		connections: [
			{
				key: uuid.v4(),
				from: {
					index: 0,
					type: "global-output",
				},
				to: {
					index: 1,
					type: "global-input",
				},
			},
			{
				key: uuid.v4(),
				from: {
					index: 1,
					type: "global-output",
				},
				to: {
					index: 0,
					type: "global-input",
				},
			},
		],
		inputs: 2,
		outputs: 2,
	}
	const component = new Component('CUSTOM', operator, '#00ff00')

	expect(evaluate(component, [false, false])).toEqual([false, false])
	expect(evaluate(component, [true, false])).toEqual([false, true])
	expect(evaluate(component, [false, true])).toEqual([true, false])
	expect(evaluate(component, [true, true])).toEqual([true, true])
})

it("should evaluate custom NOT component", () => {
	const NOTComponent = new Component("NOT", NOT, "#ff0000")

	const operator: CustomOperator = {
		connections: [
			{
				key: uuid.v4(),
				from: {
					index: 0,
					type: "global-output",
				},
				to: {
					index: 0,
					chip: {
						key: "chip1",
						x: 0,
						y: 0,
						component: NOTComponent,
					},
					type: "input",
				},
			},
			{
				key: uuid.v4(),
				from: {
					index: 1,
					chip: {
						key: "chip1",
						x: 0,
						y: 0,
						component: NOTComponent,
					},
					type: "input",
				},
				to: {
					index: 0,
					type: "global-input",
				},
			},
		],
		inputs: 1,
		outputs: 1,
	}
	const component = new Component('INV', operator, '#0000ff')

	expect(evaluate(component, [false])).toEqual([true])
	expect(evaluate(component, [true])).toEqual([false])
})

it("should evaluate custom NOT component", () => {
	const NOTComponent = new Component("NOT", NOT, "#ff0000")

	const operator: CustomOperator = {
		connections: [
			{
				key: uuid.v4(),
				from: {
					index: 0,
					type: "global-output",
				},
				to: {
					index: 0,
					chip: {
						key: "chip1",
						x: 0,
						y: 0,
						component: NOTComponent,
					},
					type: "input",
				},
			},
			{
				key: uuid.v4(),
				from: {
					index: 1,
					chip: {
						key: "chip1",
						x: 0,
						y: 0,
						component: NOTComponent,
					},
					type: "input",
				},
				to: {
					index: 0,
					type: "global-input",
				},
			},
		],
		inputs: 1,
		outputs: 1,
	}
	const component = new Component('CUSTOM', operator, '#880088')

	expect(evaluate(component, [false])).toEqual([true])
	expect(evaluate(component, [true])).toEqual([false])
})

it("should compute custom NOT component", () => {
	const component = new Component("NOT", NOT, "#ff0000")

	const connections: Connection[] = [
		{
			key: uuid.v4(),
			from: {
				index: 0,
				type: "global-output",
			},
			to: {
				index: 0,
				chip: {
					key: "chip1",
					x: 0,
					y: 0,
					component,
				},
				type: "input",
			},
		},
		{
			key: uuid.v4(),
			from: {
				index: 1,
				chip: {
					key: "chip1",
					x: 0,
					y: 0,
					component,
				},
				type: "output",
			},
			to: {
				index: 0,
				type: "global-input",
			},
		},
	]

	expect(computeTurnedOnPins(connections, [true])).toEqual(new Set([connections[0].from]))
	expect(computeTurnedOnPins(connections, [false])).toEqual(
		new Set([connections[1].from, connections[1].to]),
	)
})
