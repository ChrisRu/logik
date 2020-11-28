import { Component, evaluate, XOR } from "./computer"

function permute<T>(xs: T[]): T[][] {
	const result: T[][] = []

	function permutor(arr: T[], m: T[] = []) {
		if (arr.length === 0) {
			result.push(m)
		} else {
			for (let i = 0; i < arr.length; i++) {
				const curr = arr.slice()
				const next = curr.splice(i, 1)
				permutor(curr.slice(), m.concat(next))
			}
		}
	}

	permutor(xs)

	return result
}

function uniqueBooleanArrays(xs: boolean[][]) {
	const all = new Set(xs.map(String))

	return Array.from(all).map((str) => str.split(",").map((value) => value === "true"))
}

export interface ITruthRow {
	params: boolean[]
	output: boolean[]
}

export type ITruthTable = ITruthRow[]

export function isSameTruthTable(a: ITruthTable, b: ITruthTable) {
	if (a.length !== b.length) {
		return false
	}

	const aMap = Object.fromEntries(a.map((x) => [x.params.join("-"), x.output]))
	const bMap = Object.fromEntries(b.map((x) => [x.params.join("-"), x.output]))

	for (let key in aMap) {
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

export function computeTruthTable(component: Component): ITruthTable {
	const permutations = uniqueBooleanArrays(
		Array((component.operatorOutputs + 1) ** 2)
			.fill(0)
			.map((_, index) => index)
			.flatMap((paramIndex) =>
				permute(
					Array(component.operatorInputs)
						.fill(0)
						.map((_, valueIndex) => paramIndex > valueIndex),
				),
			),
	)

	const truthTable = permutations.map((params) => ({
		params,
		output: evaluate(component.operator, params),
	}))

	return truthTable
}

export const truthTables = {
	NOTHING: [
		{ params: [false], output: [false] },
		{ params: [true], output: [true] },
	] as ITruthTable,
	INV: [
		{ params: [false], output: [true] },
		{ params: [true], output: [false] },
	] as ITruthTable,
	AND: [
		{ params: [false, false], output: [false] },
		{ params: [true, false], output: [false] },
		{ params: [false, true], output: [false] },
		{ params: [true, true], output: [true] },
	] as ITruthTable,
	OR: [
		{ params: [false, false], output: [false] },
		{ params: [true, false], output: [true] },
		{ params: [false, true], output: [true] },
		{ params: [true, true], output: [true] },
	] as ITruthTable,
	XOR: [
		{ params: [false, false], output: [false] },
		{ params: [true, false], output: [true] },
		{ params: [false, true], output: [true] },
		{ params: [true, true], output: [false] },
	] as ITruthTable,
	NOR: [
		{ params: [false, false], output: [true] },
		{ params: [true, false], output: [false] },
		{ params: [false, true], output: [false] },
		{ params: [true, true], output: [false] },
	] as ITruthTable,
	XNOR: [
		{ params: [false, false], output: [true] },
		{ params: [true, false], output: [false] },
		{ params: [false, true], output: [false] },
		{ params: [true, true], output: [true] },
	] as ITruthTable,
}
