import * as uuid from "uuid"
import calculateSize from "calculate-size"
import {
	computeTruthTable,
	getResultFromTruthTable,
	TruthTableLookup,
	truthTableToLookup,
} from "./truthTable"

export type Operator = (...params: (boolean | 0 | 1)[]) => boolean[]

export const NOT: Operator = (a) => [!a]

export const AND: Operator = (a, b) => [!!a && !!b]

export const NAND: Operator = (a, b) => NOT(...AND(a, b))

export const OR: Operator = (a, b) => NAND(...NOT(a), ...NOT(b))

export const XOR: Operator = (a, b) => AND(...NAND(a, b), ...OR(a, b))

export const NOR: Operator = (a, b) => NOT(...OR(a, b))

export const XNOR: Operator = (a, b) => OR(...NOR(a, b), ...AND(a, b))

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
	component: Component
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

export function isSameComponent(a: Component, b: Component): boolean {
	return a.key === b.key
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

export class Component {
	readonly key: string
	readonly operatorInputs: number
	readonly operatorOutputs: number
	readonly operator: Operator | CustomOperator
	readonly truthTable: TruthTableLookup
	readonly name: string
	readonly height: number
	readonly width: number
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

export function evaluate(component: Component, inputs: boolean[]): boolean[] {
	if (component.truthTable) {
		return getResultFromTruthTable(component.truthTable, inputs)
	}

	if (typeof component.operator === "function") {
		return component.operator(...inputs)
	}

	const output = Array(component.operator.outputs).fill(false)
	const { turnedOnPins } = computePinState(component.operator.connections, inputs)
	for (const pin of turnedOnPins.values()) {
		if (pin.type === "global-input") {
			output[pin.index] = true
		}
	}

	return output
}

export interface PinState {
	turnedOnPins: Set<Pin>
	turnedOffPins: Set<Pin>
}

export function computePinState(connections: Connection[], inputs: boolean[]): PinState {
	const turnedOnPins = new Set<Pin>()
	const turnedOffPins = new Set<Pin>()

	// Precalculation for all connections for all chips (and inputs and outputs),
	// so less looping is required in main loop
	const chipInputs: { [chipKey: string]: Set<Pin> | undefined } = {}
	const inputConnections: { [index: number]: Connection[] | undefined } = {}
	const toConnections: { [chipKey: string]: Connection[] | undefined } = {}
	const evaluatedChips = new Set<string>()

	const queue: Pin[] = []

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

			queue.push(from)
		}
	}

	let i = 0
	while (queue.length) {
		i++

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
			const { key, component } = currentPin.chip

			if (evaluatedChips.has(key)) {
				continue
			}

			const inputPins = chipInputs[key]
			if (!inputPins || inputPins.size !== component.operatorInputs) {
				continue
			}

			const params: boolean[] = Array(component.operatorInputs).fill(undefined)
			for (const pin of inputPins) {
				params[pin.index] = turnedOnPins.has(pin)
			}
			const outputs = evaluate(component, params)

			for (const { from, to } of toConnections[key] ?? []) {
				const on = outputs[component.operatorInputs - from.index]
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

	console.log(`${i} iterations`)

	return {
		turnedOnPins,
		turnedOffPins,
	}
}
