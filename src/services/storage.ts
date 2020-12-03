import * as lz from "lz-string"
import * as uuid from "uuid"
import { colors } from "./colors"
import {
	operators,
	Gate,
	CustomOperator,
	Pin,
	Operator,
	Chip,
	Connection,
	getOperatorNameByOperator,
} from "./computer"
import { TruthTableLookup } from "./truthTable"

const defaultGates = [
	new Gate("AND", operators.AND, colors[1]).disableDelete(),
	new Gate("NOT", operators.NOT, colors[0]).disableDelete(),
]

interface PreserializedChip {
	key: string
	x: number
	y: number
	gate: PreserializedGate["key"]
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

interface PreserializedGate {
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
		gate: chip.gate.key,
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

function preserializeGate(gate: Gate): PreserializedGate {
	return {
		key: gate.key,
		name: gate.name,
		color: gate.color,
		inputs: gate.operatorInputs,
		outputs: gate.operatorOutputs,
		canBeDeleted: gate.canBeDeleted,
		deleted: gate.deleted,
		truthTable: gate.truthTable,
		operator: gate.deleted
			? null
			: typeof gate.operator === "function"
			? getOperatorNameByOperator(gate.operator) ?? null
			: {
					connections: gate.operator.connections.map(preserializeConnection),
			  },
	}
}

function deserializeGate(content: any): Gate {
	if (!content) {
		throw new Error("Failed deserializing gate, undefined gate supplied")
	}

	if (typeof content !== "object") {
		throw new Error("Failed deserializing gate, invalid data structure for gate")
	}

	if (!("key" in content)) {
		throw new Error("Failed deserializing gate, no key defined in gate")
	}

	if (!("operator" in content)) {
		throw new Error("Failed deserializing gate, no operator defined in gate")
	}

	if (!("name" in content)) {
		throw new Error("Failed deserializing gate, no name defined in gate")
	}

	if (!("color" in content)) {
		throw new Error("Failed deserializing gate, no color defined in gate")
	}

	if (Number.isNaN(content.operatorInputs) || Number.isNaN(content.operatorOutputs)) {
		throw new Error(`Failed deserializing gate, no input (or/and) output count set`)
	}

	const serializedGate = content as PreserializedGate

	let operator: Operator | CustomOperator

	if (serializedGate.operator === null && serializedGate.deleted) {
		operator = {
			inputs: content.operatorInputs,
			outputs: content.operatorOutputs,
			get connections(): never {
				throw new Error(
					`Can not get connections of deleted gate, as it doesn't store it's internal contents`,
				)
			},
		}
	} else if (typeof serializedGate.operator === "string") {
		const foundOperator =
			serializedGate.operator in operators
				? operators[serializedGate.operator as keyof typeof operators]
				: undefined

		if (!foundOperator) {
			throw new Error(
				`Failed deserializing gate, unknown function operator: '${serializedGate.operator}'`,
			)
		}

		operator = foundOperator
	} else if (serializedGate.operator && "connections" in serializedGate.operator) {
		operator = {
			inputs: serializedGate.inputs,
			outputs: serializedGate.outputs,
			connections: serializedGate.operator.connections.map(({ from, to }) => ({
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
			`Failed deserializing gate, unknown data structure:\n${JSON.stringify(
				content,
				null,
				2,
			)}`,
		)
	}

	return Object.assign(new Gate(content.name, operator, content.color, content.truthTable), {
		key: content.key,
		deleted: content.deleted ?? false,
		canBeDeleted: content.canBeDeleted ?? false,
	} as { [K in keyof Gate]: Gate[K] })
}

export function loadStoredGates(): Gate[] {
	try {
		const compressedGates = localStorage.getItem("logik:gates")
		if (!compressedGates) {
			return defaultGates
		}

		const serializedGates = lz.decompressFromUTF16(compressedGates)
		if (!serializedGates) {
			throw new Error("Failed to decompress local storage item")
		}

		const preserializedGates = JSON.parse(serializedGates)
		if (!Array.isArray(preserializedGates)) {
			throw new Error("Invalid data structure in local storage item")
		}

		const loadedGates = preserializedGates.map(deserializeGate)
		const deserializedGates = Object.fromEntries(loadedGates.map((c) => [c.key, c]))

		for (const gate of loadedGates) {
			if (!gate.deleted && typeof gate.operator !== "function") {
				for (const connection of gate.operator.connections) {
					if ("chip" in connection.from) {
						connection.from.chip = {
							key: connection.from.chip.key,
							x: connection.from.chip.x,
							y: connection.from.chip.y,
							gate:
								deserializedGates[(connection.from.chip.gate as unknown) as string],
						}
					}

					if ("chip" in connection.to) {
						connection.to.chip = {
							key: connection.to.chip.key,
							x: connection.to.chip.x,
							y: connection.to.chip.y,
							gate:
								deserializedGates[(connection.to.chip.gate as unknown) as string],
						}
					}
				}
			}
		}

		return loadedGates
	} catch (error) {
		console.error("Stored gates are invalid", error)
		localStorage.removeItem("logik:gates")
	}

	return defaultGates
}

export function storeGates(gates: Gate[]): void {
	const preserializedGates = gates.map(preserializeGate)
	const serializedGates = JSON.stringify(preserializedGates)
	const compressedGates = lz.compressToUTF16(serializedGates)

	localStorage.setItem("logik:gates", compressedGates)
}
