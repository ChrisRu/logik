import * as lz from "lz-string"
import * as uuid from "uuid"
import { colors } from "./colors"
import { AND, NOT, Component, CustomOperator, Pin, Operator, Chip, Connection } from "./computer"
import { TruthTableLookup } from "./truthTable"

const defaultComponents = [
	new Component("AND", AND, colors[1]).disableDelete(),
	new Component("NOT", NOT, colors[0]).disableDelete(),
]

interface PreserializedChip {
	key: string
	x: number
	y: number
	component: PreserializedComponent["key"]
}

interface PreserializedGlobalPin {
	type: "global-input" | "global-output"
	index: number
}

interface PreserializedChipPin {
	type: "input" | "output"
	index: number
	chip: PreserializedChip
}

type PreserializedPin = PreserializedGlobalPin | PreserializedChipPin

interface PreserializedConnection {
	from: PreserializedPin
	to: PreserializedPin
}

interface PreserializedCustomOperator {
	connections: PreserializedConnection[]
}

interface PreserializedComponent {
	key: string
	name: string
	color: string
	inputs: number
	outputs: number
	canBeDeleted: boolean
	truthTable: TruthTableLookup
	operator: string | PreserializedCustomOperator | null
	deleted: boolean
}

function preserializeChip(chip: Chip): PreserializedChip {
	return {
		key: chip.key,
		x: chip.x,
		y: chip.y,
		component: chip.component.key,
	}
}

function preserializeConnection({ from, to }: Connection): PreserializedConnection {
	return {
		from:
			"chip" in from
				? {
						type: from.type,
						index: from.index,
						chip: preserializeChip(from.chip),
				  }
				: from,
		to:
			"chip" in to
				? {
						type: to.type,
						index: to.index,
						chip: preserializeChip(to.chip),
				  }
				: to,
	}
}

function preserializeComponent(component: Component): PreserializedComponent {
	return {
		key: component.key,
		name: component.name,
		color: component.color,
		inputs: component.operatorInputs,
		outputs: component.operatorOutputs,
		canBeDeleted: component.canBeDeleted,
		deleted: component.deleted,
		truthTable: component.truthTable,
		operator: component.deleted
			? null
			: typeof component.operator === "function"
			? component.operator.name
			: {
					connections: component.operator.connections.map(preserializeConnection),
			  },
	}
}

function deserializeComponent(content: any): Component {
	if (typeof content !== "object" || !content) {
		throw new Error("Failed deserializing component, invalid component type")
	}

	if (!("key" in content)) {
		throw new Error("Failed deserializing component, no key defined in component")
	}

	if (!("operator" in content)) {
		throw new Error("Failed deserializing component, no operator defined in component")
	}

	if (!("name" in content)) {
		throw new Error("Failed deserializing component, no name defined in component")
	}

	if (!("color" in content)) {
		throw new Error("Failed deserializing component, no color defined in component")
	}

	if (Number.isNaN(content.operatorInputs) || Number.isNaN(content.operatorOutputs)) {
		throw new Error(`Failed deserializing component, no input (or/and) output count set`)
	}

	const serializedComponent = content as PreserializedComponent

	let operator: Operator | CustomOperator

	if (serializedComponent.operator === null && serializedComponent.deleted) {
		operator = {
			inputs: content.operatorInputs,
			outputs: content.operatorOutputs,
			get connections(): never {
				throw new Error(
					`Can not get connections of deleted component, as it doesn't store it's internal contents`,
				)
			},
		}
	} else if (typeof serializedComponent.operator === "string") {
		if (serializedComponent.operator === "AND") {
			operator = AND
		} else if (serializedComponent.operator === "NOT") {
			operator = NOT
		} else {
			throw new Error(
				`Failed deserializing component, unknown function operator: '${serializedComponent.operator}'`,
			)
		}
	} else if (serializedComponent.operator && "connections" in serializedComponent.operator) {
		operator = {
			inputs: serializedComponent.inputs,
			outputs: serializedComponent.outputs,
			connections: serializedComponent.operator.connections.map(({ from, to }) => ({
				key: uuid.v4(),
				from: {
					type: from.type,
					index: from.index,
					...("chip" in from ? { chip: from.chip } : null),
				} as Pin,
				to: {
					type: to.type,
					index: to.index,
					...("chip" in to ? { chip: to.chip } : null),
				} as Pin,
			})),
		}
	} else {
		throw new Error(
			`Failed deserializing component, unknown data structure:\n${JSON.stringify(
				content,
				null,
				2,
			)}`,
		)
	}

	return Object.assign(new Component(content.name, operator, content.color, content.truthTable), {
		key: content.key,
		deleted: content.deleted ?? false,
		canBeDeleted: content.canBeDeleted ?? false,
	} as { [K in keyof Component]: Component[K] })
}

export function loadComponents(): Component[] {
	try {
		const compressedComponents = localStorage.getItem("logik:components")
		if (!compressedComponents) {
			return defaultComponents
		}

		const serializedComponents = lz.decompressFromUTF16(compressedComponents)
		if (!serializedComponents) {
			throw new Error("Failed to decompress local storage item")
		}

		const preserializedComponents = JSON.parse(serializedComponents)
		if (!Array.isArray(preserializedComponents)) {
			throw new Error("Invalid data structure in local storage item")
		}

		const loadedComponents = preserializedComponents.map(deserializeComponent)
		const deserializedComponents = Object.fromEntries(loadedComponents.map((c) => [c.key, c]))

		for (const component of loadedComponents) {
			if (!component.deleted && typeof component.operator !== "function") {
				for (const connection of component.operator.connections) {
					if ("chip" in connection.from) {
						connection.from.chip = {
							key: connection.from.chip.key,
							x: connection.from.chip.x,
							y: connection.from.chip.y,
							component:
								deserializedComponents[(connection.from.chip.component as unknown) as string],
						}
					}

					if ("chip" in connection.to) {
						connection.to.chip = {
							key: connection.to.chip.key,
							x: connection.to.chip.x,
							y: connection.to.chip.y,
							component:
								deserializedComponents[(connection.to.chip.component as unknown) as string],
						}
					}
				}
			}
		}

		return loadedComponents
	} catch (error) {
		console.error("Stored components are invalid", error)
		localStorage.removeItem("logik:components")
	}

	return defaultComponents
}

export function storeComponents(components: Component[]): void {
	const preserializedComponents = components.map(preserializeComponent)
	const serializedComponents = JSON.stringify(preserializedComponents)
	const compressedComponents = lz.compressToUTF16(serializedComponents)

	localStorage.setItem("logik:components", compressedComponents)
}
