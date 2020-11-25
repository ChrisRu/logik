<template>
	<svg @contextmenu.prevent viewBox="0 0 1080 720" class="field" preserveAspectRatio="xMidYMid meet">
		<defs>
			<filter id="active-shadow">
				<feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#9c1919" flood-opacity="0.5" />
			</filter>
			<filter id="grayscale">
				<feColorMatrix type="saturate" values="0.2" />
			</filter>
			<filter id="active-shadow-grayscale">
				<feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#9c1919" flood-opacity="0.5" />
				<feColorMatrix type="saturate" values="0.8" />
			</filter>
			<filter id="bright">
				<feComponentTransfer>
					<feFuncR type="linear" slope="1.5"></feFuncR>
					<feFuncG type="linear" slope="1.5"></feFuncG>
					<feFuncB type="linear" slope="1.5"></feFuncB>
				</feComponentTransfer>
			</filter>
			<filter id="not-bright">
				<feComponentTransfer>
					<feFuncR type="linear" slope="0.85"></feFuncR>
					<feFuncG type="linear" slope="0.85"></feFuncG>
					<feFuncB type="linear" slope="0.85"></feFuncB>
				</feComponentTransfer>
			</filter>
		</defs>

		<!-- Component Picker -->
		<g>
			<rect x="64" y="0" width="952" height="50" fill="#282828" />
			<g
				v-for="(component, index) in availableComponents"
				:key="component.name"
				@mousedown.left="createAndMove($event, component)"
			>
				<rect
					class="component-picker"
					fill="#444"
					:x="72 + availableComponents.slice(0, index).reduce((count, x) => count + x.width + 8, 0)"
					y="8"
					height="34"
					:width="component.width"
				/>
				<text
					fill="white"
					font-size="16"
					dominant-baseline="middle"
					text-anchor="middle"
					:x="
						72 +
						availableComponents.slice(0, index).reduce((count, x) => count + x.width + 8, 0) +
						component.width / 2
					"
					y="27"
				>
					{{ component.name }}
				</text>
			</g>
		</g>

		<!--DRAWING LINE-->
		<path
			v-if="drawingLineStart !== null && drawingLine.end !== null"
			:class="drawingLineStatus ? 'active-stroke' : 'inactive-stroke'"
			:d="calculatePath(drawingLineStart, drawingLine.end)"
			fill="none"
			stroke-width="4"
			stroke-dasharray="10 10"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<!--CONNECTIONS-->
		<path
			v-for="connection in connections"
			:key="connection.key"
			:class="connection.active ? 'active-stroke' : 'inactive-stroke'"
			:d="calculatePath(connection.fromLocation, connection.toLocation)"
			@mouseup.right="clearPinConnections(connection.to)"
			fill="none"
			stroke-width="4"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<!--LEFT SIDE OUTPUTS-->
		<g class="sidebar sidebar-left">
			<rect x="0" y="0" width="64" height="720" fill="rgba(255, 255, 255, 0.03)" />
			<g v-for="output in outputs" :key="output.key" @mouseup.left="endDraw(output.pin)">
				<circle
					:cy="output.location.y"
					:cx="output.location.x"
					@mousedown.left="draw($event, output.pin)"
					@mouseup.right="clearPinConnections(output.pin)"
					class="draggable global-output pin"
					r="8"
				/>
				<rect
					:x="output.location.x - 32"
					:y="output.location.y - 2"
					width="32"
					height="4"
					class="pin-arrow"
				/>
				<circle
					:class="`toggleable ${output.active ? 'active' : 'inactive'}-bg`"
					:cx="output.location.x - 48"
					:cy="output.location.y"
					@click="output.toggle()"
					@mouseup.right="output.remove()"
					r="16"
				/>
			</g>

			<g
				:class="`button-add ${outputs.length > 5 ? 'disabled' : ''}`"
				@click="addOutput()"
				@mouseup.left="endDrawOnNewPin('global-output')"
			>
				<circle
					:cx="addOutputLocation.x"
					:cy="addOutputLocation.y + 8"
					class="disabled-bg"
					r="16"
				/>
				<line
					:x1="addOutputLocation.x"
					:y1="addOutputLocation.y"
					:x2="addOutputLocation.x"
					:y2="addOutputLocation.y + 16"
					class="inactive-stroke"
					stroke-linecap="round"
					stroke-width="3"
				/>
				<line
					class="inactive-stroke"
					stroke-linecap="round"
					stroke-width="3"
					:x1="addOutputLocation.x - 8"
					:y1="addOutputLocation.y + 8"
					:x2="addOutputLocation.x + 8"
					:y2="addOutputLocation.y + 8"
				/>
			</g>
		</g>

		<!--COMPONENTS-->
		<g v-for="component in components" :key="component.key" class="component">
			<rect
				:x="component.content.x"
				:y="component.content.y"
				:width="component.content.width"
				:height="component.content.height"
				:fill="component.content.color"
				@touchstart="move($event, component.content)"
				@mousedown.left="move($event, component.content)"
				@mouseup.left="endDrawOnComponent(component)"
				@mouseup.right="component.remove()"
				class="draggable"
				rx="3"
				ry="3"
			/>
			<circle
				v-for="inputPin in component.inputPins"
				:key="inputPin.index"
				:cx="inputPin.location.x"
				:cy="inputPin.location.y"
				@mousedown.left="draw($event, inputPin.pin)"
				@mouseup.left="endDraw(inputPin.pin)"
				@mouseup.right="clearPinConnections(inputPin.pin)"
				class="draggable pin"
				r="8"
			/>
			<circle
				v-for="outputPin in component.outputPins"
				:key="outputPin.index"
				:cx="outputPin.location.x"
				:cy="outputPin.location.y"
				@mousedown.left="draw($event, outputPin.pin)"
				@mouseup.left="endDraw(outputPin.pin)"
				@mouseup.right="clearPinConnections(outputPin.pin)"
				class="draggable pin"
				r="8"
			/>
			<text
				:x="component.content.x + component.content.width / 2"
				:y="component.content.y + component.content.height / 2 + 1"
				dominant-baseline="middle"
				text-anchor="middle"
			>
				{{ component.content.name }}
			</text>
		</g>

		<!--RIGHT SIDE INPUTS-->
		<g class="sidebar sidebar-right">
			<rect x="1016" y="0" width="64" height="720" fill="rgba(255, 255, 255, 0.03)" />
			<g v-for="input in inputs" :key="input.index" @mouseup.left="endDraw(input.pin)">
				<circle
					:class="input.active ? 'active-bg' : 'inactive-bg'"
					:cx="input.location.x + 48"
					:cy="input.location.y"
					@mouseup.right="input.remove()"
					r="16"
				/>
				<circle
					:cx="input.location.x"
					:cy="input.location.y"
					@mouseup.right="clearPinConnections(input.pin)"
					@mousedown.left="draw($event, input.pin)"
					class="draggable global-input pin"
					r="8"
				/>
				<rect
					:x="input.location.x"
					:y="input.location.y - 2"
					class="pin-arrow"
					width="32"
					height="4"
				/>
			</g>
			<g
				:class="`button-add ${outputs.length > 5 ? 'disabled' : ''}`"
				@click="addInput()"
				@mouseup.left="endDrawOnNewPin('global-input')"
			>
				<circle :cx="addInputLocation.x" :cy="addInputLocation.y + 8" class="disabled-bg" r="16" />
				<line
					class="inactive-stroke"
					stroke-linecap="round"
					stroke-width="3"
					:x1="addInputLocation.x"
					:y1="addInputLocation.y"
					:x2="addInputLocation.x"
					:y2="addInputLocation.y + 16"
				/>
				<line
					class="inactive-stroke"
					stroke-linecap="round"
					stroke-width="3"
					:x1="addInputLocation.x - 8"
					:y1="addInputLocation.y + 8"
					:x2="addInputLocation.x + 8"
					:y2="addInputLocation.y + 8"
				/>
			</g>
		</g>
	</svg>
