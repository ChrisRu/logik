import * as uuid from "uuid"
import calculateSize from "calculate-size"
import {
	computeTruthTable,
	getResultFromTruthTable,
	TruthTableLookup,
	truthTableToLookup,
} from "./truthTable"

export type Operator = (...params: (boolean | 0 | 1)[]) => boolean[]

const NOT: Operator = (a) => [!a]

const AND: Operator = (a, b) => [!!a && !!b]

const NAND: Operator = (a, b) => NOT(...AND(a, b))

const OR: Operator = (a, b) => NAND(...NOT(a), ...NOT(b))

const XOR: Operator = (a, b) => AND(...NAND(a, b), ...OR(a, b))

const NOR: Operator = (a, b) => NOT(...OR(a, b))

const XNOR: Operator = (a, b) => OR(...NOR(a, b), ...AND(a, b))

const NOTHING: Operator = (a) => [!!a]

export const operators = {
	NOT,
	AND,
	NAND,
	OR,
	XOR,
	NOR,
	XNOR,
	NOTHING
}

export function getOperatorNameByOperator(operator: Operator) {
	for (const [key, value] of Object.entries(operators)) {
		if (value === operator) {
			return key
		}
	}
}

export interface Point {
	x: number
	y: number
}

export interface CustomOperator {
	connections: Connection[]
	outputs: number
	inputs: number
}

export interface Chip {
	key: string
	x: number
	y: number
	gate: Gate
}

interface GlobalPin {
	type: "global-input" | "global-output"
	index: number
}

interface ChipPin {
	type: "input" | "output"
	index: number
	chip: Chip
}

export type Pin = GlobalPin | ChipPin

export interface Connection {
	key: string
	from: Pin
	to: Pin
}

export function isSamePin(a: Pin, b: Pin) {
	if (a.type !== b.type) {
		return false
	}

	if (a.index !== b.index) {
		return false
	}

	if (a.type === "global-input" || a.type === "global-output") {
		return true
	}

	if (!("chip" in a) || !("chip" in b)) {
		throw new Error("Invalid pin content")
	}

	return isSameChip(a.chip, b.chip)
}

export function isSameChip(a: Chip, b: Chip): boolean {
	return a.key === b.key
}

export class Gate {
	readonly key: string
	readonly operatorInputs: number
	readonly operatorOutputs: number
	readonly operator: Operator | CustomOperator
	readonly truthTable: TruthTableLookup
	readonly name: string
	readonly height: number
	readonly width: number
	deleted: boolean = false
	color: string
	canBeDeleted: boolean

	constructor(
		name: string,
		operator: Operator | CustomOperator,
		color: string,
		truthTable?: TruthTableLookup,
	) {
		this.key = uuid.v4()
		this.name = name
		this.operator = operator
		this.color = color
		this.canBeDeleted = true
		this.operatorInputs = typeof operator === "function" ? operator.length : operator.inputs
		this.operatorOutputs =
			typeof operator === "function"
				? operator(...Array(this.operatorInputs).fill(false)).length
				: operator.outputs
		this.truthTable = truthTable ?? truthTableToLookup(computeTruthTable(this))
		this.height = Math.max(Math.max(this.operatorInputs, this.operatorOutputs) * 20, 28)
		this.width =
			calculateSize(this.name, {
				fontSize: "16",
				fontWeight: "bold",
				font: '"Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
			}).width + 32
	}

	disableDelete(): this {
		this.canBeDeleted = false
		return this
	}
}

export function evaluate(
	gate: Gate,
	inputs: boolean[],
	precompiledConnections?: PrecompiledConnections,
): boolean[] {
	if (gate.truthTable) {
		return getResultFromTruthTable(gate.truthTable, inputs)
	}

	if (typeof gate.operator === "function") {
		return gate.operator(...inputs)
	}

	const output = Array(gate.operator.outputs).fill(false)
	const { turnedOnPins } = computePinState(
		precompiledConnections ?? gate.operator.connections,
		inputs,
	)
	for (const pin of turnedOnPins.values()) {
		if (pin.type === "global-input") {
			output[pin.index] = true
		}
	}

	return output
}

