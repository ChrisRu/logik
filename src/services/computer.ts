import * as uuid from "uuid"
import calculateSize from "calculate-size"

export type IOperator = (...params: (boolean | 0 | 1)[]) => boolean[]

export const INV: IOperator = (a) => [!a]

export const AND: IOperator = (a, b) => [!!a && !!b]

export const NAND: IOperator = (a, b) => INV(...AND(a, b))

export const OR: IOperator = (a, b) => NAND(...INV(a), ...INV(b))

export interface IPoint {
	x: number
	y: number
}

export interface ICustomComponent {
	connections: IConnection[]
	outputs: number
	inputs: number
}

interface IGlobalPin {
	type: "global-input" | "global-output"
	index: number
}

interface IComponentPin {
	type: "input" | "output"
	content: Component
	index: number
}

export type IPin = IGlobalPin | IComponentPin

export interface IConnection {
	key: string
	from: IPin
	to: IPin
}

export function isSamePin(a: IPin, b: IPin) {
	if (a.type !== b.type) {
		return false
	}

	if (a.index !== b.index) {
		return false
	}

	if (a.type === "global-input" || a.type === "global-output") {
		return true
	}

	if (!("content" in a) || !("content" in b)) {
		throw new Error("Invalid pin content")
	}

	return isSameComponent(a.content, b.content)
}

export function isSameComponent(a: Component, b: Component): boolean {
	return a.key === b.key
}

const componentPadding = 32

export class Component implements IPoint {
	readonly key: string
	readonly operatorInputs: number
	readonly operatorOutputs: number
	readonly operator: IOperator | ICustomComponent
	readonly color: string
	readonly name: string
	canBeDeleted: boolean
	x: number
	y: number

	constructor(
		name: string,
		operator: IOperator | ICustomComponent,
		color: string,
		x: number = 0,
		y: number = 0,
	) {
		this.key = uuid.v4()
		this.name = name
		this.operator = operator
		this.color = color
		this.x = x
		this.y = y
		this.operatorInputs = typeof operator === "function" ? operator.length : operator.inputs
		this.operatorOutputs =
			typeof operator === "function"
				? operator(...Array(this.operatorInputs).fill(false)).length
				: operator.outputs
		this.canBeDeleted = true
	}

	disableDelete(): this {
		this.canBeDeleted = false
		return this
	}

	get height() {
		return Math.max(Math.max(this.operatorInputs, this.operatorOutputs) * 20, 40)
	}

	get width() {
		const { width } = calculateSize(this.name, {
			fontSize: "16",
			fontWeight: "bold",
			font: '"Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
		})

		return width + componentPadding
	}
}

export function evaluate(operator: IOperator | ICustomComponent, outputs: boolean[]): boolean[] {
	if (typeof operator === "function") {
		return operator(...outputs)
	}

	const pins = Array.from(computeTurnedOnPins(operator.connections, outputs))
		.filter(({ type }) => type === "global-input")
		.map(({ index }) => index)

	const output = Array(operator.outputs).fill(false)
	for (const { to } of operator.connections) {
		if (to.type === "global-input") {
			output[to.index] = pins.includes(to.index)
		}
	}

	return output
}

export function computeTurnedOnPins(connections: IConnection[], outputs: boolean[]): Set<IPin> {
	const turnedOnPins = new Set<IPin>()
	const turnedOffPins = new Set<IPin>()

	const queue: IPin[] = connections
		.filter(({ from }) => from.type === "global-output")
		.map(({ from }) => from)

	while (queue.length) {
		const current = queue.shift() as typeof queue[0]
		if (turnedOnPins.has(current) || turnedOffPins.has(current)) {
			continue
		}

		if (current.type === "global-output") {
			for (const { from, to } of connections) {
				if (from === current) {
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
			if (current.content?.operator === undefined) {
				throw new Error("Operator is not defined for component")
			}

			const parameterConnections = connections.filter(
				({ to }) => "content" in to && to.content === current.content,
			)
			if (parameterConnections.length !== current.content?.operatorInputs) {
				console.warn(`Wiring incomplete for ${current.type} ${current.content?.name}`)
				continue
			}

			const params = parameterConnections
				.sort((a, b) => a.to.index - b.to.index)
				.map(({ from }) =>
					turnedOnPins.has(from) ? true : turnedOffPins.has(from) ? false : undefined,
				)
			if (params.includes(undefined)) {
				console.warn(
					`Wiring incomplete for ${current.type} ${current.content?.name}. Circular structure?`,
				)
				continue
			}

			const status = evaluate(current.content?.operator, params as boolean[])

			for (const { from, to } of connections) {
				if ("content" in from && isSameComponent(from.content, current.content)) {
					const statusIndex = from.index - current.content.operatorInputs
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
			if (!current.content) {
				throw new Error("Broken output component, no content defined")
			}

			for (const { from, to } of connections) {
				if ("content" in to && isSameComponent(to.content, current.content)) {
					queue.push(from)
				}
			}
		} else {
			throw new Error(`Unknown component type ${current.type}`)
		}
	}

	return turnedOnPins
}
