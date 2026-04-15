import { Image, type ImageProps, type PolymorphicComponentProps } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc.ts"

export function Avatar({
	userId,
	...props
}: PolymorphicComponentProps<"img", ImageProps> & { userId: string }) {
	const avatar = useQuery(trpc.user.getAvatarUrl.queryOptions({ userId }))
	return <Image {...props} bdrs="100%" src={avatar.data} />
}
