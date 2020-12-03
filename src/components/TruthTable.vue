<template>
	<div v-if="truthTable.length > 16" class="table-too-big">Truth table too big to display</div>
	<table v-else class="table">
		<tbody class="table-body">
			<!--Keys as index, as the data should be static -->
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
import { computed, defineComponent } from "vue"
import { Gate } from "../services/computer"
import { lookupToTruthTable } from "../services/truthTable"

export default defineComponent({
	name: "TruthTable",
	props: {
		gate: {
			type: Gate,
			required: true,
		},
	},
	setup({ gate }) {
		const truthTable = computed(() => lookupToTruthTable(gate.truthTable))

		return {
			truthTable,
		}
	},
})
</script>

<style lang="scss" scoped>
$bg-params: #181818;
$bg-output: #212121;
$border: #282828;
$on-color: #fff;
$off-color: rgba(255, 255, 255, 0.5);

.table-too-big {
	background: $bg-params;
	border: 1px solid $border;
	border-radius: 3px;
	color: $on-color;
	font-weight: bold;
	padding: 8px;
	width: 200px;
}

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