interface PrecompiledConnections {
	inputConnections: { readonly [index: number]: readonly Connection[] | undefined }
	toConnections: { readonly [chipKey: string]: readonly Connection[] | undefined }
	startQueue: readonly Pin[]
}

export function precompileConnections(connections: Connection[]): PrecompiledConnections {
	const inputConnections: { [index: number]: Connection[] | undefined } = {}
	const toConnections: { [chipKey: string]: Connection[] | undefined } = {}
	const startQueue: Pin[] = []

	for (const connection of connections) {
		const { from } = connection

		if (from.type === "output") {
			if (toConnections[from.chip.key]) {
				toConnections[from.chip.key]!.push(connection)
			} else {
				toConnections[from.chip.key] = [connection]
			}
		} else if (from.type === "global-output") {
			if (inputConnections[from.index]) {
				inputConnections[from.index]!.push(connection)
			} else {
				inputConnections[from.index] = [connection]
			}

			startQueue.push(from)
		}
	}

	return {
		inputConnections,
		toConnections,
		startQueue,
	}
}

interface PinState {
	turnedOnPins: Set<Pin>
	turnedOffPins: Set<Pin>
}

const turnedOnPins = new Set<Pin>()
const turnedOffPins = new Set<Pin>()
const evaluatedChips = new Set<string>()

export function computePinState(
	connections: Connection[] | PrecompiledConnections,
	inputs: boolean[],
): PinState {
	const { inputConnections, toConnections, startQueue } = Array.isArray(connections)
		? precompileConnections(connections)
		: connections

	const chipInputs: { [chipKey: string]: Set<Pin> | undefined } = {}
	const queue = [...startQueue]

	turnedOnPins.clear()
	turnedOffPins.clear()
	evaluatedChips.clear()

	while (queue.length) {
		const currentPin = queue.shift() as typeof queue[0]

		if (currentPin.type === "global-output") {
			const on = inputs[currentPin.index]
			if (on) {
				turnedOnPins.add(currentPin)
			} else {
				turnedOffPins.add(currentPin)
			}

			for (const { from, to } of inputConnections[currentPin.index] ?? []) {
				if (on) {
					turnedOnPins.add(from).add(to)
				} else {
					turnedOffPins.add(from).add(to)
				}

				if (to.type === "input") {
					queue.push(to)

					if (chipInputs[to.chip.key]) {
						chipInputs[to.chip.key]!.add(to)
					} else {
						chipInputs[to.chip.key] = new Set([to])
					}
				}
			}
		} else if (currentPin.type === "input") {
			const { key, gate } = currentPin.chip

			if (evaluatedChips.has(key)) {
				continue
			}

			const inputPins = chipInputs[key]
			if (!inputPins || inputPins.size !== gate.operatorInputs) {
				continue
			}

			const params: boolean[] = Array(gate.operatorInputs).fill(undefined)
			for (const pin of inputPins) {
				params[pin.index] = turnedOnPins.has(pin)
			}
			const outputs = evaluate(gate, params)

			for (const { from, to } of toConnections[key] ?? []) {
				const on = outputs[from.index - gate.operatorInputs]
				if (on) {
					turnedOnPins.add(from).add(to)
				} else {
					turnedOffPins.add(from).add(to)
				}

				if (to.type === "input") {
					queue.push(to)

					if (chipInputs[to.chip.key]) {
						chipInputs[to.chip.key]!.add(to)
					} else {
						chipInputs[to.chip.key] = new Set([to])
					}
				}
			}

			evaluatedChips.add(key)
		}
	}

	return {
		turnedOnPins,
		turnedOffPins,
	}
}
