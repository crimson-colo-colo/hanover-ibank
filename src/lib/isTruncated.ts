export function isTruncated(e: HTMLElement) {
	const temp = e.cloneNode(true) as HTMLElement

	temp.style.position = "fixed"
	temp.style.overflow = "visible"
	temp.style.whiteSpace = "nowrap"
	temp.style.visibility = "hidden"

	e.parentElement!.appendChild(temp)

	try {
		const fullWidth = temp.getBoundingClientRect().width
		const displayWidth = e.getBoundingClientRect().width

		return fullWidth > displayWidth
	} finally {
		temp.remove()
	}
}