</template>

<script lang="ts">
import { ref, defineComponent, computed } from "vue"
import deepEqual from "fast-deep-equal"
import * as uuid from "uuid"
import { AND, INV, NAND, OR } from "../services/logic"
import { IPoint, IPin, Component, IConnection, compute } from "../services/computer"
import { createDragFunction, getTouchPos } from "../services/drag"

function calculatePath(from: IPoint, to: IPoint) {
	return `M ${from.x},${from.y}
	        L ${to.x},${to.y}`
}

interface IOutput {
	state: boolean
	key: string
}

export default defineComponent({
	name: "Playground",
	setup() {
		const inputs = ref(1)

		const outputs = ref<IOutput[]>([
			{ key: uuid.v4(), state: true },
			{ key: uuid.v4(), state: false },
			{ key: uuid.v4(), state: true },
		])

		const drawingLine = ref<{
			pin: IPin | null
			end: IPoint | null
		}>({
			pin: null,
			end: null,
		})

		const availableComponents = ref([
			new Component("INV", INV, "#dc5fdc"),
			new Component("AND", AND, "#feb953"),
			new Component("OR", OR, "#953feb"),
			new Component("NAND", NAND, "#69be53"),
		])

		const components = ref<Component[]>([])

		const connections = ref<IConnection[]>([])

		function addOutput(): void {
			outputs.value = [...outputs.value, { key: uuid.v4(), state: false }]
		}

		function addInput(): void {
			if (inputs.value < 6) {
				inputs.value++
			}
		}

		function removeInput(pin: IPin): void {
			clearPinConnections(pin)

			if (inputs.value > 1) {
				for (const connection of connections.value) {
					if (connection.to.type === "global-input" && connection.to.index > pin.index) {
						connection.to.index--
					}
				}

				inputs.value--
			}
		}

		function removeOutput(pin: IPin): void {
			clearPinConnections(pin)

			outputs.value = outputs.value.filter((_, i) => i !== pin.index)

			for (const connection of connections.value) {
				if (connection.from.type === "global-output" && connection.from.index > pin.index) {
					connection.from.index--
				}
			}

			if (outputs.value.length === 0) {
				outputs.value = [{ key: uuid.v4(), state: false }]
			}
		}

		function clearPinConnections(pin: IPin): void {
			const pinConnections = connections.value.map(({ from, to }, i) => {
				if (deepEqual(from, pin) || deepEqual(to, pin)) {
					return i
				}
			})

			connections.value = connections.value.filter((_, i) => !pinConnections.includes(i))
		}

		const draw = createDragFunction<IPin>({
			onStart: (pin) => (drawingLine.value.pin = pin),
			onUpdate: (point) => (drawingLine.value.end = point),
			onStop: () => (drawingLine.value = { pin: null, end: null }),
		})

		const move = createDragFunction<Component>({
			withPointerOffset: true,
			onUpdate: ({ x, y }, component) => {
				component.x = Math.min(Math.max(64, x), 1080 - component.width - 64)
				component.y = Math.min(Math.max(64, y), 720 - component.height)
			},
		})

		function createAndMove(event: MouseEvent | TouchEvent, componentRef: Component): void {
			const root =
				event.currentTarget instanceof Element ? event.currentTarget.closest("svg") : null
			if (!root) {
				return
			}

			let point = root.createSVGPoint()

			getTouchPos(event, point)

			const rootTransformMatrix = root.getScreenCTM()?.inverse()

			point = point.matrixTransform(rootTransformMatrix)

			const component = new Component(
				componentRef.name,
				componentRef.operator,
				componentRef.color,
				point.x + 64,
				point.y + 64,
			)

			components.value = [...components.value, component]
		}

		function endDrawOnNewPin(type: "global-input" | "global-output"): void {
			if (!drawingLine.value.pin) {
				return
			}

			if (type === "global-output") {
				if (drawingLine.value.pin.type.endsWith("input")) {
					addOutput()
					endDraw({ type, index: outputs.value.length - 1 })
				}
			} else if (type === "global-input") {
				if (drawingLine.value.pin.type.endsWith("output")) {
					addInput()
					endDraw({ type, index: inputs.value - 1 })
				}
			} else {
				throw new Error(`Unknown pin type: ${type}`)
			}
		}

		function endDrawOnComponent(component: typeof calculatedComponents.value[0]): void {
			if (!drawingLine.value.pin) {
				return
			}

			if (drawingLine.value.pin.type.endsWith("output")) {
				const activePinIndexes = connections.value
					.filter(({ to }) => to.content === component.content)
					.map(({ to }) => to.index)

				if (activePinIndexes.length === component.inputPins.length) {
					if (activePinIndexes.length === 1) {
						endDraw(component.inputPins[0].pin)
					}

					return
				}

				for (const inputPin of component.inputPins) {
					if (!activePinIndexes.includes(inputPin.pin.index)) {
						endDraw(inputPin.pin)
						return
					}
				}
			} else {
				const activePinIndexes = connections.value
					.filter(({ from }) => from.content === component.content)
					.map(({ from }) => from.index)

				if (activePinIndexes.length === component.outputPins.length) {
					if (activePinIndexes.length === 1) {
						endDraw(component.outputPins[0].pin)
					}

					return
				}

				for (const outputPin of component.outputPins) {
					if (!activePinIndexes.includes(outputPin.pin.index)) {
						endDraw(outputPin.pin)
						return
					}
				}
			}
		}

		function endDraw(toPin: IPin): void {
			if (!toPin) {
				return
			}

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

			if (fromPin.type.endsWith("input")) {
				;[fromPin, toPin] = [toPin, fromPin]
			}

			const sameConnectionIndex = connections.value.findIndex(
				({ from, to }) => deepEqual(from, fromPin) && deepEqual(to, toPin),
			)
			if (sameConnectionIndex > -1) {
				connections.value = connections.value.filter((_, i) => i !== sameConnectionIndex)
			} else {
				const existingInputPinIndex = connections.value.findIndex(({ to }) => deepEqual(to, toPin))
				if (existingInputPinIndex > -1) {
					connections.value = connections.value.filter((_, i) => i !== existingInputPinIndex)
				}

				connections.value = [...connections.value, { key: uuid.v4(), from: fromPin, to: toPin }]
			}
		}

		function getPinLocation(pin: IPin): IPoint {
			switch (pin.type) {
				case "global-output":
					return {
						x: 80,
						y: 360 + (pin.index - outputs.value.length / 2 + 0.5) * 80,
					}
				case "global-input":
					return {
						x: 1000,
						y: 360 + (pin.index - inputs.value / 2 + 0.5) * 80,
					}
				case "output":
					if (!pin.content) {
						throw new Error("Broken input pin, no content defined")
					}

					return {
						x: pin.content.x + pin.content.width,
						y:
							pin.content.y +
							pin.content.height / 2 +
							(pin.index - pin.content.operatorInputs - pin.content.operatorOutputs / 2) * 8 * 2.3 +
							10,
					}
				case "input":
					if (!pin.content) {
						throw new Error("Broken output pin, no content defined")
					}

					return {
						x: pin.content.x,
						y:
							pin.content.y +
							pin.content.height / 2 +
							(pin.index - pin.content.operatorInputs / 2) * 8 * 2.3 +
							10,
					}

				default:
					throw new Error(`Unknown pin type ${pin.type}`)
			}
		}

		function removeComponent(component: Component): void {
			connections.value = connections.value.filter(
				({ from, to }) => from.content !== component && to.content !== component,
			)
			components.value = components.value.filter((c) => c !== component)
		}

		const status = computed(() => {
			const turnedOnPins = compute(
				connections.value,
				outputs.value.map(({ state }) => state),
			)
			const turnedOnConnections = new Set(
				connections.value.filter(({ from }) => turnedOnPins.has(from)),
			)

			return {
				turnedOnPins,
				turnedOnConnections,
			}
		})

		const calculatedConnections = computed(() =>
			connections.value.map((connection) => ({
				key: connection.key,
				active: status.value.turnedOnConnections.has(connection),
				from: connection.from,
				to: connection.to,
				fromLocation: getPinLocation(connection.from),
				toLocation: getPinLocation(connection.to),
			})),
		)

		const calculatedOutputs = computed(() =>
			outputs.value.map(({ key, state }, index) => {
				const pin: IPin = { type: "global-output", index }

				return {
					key,
					pin,
					active: state,
					location: getPinLocation(pin),
					toggle: () => (outputs.value[index].state = !state),
					remove: () => removeOutput(pin),
				}
			}),
		)

		const calculatedInputs = computed(() =>
			Array(inputs.value)
				.fill(undefined)
				.map((_, index) => {
					const pin: IPin = { type: "global-input", index }
					const connection = connections.value.find(({ to }) => deepEqual(to, pin))

					return {
						index,
						pin,
						active: connection && status.value.turnedOnPins.has(connection.from),
						location: getPinLocation(pin),
						remove: () => removeInput(pin),
					}
				}),
		)

		const calculatedComponents = computed(() =>
			components.value.map((component) => ({
				key: component.key,
				content: component,
				remove: () => removeComponent(component),
				inputPins: Array(component.operatorInputs)
					.fill(0)
					.map((_, index) => {
						const pin: IPin = {
							type: "input",
							content: component,
							index,
						}

						return {
							index,
							pin,
							location: getPinLocation(pin),
						}
					}),
				outputPins: Array(component.operatorOutputs)
					.fill(0)
					.map((_, pinIndex) => {
						const index = pinIndex + component.operatorInputs
						const pin: IPin = {
							type: "output",
							content: component,
							index,
						}

						return {
							index,
							pin,
							location: getPinLocation(pin),
						}
					}),
			})),
		)

		const drawingLineStart = computed(() =>
			drawingLine.value.pin ? getPinLocation(drawingLine.value.pin) : null,
		)

		const drawingLineStatus = computed(() => {
			const { pin } = drawingLine.value
			if (!pin) {
				return false
			}

			if (pin.type === "global-output") {
				return outputs.value[pin.index].state
			}

			if (pin.type === "output" && pin.content) {
				const parameterConnections = connections.value.filter(
					({ to }) => to.content === pin.content,
				)
				if (parameterConnections.length === pin.content.operatorInputs) {
					const params = parameterConnections
						.sort((a, b) => a.to.index - b.to.index)
						.map(({ from }) => status.value.turnedOnPins.has(from))

					return pin.content.operator(...params)[pin.index - pin.content.operatorInputs]
				}
			}

			return false
		})

		const addOutputLocation = computed(() => {
			const pinLocation = getPinLocation({ index: outputs.value.length, type: "global-output" })

			return {
				x: pinLocation.x - 48,
				y: pinLocation.y - 6,
			}
		})

		const addInputLocation = computed(() => {
			const pinLocation = getPinLocation({ index: inputs.value, type: "global-input" })

			return {
				x: pinLocation.x + 48,
				y: pinLocation.y - 6,
			}
		})

		return {
			inputs: calculatedInputs,
			outputs: calculatedOutputs,
			components: calculatedComponents,
			connections: calculatedConnections,
			addOutputLocation,
			addInputLocation,
			availableComponents,
			drawingLineStatus,
			drawingLineStart,
			drawingLine,
			move,
			createAndMove,
			draw,
			endDraw,
			endDrawOnComponent,
			endDrawOnNewPin,
			calculatePath,
			clearPinConnections,
			addOutput,
			addInput,
		}
	},
})
</script>

