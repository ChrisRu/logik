import { Component, evaluate } from "./computer"

export interface ITruthRow {
	params: boolean[]
	output: boolean[]
}

export type ITruthTable = ITruthRow[]

export function isSameTruthTable(a: ITruthTable, b: ITruthTable) {
	if (a.length !== b.length) {
		return false
	}

	const aMap = Object.fromEntries(a.map(({ params, output }) => [params.join("-"), output]))
	const bMap = Object.fromEntries(b.map(({ params, output }) => [params.join("-"), output]))

	for (const key in aMap) {
		if (bMap[key]) {
			const aOutput = aMap[key].join("-")
			const bOutput = bMap[key].join("-")
			if (aOutput !== bOutput) {
				return false
			}
		} else {
			return false
		}
	}

	return true
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

export function computeTruthTable(component: Component): ITruthTable {
	return Array(2 ** component.operatorInputs)
		.fill(undefined)
		.map((_, index) => {
			const params = createBinaryArray(index, component.operatorInputs)

			return {
				params,
				output: evaluate(component.operator, params),
			}
		})
}

export const truthTables = {
	NOTHING: [
		{ params: [false], output: [false] },
		{ params: [true], output: [true] },
	] as ITruthTable,
	NOT: [
		{ params: [false], output: [true] },
		{ params: [true], output: [false] },
	] as ITruthTable,
	AND: [
		{ params: [false, false], output: [false] },
		{ params: [false, true], output: [false] },
		{ params: [true, false], output: [false] },
		{ params: [true, true], output: [true] },
	] as ITruthTable,
	OR: [
		{ params: [false, false], output: [false] },
		{ params: [false, true], output: [true] },
		{ params: [true, false], output: [true] },
		{ params: [true, true], output: [true] },
	] as ITruthTable,
	XOR: [
		{ params: [false, false], output: [false] },
		{ params: [false, true], output: [true] },
		{ params: [true, false], output: [true] },
		{ params: [true, true], output: [false] },
	] as ITruthTable,
	NOR: [
		{ params: [false, false], output: [true] },
		{ params: [false, true], output: [false] },
		{ params: [true, false], output: [false] },
		{ params: [true, true], output: [false] },
	] as ITruthTable,
	XNOR: [
		{ params: [false, false], output: [true] },
		{ params: [false, true], output: [false] },
		{ params: [true, false], output: [false] },
		{ params: [true, true], output: [true] },
	] as ITruthTable,
}
