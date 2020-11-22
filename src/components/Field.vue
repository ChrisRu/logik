<template>
	<svg viewBox="0 0 1080 720" class="field">
		<!--DRAWING LINE-->
		<path
			stroke="#fff"
			fill="none"
			stroke-width="4"
			stroke-dasharray="10 10"
			stroke-linecap="round"
			stroke-linejoin="round"
			:d="calculatePath(drawingLine.start, drawingLine.end)"
			v-if="drawingLine.end !== null && drawingLine.start !== null"
		/>

		<!--CONNECTIONS-->
		<path
			fill="none"
			stroke-width="4"
			stroke-linecap="round"
			stroke-linejoin="round"
			:stroke="status.turnedOnConnections.has(connection) ? '#d33' : '#888'"
			:d="calculatePath(getLocation(connection.from), getLocation(connection.to))"
			:key="i"
			v-for="(connection, i) in connections"
		/>

		<!--LEFT SIDE OUTPUTS-->
		<rect x="0" y="0" width="64" height="720" fill="rgba(255, 255, 255, 0.03)" />
		<g :key="i" v-for="(output, i) in outputs">
			<rect
				x="46"
				:y="360 - 8 + 60 * (i - (outputs.length - (outputs.length % 2)) / 2) - 2"
				width="32"
				height="4"
				fill="#444"
			/>
			<circle
				class="draggable global-output pin"
				r="8"
				cx="80"
				fill="#444"
				@mousedown="draw($event, { type: 'global-output', index: i })"
				@mouseup="enddraw($event, { type: 'global-output', index: i })"
				:cy="360 - 8 + 60 * (i - outputs.length / 2)"
			/>
			<circle
				class="toggleable"
				r="16"
				cx="32"
				:fill="output.state ? '#e03b3b' : '#888'"
				:cy="360 - 8 + 60 * (i - outputs.length / 2)"
				@click="outputs[i].state = !output.state"
			/>
		</g>

		<!--COMPONENTS-->
		<g :key="component.name + i" v-for="(component, i) in components" class="component">
			<rect
				class="draggable"
				:x="component.x"
				:y="component.y"
				:width="component.width"
				:height="component.height"
				:fill="component.color"
				@mousedown="move($event, component)"
			/>
			<circle
				class="draggable pin"
				:cx="component.x"
				:cy="
					component.y +
					component.height / 2 +
					(i - 1 - component.operator.length / 2) * 8 * 2.5 +
					10
				"
				r="8"
				fill="#444"
				@mousedown="draw($event, { type: 'input', content: component, index: i - 1 })"
				@mouseup="enddraw($event, { type: 'input', content: component, index: i - 1 })"
				:key="i"
				v-for="i in component.operator.length"
			/>
			<circle
				class="draggable pin"
				:cx="component.x + component.width"
				:cy="
					component.y +
					component.height / 2 +
					(i - 1 - component.operator(...Array(component.operator.length).fill(false)).length / 2) *
						8 *
						2.5 +
					10
				"
				r="8"
				fill="#444"
				@mousedown="
					draw($event, {
						type: 'output',
						content: component,
						index: i - 1 + component.operator.length,
					})
				"
				@mouseup="
					enddraw($event, {
						type: 'output',
						content: component,
						index: i - 1 + component.operator.length,
					})
				"
				:key="i"
				v-for="i in component.operator(...Array(component.operator.length).fill(false)).length"
			/>
			<text
				:x="component.x + component.width / 2"
				:y="component.y + component.height / 2 + 1"
				dominant-baseline="middle"
				text-anchor="middle"
			>
				{{ component.name }}
			</text>
		</g>

		<!--RIGHT SIDE INPUTS-->
		<g>
			<rect x="1016" y="0" width="64" height="720" fill="rgba(255, 255, 255, 0.03)" />
			<g :key="i" v-for="i in inputs">
				<rect
					x="1000"
					:y="360 - 8 + (80 * (i - 1) - (inputs - 1) / 2) - 2"
					width="32"
					height="4"
					fill="#444"
				/>
				<circle
					:fill="
						status.turnedOnPins.has(
							connections.find((x) => x.to.type === 'global-input' && x.to.index === i - 1)?.from,
						)
							? '#e03b3b'
							: '#888'
					"
					r="16"
					cx="1048"
					:cy="360 - 8 + (80 * (i - 1) - (inputs - 1) / 2)"
				/>
				<circle
					class="draggable global-input pin"
					r="8"
					cx="1000"
					fill="#444"
					@mousedown="draw($event, { type: 'global-input', index: i - 1 })"
					@mouseup="enddraw($event, { type: 'global-input', index: i - 1 })"
					:cy="360 - 8 + (80 * (i - 1) - (inputs - 1) / 2)"
				/>
			</g>
		</g>
	</svg>
