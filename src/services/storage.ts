import * as lz from "lz-string"
import { colors } from "./colors"
import { AND, Component, ICustomOperator, IPin, NOT, Operator } from "./computer"

const defaultComponents = [
	new Component("AND", AND, colors[1]).disableDelete(),
	new Component("NOT", NOT, colors[0]).disableDelete(),
]

interface IPreserializedCustomOperator {
	connections: {
		key: string
		from: {
			type: IPin["type"]
			index: number
			content: IPreserializedComponent
		}
		to: {
			type: IPin["type"]
			index: number
			content: IPreserializedComponent
		}
	}[]
}

interface IPreserializedComponent {
	key: string
	name: string
	color: string
	x: number
	y: number
	canBeDeleted: boolean
	operator: string | IPreserializedCustomOperator
	inputs: number
	outputs: number
}

function prepareSerializeComponent(component: Component): IPreserializedComponent {
	const preserializedComponent: IPreserializedComponent = {
		key: component.key,
		name: component.name,
		color: component.color,
		x: component.x,
		y: component.y,
		inputs: component.operatorInputs,
		outputs: component.operatorOutputs,
		canBeDeleted: component.canBeDeleted,
		operator:
			typeof component.operator === "function"
				? component.operator.name
				: ({
						connections: component.operator.connections.map(({ key, from, to }) => ({
							key,
							from:
								"content" in from
									? {
											type: from.type,
											index: from.index,
											content: prepareSerializeComponent(from.content),
									  }
									: from,
							to:
								"content" in to
									? {
											type: to.type,
											index: to.index,
											content: prepareSerializeComponent(to.content),
									  }
									: to,
						})),
				  } as IPreserializedCustomOperator),
	}

	return preserializedComponent
}

let deserializedComponents: { [key: string]: Component } = {}
function deserializeComponent(content: any): Component {
	let operator: Operator | ICustomOperator

	if (typeof content !== "object" || !content) {
		throw new Error("Failed deserializing component, invalid component type")
	}

	if (!("key" in content)) {
		throw new Error("Failed deserializing component, no key defined in component")
	}

	if (content.key && deserializedComponents[content.key]) {
		return deserializedComponents[content.key]
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

	const serializedComponent = content as IPreserializedComponent

	if (typeof serializedComponent.operator === "string") {
		if (serializedComponent.operator === "AND") {
			operator = AND
		} else if (serializedComponent.operator === "NOT") {
			operator = NOT
		} else {
			throw new Error(
				`Failed deserializing component, unknown operator: '${serializedComponent.operator}'`,
			)
		}
	} else if ("connections" in serializedComponent.operator) {
		operator = {
			inputs: serializedComponent.inputs,
			outputs: serializedComponent.outputs,
			connections: serializedComponent.operator.connections.map(({ key, from, to }) => ({
				key,
				from: {
					type: from.type,
					index: from.index,
					...(from.content ? { content: deserializeComponent(from.content) } : null),
				} as IPin,
				to: {
					type: to.type,
					index: to.index,
					...(to.content ? { content: deserializeComponent(to.content) } : null),
				} as IPin,
			})),
		}
	} else {
		throw new Error("Failed deserializing component, unknown data structure")
	}

	const component = Object.assign(new Component(content.name, operator, content.color), {
		key: content.key,
		canBeDeleted: content.canBeDeleted || false,
	})
	deserializedComponents[component.key] = component
	return component
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

		deserializedComponents = {}
		return preserializedComponents.map(deserializeComponent)
	} catch (error) {
		console.error("Stored components are invalid", error)
		localStorage.removeItem("logik:components")
	}

	return defaultComponents
}

export function storeComponents(components: Component[]): void {
	const preserializedComponents = components.map(prepareSerializeComponent)
	const serializedComponents = JSON.stringify(preserializedComponents)
	const compressedComponents = lz.compressToUTF16(serializedComponents)

	localStorage.setItem("logik:components", compressedComponents)
}
