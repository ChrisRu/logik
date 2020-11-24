import { Directive } from "vue"

const longPress: Directive<HTMLElement> = {
	beforeMount(el, binding, vNode) {
		if (typeof binding.value !== "function") {
			console.warn(
				`[longpress:] provided expression '${binding}' is not a function, but has to be. Found in component '${vNode.scopeId};`,
			)

			return
		}

		let pressTimer: number | null = null

		function start(event: MouseEvent | TouchEvent) {
			if (event.type === "click" && "button" in event && event.button !== 0) {
				return
			}

			if (pressTimer === null) {
				pressTimer = setTimeout(() => binding.value(event), 1000)
			}
		}

		function cancel() {
			if (pressTimer !== null) {
				clearTimeout(pressTimer)
				pressTimer = null
			}
		}

		el.addEventListener("mousedown", start)
		el.addEventListener("touchstart", start)
		el.addEventListener("click", cancel)
		el.addEventListener("mouseout", cancel)
		el.addEventListener("touchend", cancel)
		el.addEventListener("touchcancel", cancel)
	},
}

export default longPress
