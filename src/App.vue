<template>
	<playground />
	<notification />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Notification from "./components/Notification.vue"
import Playground from "./components/Playground.vue"

export default defineComponent({
	name: "App",
	components: {
		Playground,
		Notification,
	},
})
</script>

<style lang="scss">
@font-face {
	font-family: "Prompt";
	font-style: normal;
	font-weight: 500;
	src: local(""),
		/* Chrome 26+, Opera 23+, Firefox 39+ */ url("/fonts/prompt-v4-latin-500.woff2") format("woff2"),
		/* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */ url("/fonts/prompt-v4-latin-500.woff")
			format("woff");
}

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

$margin: 3rem;

.field {
	margin: auto;
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	bottom: 0;
	max-width: min(calc((100vh - #{$margin * 2}) * 1.5), calc(100vw - #{$margin * 2}));
	max-height: min(calc((100vh - #{$margin * 2}) * 1.5), calc(100vw - #{$margin * 2}));
	border-radius: 5px;
	box-shadow: 0px 10px 15px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 800px) {
	$margin: 0.5rem;

	.field {
		max-width: min(calc((100vh - #{$margin * 2}) * 1.5), calc(100vw - #{$margin * 2}));
		max-height: min(calc((100vh - #{$margin * 2}) * 1.5), calc(100vw - #{$margin * 2}));
	}
}
</style>
