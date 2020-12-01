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

export function isSameComponent(a: Component, b: Component): boolean {
	return a.key === b.key
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

	const pins = Array.from(computeTurnedOnPins(component.operator.connections, inputs))
		.filter(({ type }) => type === "global-input")
		.map(({ index }) => index)

	const output = Array(component.operator.outputs).fill(false)
	for (const { to } of component.operator.connections) {
		if (to.type === "global-input") {
			output[to.index] = pins.includes(to.index)
		}
	}

	return output
}

export function computeTurnedOnPins(connections: Connection[], outputs: boolean[]): Set<Pin> {
	const turnedOnPins = new Set<Pin>()
	const turnedOffPins = new Set<Pin>()

	const queue: Pin[] = connections
		.filter(({ from }) => from.type === "global-output")
		.map(({ from }) => from)

	while (queue.length) {
		const current = queue.shift() as typeof queue[0]
		if (turnedOnPins.has(current) || turnedOffPins.has(current)) {
			continue
		}

		if (current.type === "global-output") {
			for (const { from, to } of connections) {
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
			for (const { from, to } of connections) {
				if (to === current) {
					queue.push(from)
				}
			}
		} else if (current.type === "input") {
			if (current.chip.component.operator === undefined) {
				throw new Error("Operator is not defined for component")
			}

			const parameterConnections = connections.filter(
				({ to }) => "chip" in to && isSameChip(to.chip, current.chip),
			)
			if (parameterConnections.length !== current.chip.component.operatorInputs) {
				console.warn(`Wiring incomplete for ${current.type} ${current.chip.component.name}`)
				continue
			}

			const params = parameterConnections
				.sort((a, b) => a.to.index - b.to.index)
				.map(({ from }) =>
					turnedOnPins.has(from) ? true : turnedOffPins.has(from) ? false : undefined,
				)
			if (params.includes(undefined)) {
				console.warn(
					`Wiring incomplete for ${current.type} ${current.chip.component.name}. Circular structure?`,
				)
				continue
			}

			const status = evaluate(current.chip.component, params as boolean[])

			for (const { from, to } of connections) {
				if ("chip" in from && isSameChip(from.chip, current.chip)) {
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
			}
		} else if (current.type === "output") {
			if (!current.chip) {
				throw new Error("Broken output component, no content defined")
			}

			for (const { from, to } of connections) {
				if ("chip" in to && isSameChip(to.chip, current.chip)) {
					queue.push(from)
				}
			}
		} else {
			throw new Error(`Unknown component type ${current.type}`)
		}
	}

	return turnedOnPins
}
