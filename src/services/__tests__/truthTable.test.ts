import { operators, Gate } from "../computer"
import { computeTruthTable, isSameTruthTable, truthTables, truthTableToLookup } from "../truthTable"

it("should get correct NOT truth table", () => {
	expect(computeTruthTable(new Gate("NOT", operators.NOT, "#ff0000"))).toEqual([
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
	expect(computeTruthTable(new Gate("AND", operators.AND, "#0000ff"))).toEqual([
		{
			params: [false, false],
			output: [false],
		},
		{
			params: [false, true],
			output: [false],
		},
		{
			params: [true, false],
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

it("should not be same NOT truth table empty", () => {
	expect(isSameTruthTable(computeTruthTable(new Gate("NOT", operators.NOT, "#00ff00")), [])).toBeFalsy()
})

it("should not be same NOT truth table extra", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Gate("NOT", operators.NOT, "#00ff00")), [
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

it("should be same NOT truth table", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Gate("NOT", operators.NOT, "#00ff00")), [
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

it("should be same NOT truth table backwards", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Gate("NOT", operators.NOT, "#00ff00")), [
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
		isSameTruthTable(computeTruthTable(new Gate("AND", operators.AND, "#880088")), [
			{
				params: [false, false],
				output: [false],
			},
			{
				params: [false, true],
				output: [false],
			},
			{
				params: [true, false],
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
		truthTableToLookup(
			computeTruthTable(
				new Gate("NOTHING", operators.NOTHING, "#008800"),
			),
		),
	)
	expect(truthTables.OR).toEqual(
		truthTableToLookup(computeTruthTable(new Gate("OR", operators.OR, "#008800"))),
	)
	expect(truthTables.AND).toEqual(
		truthTableToLookup(computeTruthTable(new Gate("AND", operators.AND, "#008800"))),
	)
	expect(truthTables.NOT).toEqual(
		truthTableToLookup(computeTruthTable(new Gate("NOT", operators.NOT, "#008800"))),
	)
	expect(truthTables.NOR).toEqual(
		truthTableToLookup(computeTruthTable(new Gate("NOR", operators.NOR, "#008800"))),
	)
	expect(truthTables.XNOR).toEqual(
		truthTableToLookup(computeTruthTable(new Gate("NOR", operators.XNOR, "#008800"))),
	)
})
