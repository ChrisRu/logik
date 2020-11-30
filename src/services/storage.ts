import { colors } from "./colors"
import { AND, Component, ICustomComponent, NOT, Operator } from "./computer"

const defaultComponents = [
	new Component("AND", AND, colors[1]).disableDelete(),
	new Component("NOT", NOT, colors[0]).disableDelete(),
]

function prepareSerializeComponent(component: Component): any {
	return {
		key: component.key,
		name: component.name,
		color: component.color,
		x: component.x,
		y: component.y,
		operator:
			typeof component.operator === "function"
				? component.operator.name
				: {
						...component.operator,
						connections: component.operator.connections.map(({ from, to, ...rest }) => ({
							...rest,
							from:
								"content" in from
									? {
											...from,
											content: prepareSerializeComponent(from.content),
									  }
									: from,
							to:
								"content" in to
									? {
											...to,
											content: prepareSerializeComponent(to.content),
									  }
									: to,
						})),
				  },
	}
}

const deserializedComponents: { [key: string]: Component } = {}
function deserializeComponent(component: any): Component {
	let operator: Operator | ICustomComponent

	if (typeof component !== "object" || !component) {
		throw new Error("Failed deserializing component, invalid component type")
	}

	if (component.key && deserializedComponents[component.key]) {
		return deserializedComponents[component.key]
	}

	if (!("operator" in component)) {
		throw new Error("Failed deserializing component, no operator defined on the component")
	}

	if (!("name" in component)) {
		throw new Error("Failed deserializing component, no name defined in component")
	}

	if (!("color" in component)) {
		throw new Error("Failed deserializing component, no color defined in component")
	}

	if (typeof component.operator === "string") {
		if (component.operator === "AND") {
			operator = AND
		} else if (component.operator === "NOT") {
			operator = NOT
		} else {
			throw new Error(`Failed deserializing component, unknown operator: '${component.operator}'`)
		}
	} else {
		operator = component.operator
		// @ts-ignore
		for (const connection of operator.connections) {
			if ("content" in connection.from) {
				connection.from.content = deserializeComponent(
					(connection.from.content as unknown) as string,
				)
			}

			if ("content" in connection.to) {
				connection.to.content = deserializeComponent((connection.to.content as unknown) as string)
			}
		}
	}

	const newComponent = new Component(component.name, operator, component.color)
	// @ts-ignore
	newComponent.key = component.key || newComponent.key
	deserializedComponents[newComponent.key] = newComponent
	return newComponent
}

export function loadComponents(): Component[] {
	const storedComponents = localStorage.getItem("logik:components")
	if (storedComponents) {
		try {
			const components = JSON.parse(storedComponents)
			if (Array.isArray(components)) {
				return components.map(deserializeComponent)
			}
		} catch (error) {
			console.error("Stored components are invalid", error, "\n", JSON.stringify(storedComponents))
			localStorage.removeItem("logik:components")
		}
	}

	return defaultComponents
}

export function storeComponents(components: Component[]): void {
	localStorage.setItem(
		"logik:components",
		JSON.stringify(components.map(prepareSerializeComponent)),
	)
}