</template>

<script lang="ts">
import { ref, defineComponent, reactive, computed, watchEffect, toRefs } from "vue"
import deepEqual from "fast-deep-equal"
import { AND, INV, IOperator, NAND, OR, OS, OSF } from "../logic"

interface IPoint {
	x: number
	y: number
}

interface IComponent extends IPoint {
	operator: IOperator
	color: string
	name: string
	height: number
	width: number
}

interface IPin {
	type: "input" | "output" | "global-input" | "global-output"
	content?: IComponent
	index: number
}

function calculatePath(from: IPoint, to: IPoint) {
	return `M ${from.x},${from.y}
	        L ${to.x},${to.y}`
}

function getCircleCenter(element: Element, offset: number) {
	const cx = Number(element.getAttribute("cx") || 0)
	const cy = Number(element.getAttribute("cy") || 0)
	const r = Number(element.getAttribute("r") || 0)
	const x = cx + r / 2 - offset
	const y = cy + r / 2 - offset

	return { x, y }
}

class Component implements IComponent {
	operator: IOperator
	color: string
	name: string
	x: number
	y: number

	constructor(name: string, operator: IOperator, color: string, x?: number, y?: number) {
		this.name = name
		this.operator = operator
		this.color = color
		this.x = x || Math.random() * 900
		this.y = y || Math.random() * 600
	}

	get height() {
		return Math.max(this.operator.length * 20, 40)
	}

	get width() {
		return this.name.length * 20 + 10
	}
}

