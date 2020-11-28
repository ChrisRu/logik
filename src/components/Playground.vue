<template>
	<svg
		@contextmenu.prevent
		viewBox="0 0 1080 720"
		class="field"
		preserveAspectRatio="xMidYMid meet"
	>
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

		<!-- DRAWING LINE -->
		<path
			v-if="drawingLineStart && drawingLine.end"
			:class="drawingLineStatus ? 'active-stroke' : 'inactive-stroke'"
			:d="calculatePath(drawingLineStart, drawingLine.end)"
			fill="none"
			stroke-width="4"
			stroke-dasharray="10 10"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<!-- CONNECTIONS -->
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

		<!-- LEFT SIDE OUTPUTS -->
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
					:class="`toggleable ${output.active ? '' : 'in'}active-bg`"
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

		<!-- COMPONENTS -->
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

		<!-- RIGHT SIDE INPUTS -->
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
				:class="`button-add ${inputs.length > 5 ? 'disabled' : ''}`"
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

		<!-- COMPONENT PICKER -->
		<g>
			<rect x="64" y="0" width="952" height="50" fill="#282828" />
			<g
				class="component-picker"
				v-for="(component, index) in availableComponents"
				:key="component.name"
			>
				<rect
					class="component-picker-button"
					fill="#444"
					:x="72 + availableComponents.slice(0, index).reduce((count, x) => count + x.width + 8, 0)"
					y="8"
					height="34"
					:width="component.width"
					@mousedown.left="createAndMove($event, component)"
					@mousedown.right="verifyDeleteComponent(component)"
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
				<foreignObject
					class="truth-table"
					:x="72 + availableComponents.slice(0, index).reduce((count, x) => count + x.width + 8, 0)"
					y="58"
					width="1"
					height="1"
				>
					<truth-table :component="component" />
				</foreignObject>
			</g>
			<foreignObject
				:x="72 + availableComponents.reduce((count, x) => count + x.width + 8, 0)"
				y="6"
				width="1"
				height="1"
				v-if="isCompleteComponent"
			>
				<div xmlns="http://www.w3.org/1999/xhtml">
					<input
						class="input"
						placeholder="Component name"
						maxlength="12"
						@keyup.enter="saveComponent($event.target.value)"
					/>
				</div>
			</foreignObject>
		</g>

		<!-- CONFIRM DELETE BUTTON -->
		<foreignObject x="0" y="0" width="1080" height="720" v-if="componentToBeDeleted">
			<modal
				confirmMessage="Delete"
				@accept="deleteComponent(componentToBeDeleted)"
				@close="componentToBeDeleted = null"
			>
				Are you sure you want to permanently delete the
				<u
					><strong>{{ componentToBeDeleted.name }}</strong></u
				>
				component?
			</modal>
		</foreignObject>
	</svg>
</template>

