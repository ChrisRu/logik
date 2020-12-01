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
	const turnedOnPins = computeTurnedOnPins(component.operator.connections, inputs)
	for (const pin of turnedOnPins.values()) {
		if (pin.type === "global-input") {
			output[pin.index] = true
		}
	}

	return output
}

export function computeTurnedOnPins(connections: Connection[], outputs: boolean[]): Set<Pin> {
	const turnedOnPins = new Set<Pin>()
	const turnedOffPins = new Set<Pin>()

	console.log('computing')

	// Precalculation for all connections for all chips (and inputs and outputs),
	// so less looping is required in main loop
	const queue: Pin[] = []
	const inputConnections: Connection[] = []
	const outputConnections: Connection[] = []
	const fromConnections: { [chipKey: string]: Connection[] | undefined } = {}
	const toConnections: { [chipKey: string]: Connection[] | undefined } = {}
	for (const connection of connections) {
		const { from, to } = connection

		if (from.type === "output") {
			if (fromConnections[from.chip.key]) {
				fromConnections[from.chip.key]!.push(connection)
			} else {
				fromConnections[from.chip.key] = [connection]
			}
		} else if (from.type === "global-output") {
			outputConnections.push(connection)
		}

		if (to.type === "input") {
			if (toConnections[to.chip.key]) {
				toConnections[to.chip.key]!.push(connection)
			} else {
				toConnections[to.chip.key] = [connection]
			}
		} else if (to.type === "global-input") {
			inputConnections.push(connection)
		}

		if (from.type === "global-output") {
			queue.push(from)
		}
	}

	while (queue.length) {
		const current = queue.shift() as typeof queue[0]
		if (turnedOnPins.has(current) || turnedOffPins.has(current)) {
			continue
		}

		if (current.type === "global-output") {
			for (const { from, to } of outputConnections) {
				if (isSamePin(from, current)) {
					queue.push(to)

					if (outputs[current.index]) {
						turnedOnPins.add(from)
						if (to.type === "global-input") {
							turnedOnPins.add(to)
						}
					} else {
						turnedOffPins.add(from)
						if (to.type === "global-input") {
							turnedOffPins.add(to)
						}
					}
				}
			}
		} else if (current.type === "global-input") {
			for (const { from, to } of inputConnections) {
				if (isSamePin(to, current)) {
					queue.push(from)
				}
			}
		} else if (current.type === "input") {
			if (current.chip.component.operator === undefined) {
				throw new Error("Operator is not defined for component")
			}

			const parameterConnections = toConnections[current.chip.key] ?? []
			if (parameterConnections.length !== current.chip.component.operatorInputs) {
				console.warn(`Wiring incomplete for ${current.type} ${current.chip.component.name}`)
				continue
			}

			let potentiallyCircular = false
			const params = Array(current.chip.component.operatorInputs).fill(undefined)
			for (const { from, to } of parameterConnections) {
				params[to.index] = turnedOnPins.has(from)
					? true
					: turnedOffPins.has(from)
					? false
					: undefined

				if (params[to.index] === undefined) {
					potentiallyCircular = true
					break
				}
			}
			if (potentiallyCircular) {
				console.warn(
					`Wiring incomplete for ${current.type} ${current.chip.component.name}. Potentially a circular structure?`,
				)
				continue
			}

			const status = evaluate(current.chip.component, params as boolean[])
			for (const { from, to } of fromConnections[current.chip.key] ?? []) {
				const statusIndex = from.index - current.chip.component.operatorInputs
				if (status[statusIndex]) {
					turnedOnPins.add(from)
					if (to.type === "global-input") {
						turnedOnPins.add(to)
					}
				} else {
					turnedOffPins.add(from)
					if (to.type === "global-input") {
						turnedOffPins.add(to)
					}
				}

				queue.push(to)
			}
		} else if (current.type === "output") {
			for (const { from } of toConnections[current.chip.key] ?? []) {
				queue.push(from)
			}
		}
	}

	return turnedOnPins
}
