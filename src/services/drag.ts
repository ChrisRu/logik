import { IPoint } from "./computer"

export function getTouchPos(event: MouseEvent | TouchEvent, point: DOMPoint) {
	if ("touches" in event) {
		point.x = event.touches[0].clientX
		point.y = event.touches[0].clientY
	} else {
		point.x = event.clientX
		point.y = event.clientY
	}
}

export function createDragFunction<T>({
	ignoreWhen,
	onUpdate,
	onStop,
	onStart,
	withPointerOffset = false,
	padding = 0,
}: {
	ignoreWhen?: (event: MouseEvent | TouchEvent) => boolean
	withPointerOffset?: boolean
	padding?: number
	onUpdate: (point: IPoint, param: T) => void
	onStart?: (param: T) => void
	onStop?: (param: T) => void
}) {
	return function (mouseDownEvent: MouseEvent | TouchEvent, param: T): void {
		const isTouchEvent = mouseDownEvent.type === "touchstart"
		if (ignoreWhen?.(mouseDownEvent)) {
			return
		}

		const root =
			mouseDownEvent.currentTarget instanceof Element
				? mouseDownEvent.currentTarget.closest("svg")
				: null
		if (!root) {
			return
		}

		const moveEventName = isTouchEvent ? "touchmove" : "mousemove"
		const stopEventName = isTouchEvent ? "touchend" : "mouseup"

		const point = root.createSVGPoint()
		const rootTransformMatrix = root.getScreenCTM()?.inverse()

		const mouseOffsetPoint = root.createSVGPoint()
		if (withPointerOffset && mouseDownEvent.currentTarget instanceof Element) {
			const mouseOffset = root.createSVGPoint()
			const boundingBox = mouseDownEvent.currentTarget.getBoundingClientRect()

			getTouchPos(mouseDownEvent, mouseOffset)

			mouseOffsetPoint.x = mouseOffset.x - boundingBox.x
			mouseOffsetPoint.y = mouseOffset.y - boundingBox.y
		}

		const mouseDownPoint = root.createSVGPoint()
		getTouchPos(mouseDownEvent, mouseDownPoint)

		let inPadding = !!padding
		let isMoving = true
		const update = (): void => {
			if (isMoving) {
				requestAnimationFrame(update)
			}

			if (inPadding && padding) {
				if (
					Math.abs(point.x - mouseDownPoint.x) > padding ||
					Math.abs(point.y - mouseDownPoint.y) > padding
				) {
					inPadding = false
				} else {
					return
				}
			}

			let transformedPoint = root.createSVGPoint()
			transformedPoint.x = point.x - mouseOffsetPoint.x
			transformedPoint.y = point.y - mouseOffsetPoint.y
			transformedPoint = transformedPoint.matrixTransform(rootTransformMatrix)

			onUpdate(transformedPoint, param)
		}

		const move = (moveEvent: MouseEvent | TouchEvent): void => getTouchPos(moveEvent, point)

		const stop = (): void => {
			isMoving = false

			onStop?.(param)

			root.removeEventListener(moveEventName, move)
			root.removeEventListener(stopEventName, stop)
		}

		onStart?.(param)

		requestAnimationFrame(update)
		move(mouseDownEvent)

		root.addEventListener(moveEventName, move)
		root.addEventListener(stopEventName, stop)
	}
}