<style lang="scss" scoped>
$bg: #212121;
$pin: #444;
$off: #888;
$on: #e03b3b;

.field {
	box-sizing: border-box;
	background: $bg;
}

.component {
	&:hover,
	&:active {
		rect {
			filter: url(#not-bright);
		}
	}

	&-picker {
		fill: $pin;
		cursor: pointer;

		&:hover {
			fill: lighten($pin, 10%);
		}
	}
}

.button-add {
	&.disabled {
		visibility: hidden;
	}

	&:not(.disabled) {
		cursor: pointer;

		&:hover {
			filter: url(#bright);
		}
	}
}

.disabled-bg {
	fill: $pin;
}

.active-bg {
	fill: $on;
	filter: url(#active-shadow);

	&.toggleable:hover {
		filter: url(#active-shadow-grayscale);
	}
}

.active-stroke {
	stroke: $on;
	filter: url(#active-shadow);
}

.inactive-bg {
	fill: $off;

	&.toggleable:hover {
		filter: url(#grayscale);
		fill: $on;
	}
}

.inactive-stroke {
	stroke: $off;
}

.pin-arrow {
	fill: $pin;
	pointer-events: none;
}

.pin {
	fill: $pin;

	&:hover {
		fill: $off;

		& + .pin-arrow {
			fill: $off;
		}
	}
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
	font-family: "Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
	fill: white;
	font-weight: 500;
	letter-spacing: 0.3px;
	padding-top: 2px;
	text-transform: uppercase;
	pointer-events: none;
	user-select: none;
}

.truth-table-wrapper {
	position: absolute;
	top: 5rem;
	left: 5rem;
}
</style>
