<template>
	<svg viewBox="0 0 1080 720" class="field">
		<!--DRAWING LINE-->
		<path
			v-if="drawingLine.end !== null && drawingLine.start !== null"
			stroke="#fff"
			fill="none"
			stroke-width="4"
			stroke-dasharray="10 10"
			stroke-linecap="round"
			stroke-linejoin="round"
			:d="calculatePath(drawingLine.start, drawingLine.end)"
		/>

		<!--CONNECTIONS-->
		<!-- <path
			fill="none"
			:stroke="false ? 'red' : '#888'"
			stroke-width="4"
			stroke-linecap="round"
			stroke-linejoin="round"
			:d="calculatepath(getlocation(connection.from), getlocation(connection.to))"
			v-for="connection in connections"
		/> -->

		<!--LEFT SIDE OUTPUTS-->
		<rect x="0" y="0" width="64" height="720" fill="rgba(255, 255, 255, 0.03)" />
		<g :key="output ? 1 : 0 + i.toString()" v-for="(output, i) in outputs">
			<rect
				x="46"
				:y="360 - 8 + 60 * (i - (outputs.length - (outputs.length % 2)) / 2) - 2"
				width="32"
				height="4"
				fill="#444"
			/>
			<circle
				class="draggable output"
				r="8"
				cx="80"
				fill="#444"
				@mousedown="draw($event, { type: 'output', index: i })"
				@mouseup="enddraw($event, { type: 'output', index: i })"
				:cy="360 - 8 + 60 * (i - outputs.length / 2)"
			/>
			<circle
				class="toggleable"
				r="16"
				cx="32"
				:fill="output ? '#e03b3b' : '#888'"
				:cy="360 - 8 + 60 * (i - outputs.length / 2)"
				@click="outputs[i] = !output"
			/>
		</g>

		<!--components-->
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
				:cy="component.y + component.height - 20 * (i - (component.operator.length - 1) / 2)"
				r="8"
				fill="#444"
				@mousedown="draw($event, { type: 'input', content: component })"
				@mouseup="enddraw($event, { type: 'input', content: component })"
				:key="i"
				v-for="i in component.operator.length"
			/>
			<circle
				class="draggable pin"
				:cx="component.x + component.width"
				:cy="
					component.y +
					component.height -
					20 *
						(i -
							(component.operator(...Array(component.operator.length).fill(false)).length - 1) / 2)
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
				:y="component.y + component.height / 2"
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
				<circle r="16" cx="1048" fill="#888" :cy="360 - 8 + (80 * (i - 1) - (inputs - 1) / 2)" />
				<circle
					class="draggable input"
					r="8"
					cx="1000"
					fill="#444"
					@mousedown="draw($event, { type: 'input', index: i - 1 })"
					@mouseup="enddraw($event, { type: 'input', index: i - 1 })"
					:cy="360 - 8 + (80 * (i - 1) - (inputs - 1) / 2)"
				/>
			</g>
		</g>
	</svg>
</template>

<script lang="ts">
import { ref, defineComponent, reactive, computed, watchEffect, toRefs } from "vue"
import deepEqual from "fast-deep-equal"
import { AND, INV, IOperator, NAND, OR } from "../logic"

interface IPoint {
	x: number
	y: number
}

interface IComponent extends IPoint {
	outputPins: IPin[],
	inputPins: IPin[]
	operator: IOperator
	color: string
	name: string
	height: number
	width: number
}

interface IPin {
	type: "input" | "output"
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
	return {
		x: cx + r / 2 - offset,
		y: cy + r / 2 - offset,
	}
}

