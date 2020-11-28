<template>
	<div v-if="notificationContent" class="notification" @click="clearNotification">
		<span class="notification-content">{{ notificationContent }}</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue"

const notificationTime = 4000

export default defineComponent({
	name: "notification",
	setup() {
		const notificationContent = ref<string | null>()
		const timer = ref<number | null>(null)

		function clearNotification() {
			notificationContent.value = null
			clearTimer()
		}

		function clearTimer() {
			if (timer.value !== null) {
				clearTimeout(timer.value)
				timer.value = null
			}
		}

		function handleNotification(event: CustomEvent<string>) {
			if (typeof event.detail !== "string" || !event.detail) {
				return
			}

			notificationContent.value = event.detail

			clearTimer()

			timer.value = setTimeout(() => {
				notificationContent.value = null
			}, notificationTime)
		}

		onMounted(() => {
			window.addEventListener("logik-hint", handleNotification as EventListener)
		})

		onBeforeUnmount(() => {
			window.removeEventListener("logik-hint", handleNotification as EventListener)

			clearTimer()
		})

		return {
			notificationContent,
			clearNotification,
		}
	},
})
</script>

<style lang="scss" scoped>
.notification {
	backdrop-filter: blur(5px);
	background: rgba(#212121, 0.8);
	border-radius: 5px;
	box-shadow: 0px 10px 15px 8px rgba(0, 0, 0, 0.1);
	cursor: pointer;
	font-size: 18px;
	margin: 0 auto;
	max-width: 300px;
	top: 36px;
	right: 36px;
	padding: 10px 16px;
	position: fixed;
	animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
	0% {
		transform: translateX(80%);
		opacity: 0;
	}

	50% {
		opacity: 0.8;
	}

	100% {
		transform: translateX(0);
		opacity: 1;
	}
}
</style>