<script lang="ts">
import { ref, defineComponent, computed } from "vue"
import * as uuid from "uuid"
import {
	IPoint,
	IPin,
	Component,
	IConnection,
	computeTurnedOnPins,
	AND,
	INV,
	OR,
	NAND,
	evaluate,
	isSamePin,
	isSameComponent,
} from "../services/computer"
import { createDragFunction } from "../services/drag"
import { colors, createRandomColor } from "../services/colors"
import TruthTable from "./TruthTable.vue"
import Modal from "./Modal.vue"
import { computeTruthTable, isSameTruthTable, truthTables } from "../services/truthTable"

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
	components: {
		TruthTable,
		Modal,
	},
	setup() {
		const inputCount = ref(1)

		const outputs = ref<IOutput[]>([{ key: uuid.v4(), state: true }])

		const drawingLine = ref<{
			pin: IPin | null
			end: IPoint | null
		}>({
			pin: null,
			end: null,
		})

		const componentToBeDeleted = ref<Component | null>(null)

		const availableComponents = ref([
			new Component("INV", INV, colors[0]).disableDelete(),
			new Component("AND", AND, colors[1]).disableDelete(),
			new Component("OR", OR, colors[2]),
			new Component("NAND", NAND, colors[3]),
		])

		const components = ref<Component[]>([new Component("INV", INV, colors[0], 500, 300)])

		const connections = ref<IConnection[]>([])

		function verifyDeleteComponent(component: Component) {
			if (component.canBeDeleted) {
				componentToBeDeleted.value = component
			}
		}

		function deleteComponent(component: Component) {
			componentToBeDeleted.value = null
			if (component.canBeDeleted) {
				availableComponents.value = availableComponents.value.filter(
					(c) => !isSameComponent(c, component),
				)
			}
		}

		function addOutput(): void {
			outputs.value = [...outputs.value, { key: uuid.v4(), state: false }]
		}

		function addInput(): void {
			if (inputCount.value < 6) {
				inputCount.value++
			}
		}

		function removeInput(pin: IPin): void {
			clearPinConnections(pin)

			if (inputCount.value > 1) {
				for (const connection of connections.value) {
					if (connection.to.type === "global-input" && connection.to.index > pin.index) {
						connection.to.index--
					}
				}

				inputCount.value--
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
				if (isSamePin(from, pin) || isSamePin(to, pin)) {
					return i
				}
			})

			connections.value = connections.value.filter((_, i) => !pinConnections.includes(i))
		}

		const draw = createDragFunction<IPin>({
			onStart(pin) {
				drawingLine.value.pin = pin
			},
			onUpdate(point) {
				drawingLine.value.end = point
			},
			onStop() {
				drawingLine.value = { pin: null, end: null }
			},
		})

		const move = createDragFunction<Component>({
			withPointerOffset: true,
			onStart(component) {
				components.value = [
					...components.value.filter((c) => !isSameComponent(c, component)),
					component,
				]
			},
			onUpdate({ x, y }, component) {
				component.x = Math.min(Math.max(64, x), 1080 - component.width - 64)
				component.y = Math.min(Math.max(50, y), 720 - component.height)
			},
		})

		function createAndMove(event: MouseEvent | TouchEvent, componentRef: Component): void {
			const root =
				event.currentTarget instanceof Element ? event.currentTarget.closest("svg") : null
			if (!root) {
				return
			}

			const newComponent = new Component(
				componentRef.name,
				componentRef.operator,
				componentRef.color,
				64 + 32,
				50 + 32,
			)

			components.value = [...components.value, newComponent]
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
					endDraw({ type, index: inputCount.value - 1 })
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
					.filter(({ to }) => "content" in to && isSameComponent(to.content, component.content))
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
					.filter(
						({ from }) => "content" in from && isSameComponent(from.content, component.content),
					)
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

			if (
				"content" in fromPin &&
				"content" in toPin &&
				isSameComponent(fromPin.content, toPin.content)
			) {
				return
			}

			if (fromPin.type.endsWith("input")) {
				;[fromPin, toPin] = [toPin, fromPin]
			}

			const sameConnectionIndex = connections.value.findIndex(
				({ from, to }) => isSamePin(from, fromPin as IPin) && isSamePin(to, toPin),
			)
			if (sameConnectionIndex > -1) {
				connections.value = connections.value.filter((_, i) => i !== sameConnectionIndex)
			} else {
				const existingInputPinIndex = connections.value.findIndex(({ to }) => isSamePin(to, toPin))
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
						y: 360 + (pin.index - inputCount.value / 2 + 0.5) * 80,
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
			}
		}

		function removeComponent(component: Component): void {
			connections.value = connections.value.filter(
				({ from, to }) =>
					(!("content" in from) || !isSameComponent(from.content, component)) &&
					(!("content" in to) || !isSameComponent(to.content, component)),
			)
			components.value = components.value.filter((c) => !isSameComponent(c, component))
		}

		function saveComponent(name: string) {
			name = name.trim().toUpperCase()
			if (!name) {
				return
			}

			const availableColors = colors.filter(
				(color) => !availableComponents.value.some((component) => component.color === color),
			)
			const color =
				availableColors.length > 0
					? availableColors[Math.floor(Math.random() * availableColors.length)]
					: createRandomColor()

			const newComponent = new Component(
				name,
				{
					connections: [...connections.value],
					inputs: outputs.value.length,
					outputs: inputCount.value,
				},
				color,
			)

			availableComponents.value = [...availableComponents.value, newComponent]

			clear()

			setTimeout(() => {
				const truthTable = computeTruthTable(newComponent)

				let message = ""

				if (
					(newComponent.name === "XOR" || newComponent.name === "X-OR") &&
					!isSameTruthTable(truthTables.XOR, truthTable)
				) {
					message = `You can name this mess an ${newComponent.name}, but that won't make it behave like an ${newComponent.name}`
				} else if (
					(newComponent.name === "XNOR" || newComponent.name === "X-NOR") &&
					!isSameTruthTable(truthTables.XNOR, truthTable)
				) {
					message = `You can name this mess an ${newComponent.name}, but that won't make it behave like an ${newComponent.name}`
				} else if (newComponent.name === "NOR" && !isSameTruthTable(truthTables.NOR, truthTable)) {
					message = `You can name this mess an ${newComponent.name}, but that won't make it behave like an ${newComponent.name}`
				} else if (isSameTruthTable(truthTables.NOTHING, truthTable)) {
					message = "That doesn't seem to useful of a component now, does it?"
				} else if (isSameTruthTable(truthTables.INV, truthTable)) {
					message = "I'm pretty sure you already got a similar component to this, friend"
				} else if (isSameTruthTable(truthTables.AND, truthTable)) {
					message = "Another AND gate, daring today are we"
				}

				if (message) {
					window.dispatchEvent(new CustomEvent("logik-hint", { detail: message }))
				}
			}, 0)
		}

		function clear() {
			components.value = []
			connections.value = []
			inputCount.value = 1
			outputs.value = [{ state: true, key: uuid.v4() }]
		}

		const status = computed(() => {
			const turnedOnPins = computeTurnedOnPins(
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
			Array(inputCount.value)
				.fill(undefined)
				.map((_, index) => {
					const pin: IPin = { type: "global-input", index }
					const connection = connections.value.find(({ to }) => isSamePin(to, pin))

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
					({ to }) => "content" in to && isSameComponent(to.content, pin.content as Component),
				)
				if (parameterConnections.length === pin.content.operatorInputs) {
					const params = parameterConnections
						.sort((a, b) => a.to.index - b.to.index)
						.map(({ from }) => status.value.turnedOnPins.has(from))

					return evaluate(pin.content.operator, params)[pin.index - pin.content.operatorInputs]
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
			const pinLocation = getPinLocation({ index: inputCount.value, type: "global-input" })

			return {
				x: pinLocation.x + 48,
				y: pinLocation.y - 6,
			}
		})

		const isCompleteComponent = computed(() => {
			const hasInput = connections.value.some(({ to }) => to.type === "global-input")
			const hasOutput = connections.value.some(({ from }) => from.type === "global-output")

			return hasInput && hasOutput
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
			calculatePath,
			addOutput,
			addInput,
			clearPinConnections,
			draw,
			endDraw,
			endDrawOnComponent,
			endDrawOnNewPin,
			move,
			createAndMove,
			isCompleteComponent,
			saveComponent,
			verifyDeleteComponent,
			deleteComponent,
			componentToBeDeleted,
		}
	},
})
</script>

<style lang="scss" scoped>
$bg: #212121;
$pin: #444;
$off: #888;
$on: #e03b3b;
$font: "Prompt", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

text {
	font-family: $font;
	fill: white;
	font-weight: 500;
	letter-spacing: 0.3px;
	padding-top: 2px;
	text-transform: uppercase;
	pointer-events: none;
	user-select: none;
}

foreignObject {
	overflow: visible;
}

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
}

.component-picker-button {
	fill: $pin;
	cursor: pointer;

	&:hover {
		fill: lighten($pin, 10%);
	}
}

.component-picker {
	.truth-table {
		pointer-events: none;
		transition: opacity 0.1s;
		transition-delay: 0;
		opacity: 0;
	}

	&:hover {
		.truth-table {
			transition: opacity 0.1s;
			transition-delay: 750ms;
			opacity: 1;
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

.truth-table-wrapper {
	position: absolute;
	top: 5rem;
	left: 5rem;
}

.input {
	outline: none;
	border: 0;
	background: #212121;
	box-sizing: border-box;
	text-transform: uppercase;
	margin-top: 2px;
	width: 250px;
	height: 34px;
	font-size: 16px;
	padding: 5px 15px 3px;
	color: #fff;
	font-family: $font;

	&:focus {
		background: #444;
	}

	&:disabled {
		visibility: hidden;
	}
}
</style>
