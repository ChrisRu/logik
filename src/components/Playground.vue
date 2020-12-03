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
			v-if="drawingLinePath"
			:d="drawingLinePath"
			:class="drawingLineStatus ? 'active-stroke' : 'inactive-stroke'"
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
			:d="connection.path"
			:class="connection.active ? 'active-stroke' : 'inactive-stroke'"
			@mouseup.right="connection.clearPinConnections()"
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
					:cy="output.y"
					:cx="output.x"
					@mousedown.left="draw($event, output.pin)"
					@mouseup.right="clearPinConnections(output.pin)"
					class="draggable global-output pin"
					r="8"
				/>
				<rect :x="output.x - 32" :y="output.y - 2" width="32" height="4" class="pin-arrow" />
				<circle
					:class="`toggleable ${output.active ? '' : 'in'}active-bg`"
					:cx="output.x - 48"
					:cy="output.y"
					@click="output.toggle()"
					@mouseup.right="output.remove()"
					r="16"
				/>
			</g>

			<g
				:class="`button-add ${outputs.length > 8 ? 'disabled' : ''}`"
				@mouseup.left="endDrawOnNewPin('global-output')"
				@mousedown.left="draw($event, addOutput())"
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
		<g v-for="chip in chips" :key="chip.key" class="component">
			<rect
				:x="chip.x"
				:y="chip.y"
				:width="chip.width"
				:height="chip.height"
				:fill="chip.color"
				@touchstart="chip.move($event)"
				@mousedown.left="chip.move($event)"
				@mouseup.left="endDrawOnChip(chip)"
				@mouseup.right="chip.remove()"
				class="draggable"
				rx="3"
				ry="3"
			/>
			<circle
				v-for="inputPin in chip.inputPins"
				:key="inputPin.index"
				:cx="inputPin.x"
				:cy="inputPin.y"
				@mousedown.left="draw($event, inputPin.pin)"
				@mouseup.left="endDraw(inputPin.pin)"
				@mouseup.right="clearPinConnections(inputPin.pin)"
				class="draggable pin"
				r="8"
			/>
			<circle
				v-for="outputPin in chip.outputPins"
				:key="outputPin.index"
				:cx="outputPin.x"
				:cy="outputPin.y"
				@mousedown.left="draw($event, outputPin.pin)"
				@mouseup.left="endDraw(outputPin.pin)"
				@mouseup.right="clearPinConnections(outputPin.pin)"
				class="draggable pin"
				r="8"
			/>
			<text
				:x="chip.x + chip.width / 2"
				:y="chip.y + chip.height / 2 + 1"
				dominant-baseline="middle"
				text-anchor="middle"
			>
				{{ chip.name }}
			</text>
		</g>

		<!-- RIGHT SIDE INPUTS -->
		<g class="sidebar sidebar-right">
			<rect x="1016" y="0" width="64" height="720" fill="rgba(255, 255, 255, 0.03)" />
			<g v-for="input in inputs" :key="input.index" @mouseup.left="endDraw(input.pin)">
				<circle
					:class="input.active ? 'active-bg' : 'inactive-bg'"
					:cx="input.x + 48"
					:cy="input.y"
					@mouseup.right="input.remove()"
					r="16"
				/>
				<circle
					:cx="input.x"
					:cy="input.y"
					@mouseup.right="clearPinConnections(input.pin)"
					@mousedown.left="draw($event, input.pin)"
					class="draggable global-input pin"
					r="8"
				/>
				<rect :x="input.x" :y="input.y - 2" class="pin-arrow" width="32" height="4" />
			</g>
			<g
				:class="`button-add ${inputs.length > 7 ? 'disabled' : ''}`"
				@mouseup.left="endDrawOnNewPin('global-input')"
				@mousedown.left="draw($event, addInput())"
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
					@click.right="verifyDeleteComponent(component)"
					@mousedown.left="createAndMove($event, component)"
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
import { ref, defineComponent, computed, shallowRef, markRaw } from "vue"
import * as uuid from "uuid"
import {
	Point,
	Pin,
	Component,
	Connection,
	computePinState,
	evaluate,
	isSamePin,
	isSameChip,
	isSameComponent,
	Chip,
} from "../services/computer"
import { createDragFunction } from "../services/drag"
import { colors, createRandomColor } from "../services/colors"
import { loadComponents, storeComponents } from "../services/storage"
import TruthTable from "./TruthTable.vue"
import Modal from "./Modal.vue"
import { isSameLookupTruthTable, truthTables } from "../services/truthTable"

