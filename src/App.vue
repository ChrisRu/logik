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

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Prompt:wght@400;500&display=swap");

html {
	height: 100%;
}

body {
	font-family: "Prompt", sans-serif, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	margin: 0;
	height: 100%;
	background: #111;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
