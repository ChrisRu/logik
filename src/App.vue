<template>
	<Field />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Field from "./components/Field.vue"

export default defineComponent({
	name: "App",
	components: {
		Field,
	},
})
</script>
