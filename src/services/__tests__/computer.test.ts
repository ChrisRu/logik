import {
	AND,
	NOT,
	NAND,
	OR,
	Component,
	ICustomComponent,
	Operator,
	IPin,
	isSameComponent,
	isSamePin,
	evaluate,
	computeTurnedOnPins,
	IConnection,
} from "../computer"
import * as uuid from "uuid"

it("should not be the same component", () => {
	const TRUE: Operator = () => [true]
	const FALSE: Operator = () => [false]

	expect(
		isSameComponent(new Component("x", TRUE, "#ff0000"), new Component("y", FALSE, "#000000")),
	).toBeFalsy()
})

it("should not be the same component, even though they have similar contents", () => {
	const FALSE: Operator = () => [false]

	expect(
		isSameComponent(
			new Component("name", FALSE, "#000000"),
			new Component("name", FALSE, "#000000"),
		),
	).toBeFalsy()
})

it("should be the same component", () => {
	const FALSE: Operator = () => [false]

	const component = new Component("name", FALSE, "#000000")

	expect(isSameComponent(component, component)).toBeTruthy()
})

it("should be the same component deserialized", () => {
	const FALSE: Operator = () => [false]

	const component1 = new Component("name", FALSE, "#000000")
	const component2 = Object.assign(
		new Component("", FALSE, "#ffffff"),
		JSON.parse(JSON.stringify(component1)),
	)

	expect(isSameComponent(component1, component2)).toBeTruthy()
})

it("should not be the same pin", () => {
	const FALSE: Operator = () => [false]

	const pin1: IPin = {
		index: 0,
		content: new Component("test", FALSE, "#ff0000"),
		type: "output",
	}

	const pin2: IPin = {
		index: 1,
		type: "global-input",
	}

	expect(isSamePin(pin1, pin2)).toBeFalsy()
})

it("should not be the same pin with a different component", () => {
	const FALSE: Operator = () => [false]

	const pin1: IPin = {
		index: 0,
		content: new Component("", FALSE, "#fffff"),
		type: "output",
	}

	const pin2: IPin = {
		index: 0,
		content: new Component("", FALSE, "#fffff"),
		type: "output",
	}

	expect(isSamePin(pin1, pin2)).toBeFalsy()
})

it("should be the same global input pin", () => {
	const pin1: IPin = {
		index: 1,
		type: "global-output",
	}

	const pin2: IPin = {
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
	)

	const pin1: IPin = {
		index: 1,
		content: component1,
		type: "output",
	}

	const pin2: IPin = {
		index: 1,
		content: component2,
		type: "output",
	}

	expect(isSamePin(pin1, pin2)).toBeTruthy()
})

it("should evaluate basic operator", () => {
	const operator: Operator = () => [false]

	expect(evaluate(operator, [])).toEqual([false])
})

it("should evaluate NAND operator", () => {
	const operator = NAND

	expect(evaluate(operator, [false, false])).toEqual([true])
	expect(evaluate(operator, [false, true])).toEqual([true])
	expect(evaluate(operator, [false, true])).toEqual([true])
	expect(evaluate(operator, [true, true])).toEqual([false])
})

it("should evaluate AND operator", () => {
	const operator = AND

	expect(evaluate(operator, [false, false])).toEqual([false])
	expect(evaluate(operator, [false, true])).toEqual([false])
	expect(evaluate(operator, [false, true])).toEqual([false])
	expect(evaluate(operator, [true, true])).toEqual([true])
})

it("should evaluate NOT operator", () => {
	const operator = NOT

	expect(evaluate(operator, [false])).toEqual([true])
	expect(evaluate(operator, [true])).toEqual([false])
})

it("should evaluate OR operator", () => {
	const operator = OR

	expect(evaluate(operator, [false, false])).toEqual([false])
	expect(evaluate(operator, [false, true])).toEqual([true])
	expect(evaluate(operator, [false, true])).toEqual([true])
	expect(evaluate(operator, [true, true])).toEqual([true])
})

it("should evaluate custom direct component", () => {
	const operator: ICustomComponent = {
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

	expect(evaluate(operator, [false, false])).toEqual([false, false])
	expect(evaluate(operator, [true, false])).toEqual([false, true])
	expect(evaluate(operator, [false, true])).toEqual([true, false])
	expect(evaluate(operator, [true, true])).toEqual([true, true])
})

it("should evaluate custom NOT component", () => {
	const component = new Component("NOT", NOT, "#ff0000")

	const operator: ICustomComponent = {
		connections: [
			{
				key: uuid.v4(),
				from: {
					index: 0,
					type: "global-output",
				},
				to: {
					index: 0,
					content: component,
					type: "input",
				},
			},
			{
				key: uuid.v4(),
				from: {
					index: 1,
					content: component,
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

	expect(evaluate(operator, [false])).toEqual([true])
	expect(evaluate(operator, [true])).toEqual([false])
})

it("should evaluate custom NOT component", () => {
	const component = new Component("NOT", NOT, "#ff0000")

	const operator: ICustomComponent = {
		connections: [
			{
				key: uuid.v4(),
				from: {
					index: 0,
					type: "global-output",
				},
				to: {
					index: 0,
					content: component,
					type: "input",
				},
			},
			{
				key: uuid.v4(),
				from: {
					index: 1,
					content: component,
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

	expect(evaluate(operator, [false])).toEqual([true])
	expect(evaluate(operator, [true])).toEqual([false])
})

it("should compute custom NOT component", () => {
	const component = new Component("NOT", NOT, "#ff0000")

	const connections: IConnection[] = [
		{
			key: uuid.v4(),
			from: {
				index: 0,
				type: "global-output",
			},
			to: {
				index: 0,
				content: component,
				type: "input",
			},
		},
		{
			key: uuid.v4(),
			from: {
				index: 1,
				content: component,
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