function calculatePath(from: Point, to: Point) {
	return `M ${from.x},${from.y}
	        L ${to.x},${to.y}`
}

interface Output {
	key: string
	state: boolean
}

interface DrawingLine {
	pin: Pin | null
	end: Point | null
}

export default defineComponent({
	name: "Playground",
	components: {
		TruthTable,
		Modal,
	},
	setup() {
		const inputCount = ref<number>(1)
		const outputs = ref<Output[]>([{ key: uuid.v4(), state: true }])
		const availableComponents = shallowRef<Component[]>(loadComponents())
		const chips = ref<Chip[]>([])
		const connections = shallowRef<Connection[]>([])
		const drawingLine = ref<DrawingLine>({ pin: null, end: null })
		const componentToBeDeleted = shallowRef<Component | null>(null)

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

			storeComponents(availableComponents.value)
		}

		function addOutput(): Pin {
			outputs.value = [...outputs.value, { key: uuid.v4(), state: false }]

			return {
				type: "global-output",
				index: outputs.value.length - 1,
			}
		}

		function addInput(): Pin {
			inputCount.value++

			return {
				type: "global-input",
				index: inputCount.value - 1,
			}
		}

		function removeInput(pin: Pin): void {
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

		function removeOutput(pin: Pin): void {
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

		function clearPinConnections(pin: Pin): void {
			const pinConnections = connections.value.map(({ from, to }, i) => {
				if (isSamePin(from, pin) || isSamePin(to, pin)) {
					return i
				}
			})

			connections.value = connections.value.filter((_, i) => !pinConnections.includes(i))
		}

		const draw = createDragFunction<Pin>({
			onStart(pin) {
				drawingLine.value.pin = pin
				drawingLine.value.end = null
			},
			onUpdate(point) {
				drawingLine.value.end = point
			},
			onStop() {
				drawingLine.value = { pin: null, end: null }
			},
			padding: 8,
		})

		const move = createDragFunction<Chip>({
			withPointerOffset: true,
			onStart(component) {
				chips.value = [...chips.value.filter((c) => !isSameChip(c, component)), component]
			},
			onUpdate({ x, y }, chip) {
				const maxLeft = 64
				const maxTop = 50
				const maxRight = 1080 - chip.component.width - 64
				const maxBottom = 720 - chip.component.height

				chip.x = Math.min(Math.max(maxLeft, x), maxRight)
				chip.y = Math.min(Math.max(maxTop, y), maxBottom)
			},
		})

		function createAndMove(event: MouseEvent | TouchEvent, component: Component): void {
			const root =
				event.currentTarget instanceof Element ? event.currentTarget.closest("svg") : null
			if (!root) {
				return
			}

			const newChip: Chip = {
				key: uuid.v4(),
				x: 64 + 32,
				y: 50 + 32,
				component,
			}

			chips.value = [...chips.value, newChip]
		}

		function endDrawOnNewPin(type: "global-input" | "global-output"): void {
			if (!drawingLine.value.pin) {
				return
			}

			if (type === "global-output") {
				if (drawingLine.value.pin.type.endsWith("input")) {
					endDraw(addOutput())
				}
			} else if (type === "global-input") {
				if (drawingLine.value.pin.type.endsWith("output")) {
					endDraw(addInput())
				}
			}
		}

		function endDrawOnChip(chip: typeof calculatedChips.value[0]): void {
			if (!drawingLine.value.pin) {
				return
			}

			if (drawingLine.value.pin.type.endsWith("output")) {
				const activePinIndexes = new Set<number>()
				for (const { to } of connections.value) {
					if ("chip" in to && isSameChip(to.chip, chip)) {
						activePinIndexes.add(to.index)
					}
				}

				if (activePinIndexes.size === chip.inputPins.length) {
					if (activePinIndexes.size === 1) {
						endDraw(chip.inputPins[0].pin)
					}

					return
				}

				for (const inputPin of chip.inputPins) {
					if (!activePinIndexes.has(inputPin.pin.index)) {
						endDraw(inputPin.pin)
						return
					}
				}
			} else {
				const activePinIndexes = new Set<number>()
				for (const { from } of connections.value) {
					if ("chip" in from && isSameChip(from.chip, chip)) {
						activePinIndexes.add(from.index)
					}
				}

				if (activePinIndexes.size === chip.outputPins.length) {
					if (activePinIndexes.size === 1) {
						endDraw(chip.outputPins[0].pin)
					}

					return
				}

				for (const outputPin of chip.outputPins) {
					if (!activePinIndexes.has(outputPin.pin.index)) {
						endDraw(outputPin.pin)
						return
					}
				}
			}
		}

		function endDraw(toPin: Pin): void {
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

			if ("chip" in fromPin && "chip" in toPin && isSameChip(fromPin.chip, toPin.chip)) {
				return
			}

			if (fromPin.type.endsWith("input")) {
				;[fromPin, toPin] = [toPin, fromPin]
			}

			const sameConnectionIndex = connections.value.findIndex(
				({ from, to }) => isSamePin(from, fromPin as Pin) && isSamePin(to, toPin),
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

		function getPinLocation(pin: Pin): Point {
			switch (pin.type) {
				case "output":
					return {
						x: pin.chip.x + pin.chip.component.width,
						y:
							pin.chip.y +
							pin.chip.component.height / 2 +
							(pin.index -
								pin.chip.component.operatorInputs -
								pin.chip.component.operatorOutputs / 2) *
								18.4 +
							10,
					}
				case "input":
					return {
						x: pin.chip.x,
						y:
							pin.chip.y +
							pin.chip.component.height / 2 +
							(pin.index - pin.chip.component.operatorInputs / 2) * 18.4 +
							10,
					}
				case "global-output":
					return {
						x: 80,
						y: 360 + (pin.index - outputs.value.length / 2 + 0.5) * (80 - outputs.value.length * 2),
					}
				case "global-input":
					return {
						x: 1000,
						y: 360 + (pin.index - inputCount.value / 2 + 0.5) * (80 - inputCount.value * 2),
					}
			}
		}

		function removeChip(chip: Chip): void {
			connections.value = connections.value.filter(
				({ from, to }) =>
					(!("chip" in from) || !isSameChip(from.chip, chip)) &&
					(!("chip" in to) || !isSameChip(to.chip, chip)),
			)
			chips.value = chips.value.filter((c) => !isSameChip(c, chip))
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

			const newComponent = markRaw(
				new Component(
					name,
					{
						connections: [...connections.value],
						inputs: outputs.value.length,
						outputs: inputCount.value,
					},
					color,
				),
			)

			availableComponents.value = [...availableComponents.value, newComponent]

			clear()

			setTimeout(() => {
				storeComponents(availableComponents.value)

				let message = ""

				if (
					(newComponent.name === "XOR" || newComponent.name === "X-OR") &&
					!isSameLookupTruthTable(truthTables.XOR, newComponent.truthTable)
				) {
					message = `You can name this mess an ${newComponent.name}, but that won't make it behave like an ${newComponent.name}`
				} else if (
					(newComponent.name === "XNOR" || newComponent.name === "X-NOR") &&
					!isSameLookupTruthTable(truthTables.XNOR, newComponent.truthTable)
				) {
					message = `You can name this mess an ${newComponent.name}, but that won't make it behave like an ${newComponent.name}`
				} else if (
					newComponent.name === "NOR" &&
					!isSameLookupTruthTable(truthTables.NOR, newComponent.truthTable)
				) {
					message = `You can name this mess an ${newComponent.name}, but that won't make it behave like an ${newComponent.name}`
				} else if (isSameLookupTruthTable(truthTables.NOTHING, newComponent.truthTable)) {
					message = "That doesn't seem to useful of a component now, does it?"
				} else if (isSameLookupTruthTable(truthTables.NOT, newComponent.truthTable)) {
					message = "I'm pretty sure you already got a similar component to this, friend"
				} else if (isSameLookupTruthTable(truthTables.AND, newComponent.truthTable)) {
					message = "Another AND gate, daring today are we"
				}

				if (message) {
					window.dispatchEvent(new CustomEvent("logik-hint", { detail: message }))
				}
			}, 0)
		}

		function clear() {
			chips.value = []
			connections.value = []
			inputCount.value = 1
			outputs.value = [{ state: true, key: uuid.v4() }]
		}

		const pinState = computed(() => {
			return computePinState(
				connections.value,
				outputs.value.map(({ state }) => state),
			)
		})

		const calculatedConnections = computed(() =>
			connections.value.map((connection) => ({
				key: connection.key,
				active: pinState.value.turnedOnPins.has(connection.from),
				from: connection.from,
				to: connection.to,
				path: calculatePath(getPinLocation(connection.from), getPinLocation(connection.to)),
				clearPinConnections: () => clearPinConnections(connection.to),
			})),
		)

		const calculatedOutputs = computed(() =>
			outputs.value.map(({ key, state }, index) => {
				const pin: Pin = { type: "global-output", index }

				return {
					key,
					pin,
					active: state,
					...getPinLocation(pin),
					toggle: () => (outputs.value[index].state = !state),
					remove: () => removeOutput(pin),
				}
			}),
		)

		const calculatedInputs = computed(() =>
			Array(inputCount.value)
				.fill(undefined)
				.map((_, index) => {
					const pin: Pin = { type: "global-input", index }
					const connection = connections.value.find(({ to }) => isSamePin(to, pin))

					return {
						index,
						pin,
						active: connection && pinState.value.turnedOnPins.has(connection.from),
						...getPinLocation(pin),
						remove: () => removeInput(pin),
					}
				}),
		)

		const calculatedChips = computed(() =>
			chips.value.map((chip) => ({
				key: chip.key,
				x: chip.x,
				y: chip.y,
				name: chip.component.name,
				width: chip.component.width,
				height: chip.component.height,
				color: chip.component.color,
				component: chip.component,
				inputPins: Array(chip.component.operatorInputs)
					.fill(undefined)
					.map((_, index) => {
						const pin: Pin = {
							type: "input",
							index,
							chip,
						}

						return {
							index,
							pin,
							...getPinLocation(pin),
						}
					}),
				outputPins: Array(chip.component.operatorOutputs)
					.fill(undefined)
					.map((_, pinIndex) => {
						const index = pinIndex + chip.component.operatorInputs
						const pin: Pin = {
							type: "output",
							index,
							chip,
						}

						return {
							index,
							pin,
							...getPinLocation(pin),
						}
					}),
				remove: () => removeChip(chip),
				move: (event: MouseEvent | TouchEvent) => move(event, chip),
			})),
		)

		const drawingLinePath = computed(() => {
			if (!drawingLine.value.end || !drawingLine.value.pin) {
				return null
			}

			return calculatePath(getPinLocation(drawingLine.value.pin), drawingLine.value.end)
		})

		const drawingLineStatus = computed(() => {
			const { pin } = drawingLine.value
			if (!pin) {
				return false
			}

			if (pin.type === "global-output") {
				return outputs.value[pin.index].state
			} else if (pin.type === "output") {
				const params = Array(pin.chip.component.operatorInputs).fill(undefined)

				for (const { from, to } of connections.value) {
					if ("chip" in to && isSameChip(to.chip, pin.chip)) {
						if (pinState.value.turnedOnPins.has(from)) {
							params[to.index] = true
						} else if (pinState.value.turnedOffPins.has(from)) {
							params[to.index] = false
						} else {
							return false
						}
					}
				}

				if (params.includes(undefined)) {
					return false
				}

				return evaluate(pin.chip.component, params)[pin.index - pin.chip.component.operatorInputs]
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
			chips: calculatedChips,
			connections: calculatedConnections,
			addOutputLocation,
			addInputLocation,
			availableComponents,
			drawingLineStatus,
			drawingLinePath,
			addOutput,
			addInput,
			clearPinConnections,
			draw,
			endDraw,
			endDrawOnChip,
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
