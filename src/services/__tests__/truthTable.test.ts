import { AND, Component, NOT, Operator, NOR, OR, XNOR } from "../computer"
import { computeTruthTable, isSameTruthTable, truthTables } from "../truthTable"

it("should get correct NOT truth table", () => {
	expect(computeTruthTable(new Component("NOT", NOT, "#ff0000"))).toEqual([
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

it("should not be same NOT truth table empty", () => {
	expect(isSameTruthTable(computeTruthTable(new Component("NOT", NOT, "#00ff00")), [])).toBeFalsy()
})

it("should not be same NOT truth table extra", () => {
	expect(
		isSameTruthTable(computeTruthTable(new Component("NOT", NOT, "#00ff00")), [
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
		isSameTruthTable(computeTruthTable(new Component("NOT", NOT, "#00ff00")), [
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
		isSameTruthTable(computeTruthTable(new Component("NOT", NOT, "#00ff00")), [
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
			new Component("NOTHING", ((param: boolean) => [param]) as Operator, "#008800"),
		),
	)
	expect(truthTables.OR).toEqual(computeTruthTable(new Component("OR", OR, "#008800")))
	expect(truthTables.AND).toEqual(computeTruthTable(new Component("AND", AND, "#008800")))
	expect(truthTables.NOT).toEqual(computeTruthTable(new Component("NOT", NOT, "#008800")))
	expect(truthTables.NOR).toEqual(computeTruthTable(new Component("NOR", NOR, "#008800")))
	expect(truthTables.XNOR).toEqual(computeTruthTable(new Component("NOR", XNOR, "#008800")))
})
