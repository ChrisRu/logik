<template>
	<div class="wrapper">
		<div class="modal">
			<div class="title-wrapper">
				<span class="title">
					<slot></slot>
				</span>
			</div>
			<div class="actions">
				<button class="button" @click="onClose()">Cancel</button>
				<button class="button button-action" @click="onAccept()">{{ confirmMessage }}</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted } from "vue"

export default defineComponent({
	name: "Modal",
	props: {
		confirmMessage: {
			type: String,
			default: "OK",
		},
		onAccept: {
			type: Function,
			required: true,
		},
		onClose: {
			type: Function,
			required: true,
		},
	},
	setup({ onClose }) {
		function onKeyPress(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose()
			}
		}

		onMounted(() => {
			window.addEventListener("keydown", onKeyPress)
		})

		onBeforeUnmount(() => {
			window.removeEventListener("keydown", onKeyPress)
		})
	},
})
</script>

<style lang="scss" scoped>
$font: "Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
$on: #e03b3b;

.wrapper {
	align-items: center;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	height: 100%;
	justify-content: center;
	pointer-events: none;
	width: 100%;
}

.modal {
	backdrop-filter: blur(5px) brightness(100%);
	background: rgba(#282828, 0.4);
	border-radius: 5px;
	box-shadow: 0px 10px 15px 8px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
	color: #fff;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	max-width: 350px;
	overflow: hidden;
	pointer-events: all;
	text-align: center;
}

.title-wrapper {
	align-items: center;
	display: flex;
	flex: 1;
	justify-content: center;
	padding: 16px;
}

.title {
	font-size: 18px;
}

.actions {
	background: #282828;
	display: flex;
	justify-content: flex-end;
	padding: 8px 8px;
}

.button {
	background: #181818;
	border: 1px solid transparent;
	box-sizing: border-box;
	color: #fff;
	cursor: pointer;
	font-family: $font;
	font-size: 16px;
	margin: 8px;
	outline: none;
	padding: 4px 16px;

	&:focus {
		border-color: rgba(255, 255, 255, 0.5);
	}

	&:hover {
		background: #111;
	}

	&-action {
		background: $on;
		box-shadow: 0 3px 5px rgba(darken($on, 10%), 0.5);

		&:hover {
			background: darken($on, 10%);
		}
	}
}
</style>
