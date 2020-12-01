import { Component, evaluate } from "./computer"

export type TruthTableLookup = {
	[key: string]: boolean[]
}

export type TruthTable = {
	params: boolean[]
	output: boolean[]
}[]

export function isSameLookupTruthTable(a: TruthTableLookup, b: TruthTableLookup) {
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false
	}

	for (const key in a) {
		if (b[key]) {
			const aOutput = a[key].join("")
			const bOutput = b[key].join("")
			if (aOutput !== bOutput) {
				return false
			}
		} else {
			return false
		}
	}

	return true
}

export function isSameTruthTable(a: TruthTable, b: TruthTable) {
	if (a.length !== b.length) {
		return false
	}

	return isSameLookupTruthTable(truthTableToLookup(a), truthTableToLookup(b))
}

function createBinaryArray(value: number, arraySize = 1): boolean[] {
	const binaryArray = Array(arraySize).fill(false)
	let i = binaryArray.length - 1

	while (value > 0) {
		if (value % 2 !== 0) {
			binaryArray[i] = true
		}

		value = Math.floor(value / 2)
		i--
	}

	return binaryArray
}

export function computeTruthTable(component: Component): TruthTable {
	return Array(2 ** component.operatorInputs)
		.fill(undefined)
		.map((_, index) => {
			const params = createBinaryArray(index, component.operatorInputs)

			return {
				params,
				output: evaluate(component, params),
			}
		})
}

export function getResultFromTruthTable(truthTable: TruthTableLookup, value: boolean[]): boolean[] {
	const result = truthTable[value.map((x) => (x ? "1" : "0")).join("")]

	if (!result) {
		throw new Error("Entry does not exist in truth table")
	}

	return result
}

export function truthTableToLookup(truthTable: TruthTable): TruthTableLookup {
	return Object.fromEntries(
		truthTable.map(({ params, output }) => [params.map((x) => (x ? "1" : "0")).join(""), output]),
	)
}

export function lookupToTruthTable(truthTable: TruthTableLookup, amount?: number): TruthTable {
	let entries = Object.entries(truthTable)

	if (amount !== undefined) {
		entries = entries.slice(0, amount)
	}

	return entries.map(([key, output]) => {
		const params = key.split("").map((x) => x === "1")

		return {
			index: parseInt(key, 2),
			params,
			output,
		}
	}).sort((a, b) => a.index - b.index)
}

export const truthTables = {
	NOTHING: {
		"0": [false],
		"1": [true],
	},
	NOT: {
		"0": [true],
		"1": [false],
	},
	AND: {
		"10": [false],
		"11": [true],
		"00": [false],
		"01": [false],
	},
	OR: {
		"10": [true],
		"11": [true],
		"00": [false],
		"01": [true],
	},
	XOR: {
		"10": [true],
		"11": [false],
		"00": [false],
		"01": [true],
	},
	NOR: {
		"10": [false],
		"11": [false],
		"00": [true],
		"01": [false],
	},
	XNOR: {
		"10": [false],
		"11": [true],
		"00": [true],
		"01": [false],
	},
}
