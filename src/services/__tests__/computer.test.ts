import {
	Gate,
	CustomOperator,
	Operator,
	Pin,
	isSameChip,
	isSamePin,
	evaluate,
	computePinState,
	Connection,
	operators,
} from "../computer"
import * as uuid from "uuid"

it("should not be the same gate", () => {
	const TRUE: Operator = () => [true]
	const FALSE: Operator = () => [false]

	expect(
		isSameChip(
			{
				key: "x",
				x: 0,
				y: 0,
				gate: new Gate("x", TRUE, "#ff0000"),
			},
			{
				key: "y",
				x: 0,
				y: 0,
				gate: new Gate("y", FALSE, "#000000"),
			},
		),
	).toBeFalsy()
})

it("should not be the same gate, even though they have similar contents", () => {
	const FALSE: Operator = () => [false]

	expect(
		isSameChip(
			{
				key: "x",
				x: 0,
				y: 0,
				gate: new Gate("name", FALSE, "#000000"),
			},
			{
				key: "y",
				x: 0,
				y: 0,
				gate: new Gate("name", FALSE, "#000000"),
			},
		),
	).toBeFalsy()
})

it("should be the same gate", () => {
	const FALSE: Operator = () => [false]

	const gate = {
		key: "x",
		x: 0,
		y: 0,
		gate: new Gate("name", FALSE, "#000000"),
	}

	expect(isSameChip(gate, gate)).toBeTruthy()
})

it("should not be the same pin", () => {
	const FALSE: Operator = () => [false]

	const pin1: Pin = {
		index: 0,
		chip: {
			key: "chip1",
			x: 0,
			y: 0,
			gate: new Gate("test", FALSE, "#ff0000"),
		},
		type: "output",
	}

	const pin2: Pin = {
		index: 1,
		type: "global-input",
	}

	expect(isSamePin(pin1, pin2)).toBeFalsy()
})

it("should not be the same pin with a different gate", () => {
	const FALSE: Operator = () => [false]

	const pin1: Pin = {
		index: 0,
		chip: {
			key: "asdf",
			x: 0,
			y: 0,
			gate: new Gate("", FALSE, "#fffff"),
		},
		type: "output",
	}

	const pin2: Pin = {
		index: 0,
		chip: {
			key: "fdsa",
			x: 0,
			y: 0,
			gate: new Gate("", FALSE, "#fffff"),
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

it("should be the same gate pin", () => {
	const FALSE: Operator = () => [false]

	const gate1 = new Gate("name", FALSE, "#000000")
	const gate2 = Object.assign(
		new Gate("", FALSE, "#ffffff"),
		JSON.parse(JSON.stringify(gate1)),
	) as Gate

	const pin1: Pin = {
		index: 1,
		chip: {
			key: "chip1",
			x: 0,
			y: 0,
			gate: gate1,
		},
		type: "output",
	}

	const pin2: Pin = {
		index: 1,
		chip: {
			key: "chip1",
			x: 0,
			y: 0,
			gate: gate2,
		},
		type: "output",
	}

	expect(isSamePin(pin1, pin2)).toBeTruthy()
})

it("should evaluate basic operator", () => {
	const operator: Operator = () => [false]
	const gate = new Gate("FALSE", operator, "#ff0000")

	expect(evaluate(gate, [])).toEqual([false])
})

it("should evaluate NAND operator", () => {
	const gate = new Gate("NAND", operators.NAND, "#ff0000")

	expect(evaluate(gate, [false, false])).toEqual([true])
	expect(evaluate(gate, [false, true])).toEqual([true])
	expect(evaluate(gate, [false, true])).toEqual([true])
	expect(evaluate(gate, [true, true])).toEqual([false])
})

it("should evaluate AND operator", () => {
	const gate = new Gate("AND", operators.AND, "#ff0000")

	expect(evaluate(gate, [false, false])).toEqual([false])
	expect(evaluate(gate, [false, true])).toEqual([false])
	expect(evaluate(gate, [false, true])).toEqual([false])
	expect(evaluate(gate, [true, true])).toEqual([true])
})

it("should evaluate NOT operator", () => {
	const gate = new Gate("NOT", operators.NOT, "#ff0000")

	expect(evaluate(gate, [false])).toEqual([true])
	expect(evaluate(gate, [true])).toEqual([false])
})

it("should evaluate OR operator", () => {
	const gate = new Gate("OR", operators.OR, "#ff0000")

	expect(evaluate(gate, [false, false])).toEqual([false])
	expect(evaluate(gate, [false, true])).toEqual([true])
	expect(evaluate(gate, [false, true])).toEqual([true])
	expect(evaluate(gate, [true, true])).toEqual([true])
})

it("should evaluate custom direct gate", () => {
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
	const gate = new Gate("CUSTOM", operator, "#00ff00")

	expect(evaluate(gate, [false, false])).toEqual([false, false])
	expect(evaluate(gate, [true, false])).toEqual([false, true])
	expect(evaluate(gate, [false, true])).toEqual([true, false])
	expect(evaluate(gate, [true, true])).toEqual([true, true])
})

it("should evaluate custom NOT gate", () => {
	const NOTGate = new Gate("NOT", operators.NOT, "#ff0000")

	const chip = {
		key: "chip1",
		x: 0,
		y: 0,
		gate: NOTGate,
	}

	const operator: CustomOperator = {
		connections: [
			{
				key: uuid.v4(),
				from: {
					type: "global-output",
					index: 0,
				},
				to: {
					type: "input",
					index: 0,
					chip,
				},
			},
			{
				key: uuid.v4(),
				from: {
					type: "output",
					index: 1,
					chip,
				},
				to: {
					type: "global-input",
					index: 0,
				},
			},
		],
		inputs: 1,
		outputs: 1,
	}
	const gate = new Gate("INV", operator, "#880088")

	expect(evaluate(gate, [false])).toEqual([true])
	expect(evaluate(gate, [true])).toEqual([false])
})

it("should compute custom NOT gate", () => {
	const gate = new Gate("NOT", operators.NOT, "#ff0000")

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
					gate: gate,
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
					gate: gate,
				},
				type: "output",
			},
			to: {
				index: 0,
				type: "global-input",
			},
		},
	]

	expect(computePinState(connections, [true])).toEqual({
		turnedOnPins: new Set([connections[0].from, connections[0].to]),
		turnedOffPins: new Set([connections[1].from, connections[1].to]),
	})
	expect(computePinState(connections, [false])).toEqual({
		turnedOnPins: new Set([connections[1].from, connections[1].to]),
		turnedOffPins: new Set([connections[0].from, connections[0].to]),
	})
})
