import { Image, type ImageProps, type PolymorphicComponentProps } from "@mantine/core"

export function Avatar({
	userId,
	...props
}: PolymorphicComponentProps<"img", ImageProps> & { userId: string }) {
	return <Image {...props} bdrs="100%" src={`/avatar/${userId}`} />
}
