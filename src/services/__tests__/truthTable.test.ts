import { AND, Component, INV, IOperator } from "../computer"
import { computeTruthTable, isSameTruthTable, truthTables } from "../truthTable"

it("should get correct INV truth table", () => {
	expect(computeTruthTable(new Component("INV", INV, "#ff0000"))).toEqual([
		{
			params: [false],
			output: [true],
		},
		{
			params: [true],
			output: [false],
		},
	])
})

it("should get correct AND truth table", () => {
	expect(computeTruthTable(new Component("AND", AND, "#0000ff"))).toEqual([
		{
			params: [false, false],
			output: [false],
		},
		{
			params: [true, false],
			output: [false],
		},
		{
			params: [false, true],
			output: [false],
		},
		{
			params: [true, true],
			output: [true],
		},
	])
})

it("should not be same empty truth table", () => {
	expect(isSameTruthTable([], [])).toBeTruthy()
})

it("should not be same INV truth table empty", () => {
	expect(isSameTruthTable(computeTruthTable(new Component("INV", INV, "#00ff00")), [])).toBeFalsy()
})

it("should not be same INV truth table extra", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Component("INV", INV, "#00ff00")), [
			{
				params: [true],
				output: [false],
			},
			{
				params: [false],
				output: [true],
			},
			{
				params: [false, true],
				output: [true],
			},
		]),
	).toBeFalsy()
})

it("should be same INV truth table", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Component("INV", INV, "#00ff00")), [
			{
				params: [false],
				output: [true],
			},
			{
				params: [true],
				output: [false],
			},
		]),
	).toBeTruthy()
})

it("should be same INV truth table backwards", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Component("INV", INV, "#00ff00")), [
			{
				params: [true],
				output: [false],
			},
			{
				params: [false],
				output: [true],
			},
		]),
	).toBeTruthy()
})

it("should be same AND truth table", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Component("AND", AND, "#880088")), [
			{
				params: [false, false],
				output: [false],
			},
			{
				params: [true, false],
				output: [false],
			},
			{
				params: [false, true],
				output: [false],
			},
			{
				params: [true, true],
				output: [true],
			},
		]),
	).toBeTruthy()
})

it("should have defined correct truth tables", () => {
	expect(truthTables.NOTHING).toEqual(
		computeTruthTable(
			new Component("NOTHING", ((param: boolean) => [param]) as IOperator, "#008800"),
		),
	)
	expect(truthTables.AND).toEqual(computeTruthTable(new Component("AND", AND, "#008800")))
	expect(truthTables.INV).toEqual(computeTruthTable(new Component("INV", INV, "#008800")))
})
