<template>
	<playground />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Playground from "./components/Playground.vue"

export default defineComponent({
	name: "App",
	components: {
		Playground,
	},
})
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Prompt:wght@400;500&display=swap");

html {
	height: 100%;
}

body {
	font-family: "Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	margin: 0;
	height: 100%;
	background: #181818;
	color: #fff;
}

#app {
	height: 100%;
	box-sizing: border-box;
	position: relative;
}

$padding: 2rem;

.field {
	margin: auto;
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	bottom: 0;
	max-width: calc(100% - #{$padding} * 2);
	max-height: calc(100vh - #{$padding} * 2);
	border-radius: 5px;
	box-shadow: 0px 10px 15px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 800px) {
	$padding: 0.5rem;

	.field {
		max-width: calc(100% - #{$padding} * 2);
		max-height: calc(100vh - #{$padding} * 2);
	}
}
</style>