export default defineComponent({
	name: "Field",
	setup: () => {
		const inputs = ref(1)
		const outputs = ref([true, false])

		const drawingLine = ref<{
			pin: IPin | null
			start: IPoint | null
			end: IPoint | null
		}>({
			pin: null,
			start: null,
			end: null,
		})

		const components = ref<IComponent[]>([
			{
				inputPins: [],
				outputPins: [],
				name: "OR",
				operator: OR,
				color: "#953feb",
				x: 300,
				y: 300,
				height: 40,
				width: 80,
			},
			{
				inputPins: [],
				outputPins: [],
				name: "INV",
				operator: INV,
				color: "#dc5fdc",
				x: 500,
				y: 300,
				height: 40,
				width: 60,
			},
		])

		// const connections = ref<{ from: IPin; to: IPin }[]>([])

		// setTimeout(() => {
		// 	connections.value.push({
		// 		from: {
		// 			type: "output",
		// 			index: 0,
		// 		},
		// 		to: {
		// 			type: "input",
		// 			content: components.value[0],
		// 			index: 1,
		// 		},
		// 	})
		// 	connections.value.push({
		// 		from: {
		// 			type: "output",
		// 			index: 1,
		// 		},
		// 		to: {
		// 			type: "input",
		// 			content: components.value[0],
		// 			index: 0,
		// 		},
		// 	})

		// 	connections.value.push({
		// 		from: {
		// 			type: "output",
		// 			content: components.value[0],
		// 			index: 2,
		// 		},
		// 		to: {
		// 			type: "input",
		// 			content: components.value[1],
		// 			index: 0,
		// 		},
		// 	})

		// 	connections.value.push({
		// 		from: {
		// 			type: "output",
		// 			content: components.value[1],
		// 			index: 1,
		// 		},
		// 		to: {
		// 			type: "input",
		// 			index: 0,
		// 		},
		// 	})
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

			// const existingIndex = connections.value.findIndex(
			// 	(x) => deepEqual(x.from, fromPin) && deepEqual(x.to, toPin),
			// )
			// if (existingIndex === -1) {
			// 	connections.value = [...connections.value, { from: fromPin, to: toPin }]

			// 	const existingConnectionIndex = new Set(
			// 		connections.value
			// 			.map((x, i) => (deepEqual(x.to, toPin) ? i : undefined))
			// 			.filter((x): x is number => x !== undefined),
			// 	)
			// 	connections.value = connections.value.filter((_, i) => existingConnectionIndex.has(i))
			// } else {
			// 	connections.value = connections.value.filter((_, i) => i !== existingIndex)
			// }
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
			if (!("content" in pin)) {
				const element = document.querySelectorAll(`.field .${pin.type}`)[pin.index]
				return getCircleCenter(element, 4)
			}

			const componentIndex = pin.content ? components.value.indexOf(pin.content) : -1
			const elements = document
				.querySelectorAll(`.field .component`)
				[componentIndex].querySelectorAll(".pin")
			const element = elements[pin.index]
			return getCircleCenter(element, 4)
		}

		function getConnections(location: IPin) {}

		function isOn(location: IPin) {
			// const turnon = []

			// const queue = connections.value
			// 	.filter((x) => x.from.type === "output")
			// 	.map((x, i) => ({
			// 		from: {
			// 			...x.from,
			// 			state: outputs.value[i],
			// 		},
			// 		to: x.to,
			// 	}))
			// while (queue.length) {
			// 	const last = queue.pop()

			// 	const state = last?.from.state

			// 	turnon.push(last)
			// }

			return false
		}

		// setTimeout(() => {
		// 	const graph = []

		// 	const queue = connections.value.filter((x) => x.from.type === "output")
		// 	const had = new Set<typeof connections.value[0]>(queue)

		// 	while (queue.length) {
		// 		const current = queue.pop() as typeof connections.value[0]

		// 		graph.push({
		// 			left: [current.from],
		// 			right: [current.to],
		// 		})

		// 		const nextConnections = connections.value.filter(
		// 			(next) =>
		// 				!had.has(next) &&
		// 				(next.from.type === "output"
		// 					? deepEqual(next.from.content, current.to) ||
		// 					  deepEqual(next.from.content, current.from)
		// 					: false),
		// 		)
		// 		for (const nextConnection of nextConnections) {
		// 			had.add(nextConnection)
		// 			queue.push(nextConnection)
		// 		}
		// 	}

		// 	console.log(graph)
		// }, 100)

		return {
			inputs,
			outputs,
			components,
			move,
			draw,
			getLocation,
			calculatePath,
			enddraw,
			drawingLine,
			isOn,
		}
	},
})
</script>
