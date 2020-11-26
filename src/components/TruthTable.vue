<template>
	<table class="table">
		<tbody class="table-body">
			<tr class="table-row" :key="index" v-for="(row, index) in truthTable">
				<td
					:class="`table-cell table-cell-param table-cell-${param ? '' : 'in'}active`"
					:key="index"
					v-for="(param, index) in row.params"
				>
					{{ param ? "1" : "0" }}
				</td>
				<td
					:class="`table-cell table-cell-output table-cell-${output ? '' : 'in'}active ${
						index === 0 ? 'table-cell-output-first' : ''
					}`"
					:key="index"
					v-for="(output, index) in row.output"
				>
					{{ output ? "1" : "0" }}
				</td>
			</tr>
		</tbody>
	</table>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Component, evaluate } from "../services/computer"

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

export default defineComponent({
	name: "TruthTable",
	props: {
		component: {
			type: Component,
			required: true,
		},
	},
	setup({ component }) {
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

		return {
			truthTable,
		}
	},
})
</script>

<style lang="scss" scoped>
$bg-params: #181818;
$bg-output: #212121;
$border: rgba(255, 255, 255, 0.3);
$on-color: #fff;
$off-color: rgba(255, 255, 255, 0.5);

.table {
	background: $bg-params;
	border-collapse: collapse;
	border-radius: 3px;
	color: $on-color;
	font-weight: bold;
	border: 1px solid $border;
}

.table-cell {
	max-width: 0;
	min-width: 20px;
	padding: 0.1rem 0.5rem;
	text-align: center;

	&-param {
		background: $bg-params;
	}

	&-output {
		background: $bg-output;

		&-first {
			border-left: 1px solid $border;
		}
	}

	&-inactive {
		color: $off-color;
	}
}
</style>
