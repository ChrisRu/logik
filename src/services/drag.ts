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
	withPointerOffset,
}: {
	ignoreWhen?: (event: MouseEvent | TouchEvent) => boolean
	withPointerOffset?: boolean
	onUpdate: (point: IPoint, param: T) => void
	onStart?: (param: T) => void
	onStop?: (param: T) => void
}) {
	return function (event: MouseEvent | TouchEvent, param: T): void {
		const isTouchEvent = event.type === "touchstart"
		if (ignoreWhen?.(event)) {
			return
		}

		const root = event.currentTarget instanceof Element ? event.currentTarget.closest("svg") : null
		if (!root) {
			return
		}

		const moveEvent = isTouchEvent ? "touchmove" : "mousemove"
		const stopEvent = isTouchEvent ? "touchend" : "mouseup"

		const point = root.createSVGPoint()
		const rootTransformMatrix = root.getScreenCTM()?.inverse()

		const mouseOffsetPoint = root.createSVGPoint()
		if (withPointerOffset && event.currentTarget instanceof Element) {
			const mouseOffset = root.createSVGPoint()
			const boundingBox = event.currentTarget.getBoundingClientRect()

			getTouchPos(event, mouseOffset)

			mouseOffsetPoint.x = mouseOffset.x - boundingBox.x
			mouseOffsetPoint.y = mouseOffset.y - boundingBox.y
		}

		let isMoving = true
		const update = (): void => {
			if (isMoving) {
				requestAnimationFrame(update)
			}

			let transformedPoint = root.createSVGPoint()
			transformedPoint.x = point.x - mouseOffsetPoint.x
			transformedPoint.y = point.y - mouseOffsetPoint.y
			transformedPoint = transformedPoint.matrixTransform(rootTransformMatrix)

			onUpdate(transformedPoint, param)
		}

		const move = (event: MouseEvent | TouchEvent): void => getTouchPos(event, point)
		const stop = (): void => {
			isMoving = false

			onStop?.(param)

			root.removeEventListener(moveEvent, move)
			root.removeEventListener(stopEvent, stop)
		}

		onStart?.(param)

		requestAnimationFrame(update)
		move(event)

		root.addEventListener(moveEvent, move)
		root.addEventListener(stopEvent, stop)
	}
}