export default defineComponent({
	name: "Field",
	setup: () => {
		const inputs = ref(1)
		const outputs = ref<{ state: boolean; outputPins: IPin[] }[]>([
			{ state: true, outputPins: [] },
			{ state: false, outputPins: [] },
		])

		const drawingLine = ref<{
			pin: IPin | null
			start: IPoint | null
			end: IPoint | null
		}>({
			pin: null,
			start: null,
			end: null,
		})

		const components = ref<Component[]>([
			new Component("AND", AND, "#feb953"),
			new Component("NAND", NAND, "#69be53"),
			new Component("OR", OR, "#953feb"),
			new Component("INV", INV, "#dc5fdc"),
			new Component("INV1", OS, "#dc5fdc", 200, 500),
			new Component("INV3", OSF, "#dc5fdc", 300, 400),
		])

		const connections = ref<{ from: IPin; to: IPin }[]>([])

		// setTimeout(() => {
		// 	connections.value = [
		// 		{
		// 			from: {
		// 				type: "global-output",
		// 				index: 0,
		// 			},
		// 			to: {
		// 				type: "input",
		// 				content: components.value[0],
		// 				index: 1,
		// 			},
		// 		},
		// 		{
		// 			from: {
		// 				type: "global-output",
		// 				index: 1,
		// 			},
		// 			to: {
		// 				type: "input",
		// 				content: components.value[0],
		// 				index: 0,
		// 			},
		// 		},
		// 		{
		// 			from: {
		// 				type: "output",
		// 				content: components.value[0],
		// 				index: 2,
		// 			},
		// 			to: {
		// 				type: "input",
		// 				content: components.value[1],
		// 				index: 0,
		// 			},
		// 		},
		// 		{
		// 			from: {
		// 				type: "output",
		// 				content: components.value[1],
		// 				index: 1,
		// 			},
		// 			to: {
		// 				type: "global-input",
		// 				index: 0,
		// 			},
		// 		},
		// 	]
		// }, 0)

		function draw(event: MouseEvent | TouchEvent, to: IPin) {
			const isTouchEvent = event.type === "touchstart"
			const root =
				event.currentTarget instanceof Element ? event.currentTarget?.closest("svg") : null
			if (!root) {
				return
			}

			const moveEvent = isTouchEvent ? "touchmove" : "mousemove"
			const stopEvent = isTouchEvent ? "touchend" : "mouseup"

			const getPos = (isTouchEvent
				? function getTouchPos(event: TouchEvent, point: DOMPoint) {
						point.x = event.touches[0].clientX
						point.y = event.touches[0].clientY
				  }
				: function getMousePos(event: MouseEvent, point: DOMPoint) {
						point.x = event.clientX
						point.y = event.clientY
				  }) as (event: MouseEvent | TouchEvent, point: DOMPoint) => void

			const point = root.createSVGPoint()
			const transform = root.getScreenCTM()?.inverse()

			let isMoving = true
			let newPoint

			const update = () => {
				if (isMoving) {
					requestAnimationFrame(update)
				}

				newPoint = point.matrixTransform(transform)

				drawingLine.value.end = {
					x: newPoint.x,
					y: newPoint.y,
				}
			}

			const move = (event: MouseEvent | TouchEvent) => getPos(event, point)
			const stop = () => {
				isMoving = false
				setTimeout(() => {
					drawingLine.value = { pin: null, start: null, end: null }
				}, 0)
				root.removeEventListener(moveEvent, move)
				root.removeEventListener(stopEvent, stop)
			}

			if (event.target instanceof Element) {
				drawingLine.value.pin = to
				drawingLine.value.start = getCircleCenter(event.target, 4)
			}

			requestAnimationFrame(update)
			move(event)

			root.addEventListener(moveEvent, move)
			root.addEventListener(stopEvent, stop)
		}

		function enddraw(event: MouseEvent | TouchEvent, toPin: IPin) {
			let { pin: fromPin } = drawingLine.value
			if (!fromPin) {
				return
			}

			if (
				(fromPin.type.endsWith("output") && toPin.type.endsWith("output")) ||
				(fromPin.type.endsWith("input") && toPin.type.endsWith("input"))
			) {
				return
			}

			if ("content" in fromPin && "content" in toPin && fromPin.content === toPin.content) {
				return
			}

			// swap to correct order
			if (fromPin.type.endsWith("input")) {
				const tmp = fromPin
				fromPin = toPin
				toPin = tmp
			}

			const existingIndex = connections.value.findIndex(
				(x) => deepEqual(x.from, fromPin) && deepEqual(x.to, toPin),
			)
			if (existingIndex === -1) {
				connections.value = [...connections.value, { from: fromPin, to: toPin }]

				// const existingConnectionIndex = new Set(
				// 	connections.value
				// 		.map((x, i) => (deepEqual(x.to, toPin) ? i : undefined))
				// 		.filter((x): x is number => x !== undefined),
				// )
				// connections.value = connections.value.filter((_, i) => existingConnectionIndex.has(i))
			} else {
				connections.value = connections.value.filter((_, i) => i !== existingIndex)
			}
		}

		function move(event: MouseEvent | TouchEvent, component: IComponent) {
			const isTouchEvent = event.type === "touchstart"
			const root =
				event.currentTarget instanceof Element ? event.currentTarget?.closest("svg") : null
			if (!root) {
				return
			}

			const moveEvent = isTouchEvent ? "touchmove" : "mousemove"
			const stopEvent = isTouchEvent ? "touchend" : "mouseup"

			const getPos = (isTouchEvent
				? function getTouchPos(event: TouchEvent, point: DOMPoint) {
						point.x = event.touches[0].clientX
						point.y = event.touches[0].clientY
				  }
				: function getMousePos(event: MouseEvent, point: DOMPoint) {
						point.x = event.clientX
						point.y = event.clientY
				  }) as (event: MouseEvent | TouchEvent, point: DOMPoint) => void

			const point = root.createSVGPoint()
			const transform = root.getScreenCTM()?.inverse()

			let isMoving = true
			let newPoint

			let mouseOffsetX = 0
			let mouseOffsetY = 0
			if (event.currentTarget instanceof Element) {
				const mouseOffset = root.createSVGPoint()
				getPos(event, mouseOffset)

				const boundingBox = event.currentTarget.getBoundingClientRect()
				mouseOffsetX = mouseOffset.x - boundingBox.x
				mouseOffsetY = mouseOffset.y - boundingBox.y
			}

			const update = () => {
				if (isMoving) {
					requestAnimationFrame(update)
				}

				newPoint = point.matrixTransform(transform)
				component.x = Math.min(Math.max(64, newPoint.x - mouseOffsetX), 1080 - component.width - 64)
				component.y = Math.min(Math.max(0, newPoint.y - mouseOffsetY), 720 - component.height)
			}

			const move = (event: MouseEvent | TouchEvent) => getPos(event, point)
			const stop = () => {
				isMoving = false
				root.removeEventListener(moveEvent, move)
				root.removeEventListener(stopEvent, stop)
			}

			requestAnimationFrame(update)
			move(event)

			root.addEventListener(moveEvent, move)
			root.addEventListener(stopEvent, stop)
		}

		function getLocation(pin: IPin) {
			if (pin.type.startsWith("global")) {
				const element = document.querySelectorAll(`.field .pin.${pin.type}`)[pin.index]
				return getCircleCenter(element, 4)
			}

			const componentIndex = pin.content ? components.value.indexOf(pin.content) : -1
			const elements = document
				.querySelectorAll(`.field .component`)
				[componentIndex].querySelectorAll(".pin")
			const element = elements[pin.index]
			return getCircleCenter(element, 4)
		}

		interface Graph {
			inputPin: IPin
			outputPins: Graph[]
		}

		const status = computed(() => {
			const graph: Graph[] = []

			const on = new Set<IPin>()
			const off = new Set<IPin>()

			const queue: IPin[] = connections.value
				.filter(({ from, to }) => from.type === "global-output")
				.map((x) => x.from)

			while (queue.length) {
				const current = queue.shift() as typeof queue[0]

				if (current.type === "global-output") {
					for (const { from, to } of connections.value) {
						if (from === current) {
							queue.push(to)

							if (outputs.value[current.index].state) {
								on.add(from)
							} else {
								off.add(from)
							}
						}
					}
				} else if (current.type === "global-input") {
					for (const { from, to } of connections.value) {
						if (to === current && !on.has(from) && !off.has(from)) {
							queue.push(from)
						}
					}
				} else if (current.type === "input") {
					if (current.content?.operator === undefined) {
						throw new Error("Operator is not defined for component")
					}

					const parameterConnections = connections.value.filter(
						({ to }) => to.content === current.content,
					)
					if (parameterConnections.length !== current.content?.operator.length) {
						console.warn(`Wiring incomplete for ${current.type} ${current.content?.name}`)
						continue
					}

					const params = parameterConnections
						.sort((a, b) => a.from.index - b.from.index)
						.map(({ from }) => (on.has(from) ? true : off.has(from) ? false : undefined))
					if (params.includes(undefined)) {
						console.warn(`Wiring incomplete for ${current.type} ${current.content?.name}`)
						continue
					}
					const status = current.content?.operator(...(params as boolean[]))

					for (const { from, to } of connections.value) {
						if (from.content === current.content) {
							const statusIndex = from.index - current.content.operator.length
							if (status[statusIndex]) {
								on.add(from)
							} else {
								off.add(from)
							}

							queue.push(to)
						}
					}
				} else if (current.type === "output") {
					if (!current.content) {
						throw new Error("Broken component, has no content")
					}

					for (const { from, to } of connections.value) {
						if (to.content === current.content) {
							queue.push(from)
						}
					}
				} else {
					throw new Error(`Unknown component type ${current.type}`)
				}
			}

			const turnedOnConnections = connections.value.filter(({ from }) => on.has(from))

			return {
				turnedOnConnections: new Set(turnedOnConnections),
				turnedOnPins: new Set(turnedOnConnections.map(({ from }) => from)),
			}
		})

		return {
			inputs,
			outputs,
			components,
			drawingLine,
			connections,
			move,
			draw,
			getLocation,
			calculatePath,
			enddraw,
			status,
		}
	},
})
</script>

<style lang="scss" scoped>
.field {
	display: block;
	box-sizing: border-box;
	width: 90vw;
	margin: 30px auto;
	background: #212121;

	.pin:hover {
		fill: #888;
	}

	.toggleable {
		&:hover,
		&:active {
			cursor: pointer;
		}
	}

	.draggable {
		&:hover {
			cursor: grab;
		}
		&:active {
			cursor: grabbing;
		}
	}

	text {
		font-family: "Prompt", sans-serif, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		fill: white;
		font-weight: 500;
		letter-spacing: 0.3px;
		padding-top: 2px;
		text-transform: uppercase;
		pointer-events: none;
	}
}
</style>
