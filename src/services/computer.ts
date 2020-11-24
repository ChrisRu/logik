import * as uuid from 'uuid'
import calculateSize from "calculate-size"
import { IOperator } from "./logic"

export interface IPoint {
	x: number
	y: number
}

export interface IPin {
	type: "input" | "output" | "global-input" | "global-output"
	content?: Component
	index: number
}

export interface IConnection {
	key: string
	from: IPin
	to: IPin
}

const componentPadding = 32

export class Component implements IPoint {
	key: string
	operatorInputs: number
	operatorOutputs: number
	operator: IOperator
	color: string
	name: string
	x: number
	y: number

	constructor(name: string, operator: IOperator, color: string, x: number = 0, y: number = 0) {
		this.key = uuid.v4()
		this.name = name
		this.operator = operator
		this.color = color
		this.x = x
		this.y = y
		this.operatorInputs = operator.length
		this.operatorOutputs = operator(...Array(this.operatorInputs).fill(false)).length
	}

	get height() {
		return Math.max(Math.max(this.operatorInputs, this.operatorOutputs) * 20, 40)
	}

	get width() {
		const { width } = calculateSize(this.name, {
			fontSize: "18",
			fontWeight: "bold",
			font: '"Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
		})

		return width + componentPadding
	}
}

export function compute(connections: IConnection[], outputs: boolean[]) {
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
					} else {
						turnedOffPins.add(from)
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

			const parameterConnections = connections.filter(({ to }) => to.content === current.content)
			if (parameterConnections.length !== current.content?.operatorInputs) {
				console.warn(`Wiring incomplete for ${current.type} ${current.content?.name}`)
				continue
			}

			const params = parameterConnections
				.sort((a, b) => a.from.index - b.from.index)
				.map(({ from }) =>
					turnedOnPins.has(from) ? true : turnedOffPins.has(from) ? false : undefined,
				)
			if (params.includes(undefined)) {
				console.warn(`Wiring incomplete for ${current.type} ${current.content?.name}. Circular structure?`)
				continue
			}

			const status = current.content?.operator(...(params as boolean[]))

			for (const { from, to } of connections) {
				if (from.content === current.content) {
					const statusIndex = from.index - current.content.operatorInputs
					if (status[statusIndex]) {
						turnedOnPins.add(from)
					} else {
						turnedOffPins.add(from)
					}

					queue.push(to)
				}
			}
		} else if (current.type === "output") {
			if (!current.content) {
				throw new Error("Broken output component, no content defined")
			}

			for (const { from, to } of connections) {
				if (to.content === current.content) {
					queue.push(from)
				}
			}
		} else {
			throw new Error(`Unknown component type ${current.type}`)
		}
	}

	return turnedOnPins
}
