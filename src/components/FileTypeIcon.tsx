import { FileType } from "@shared/filetype.ts"
import {
	IconFile,
	IconFileMusic,
	IconFileText,
	IconFileTypeDocx,
	IconFileTypePdf,
	IconFileTypePpt,
	IconFileTypeXls,
	IconLink,
	IconMovie,
	IconPhoto,
	type IconProps,
} from "@tabler/icons-react"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

const fileTypeIcons: Record<
	FileType,
	(props: IconProps & React.SVGProps<SVGSVGElement>) => React.ReactNode
> = {
	[FileType.WordDocument]: (props) => (
		<IconFileTypeDocx
			{...props}
			className={clsx(props.className, "stroke-blue-600 dark:stroke-blue-400")}
		/>
	),
	[FileType.Powerpoint]: (props) => (
		<IconFileTypePpt
			{...props}
			className={clsx(props.className, "stroke-orange-600 dark:stroke-orange-400")}
		/>
	),
	[FileType.Excel]: (props) => (
		<IconFileTypeXls
			{...props}
			className={clsx(props.className, "stroke-emerald-600 dark:stroke-emerald-400")}
		/>
	),
	[FileType.Pdf]: (props) => (
		<IconFileTypePdf
			{...props}
			className={twMerge("stroke-red-600 dark:stroke-red-400", props.className)}
		/>
	),
	[FileType.Audio]: (props) => (
		<IconFileMusic
			{...props}
			className={twMerge("stroke-emerald-600 dark:stroke-emerald-400", props.className)}
		/>
	),
	[FileType.Video]: (props) => (
		<IconMovie
			{...props}
			className={twMerge("stroke-red-600 dark:stroke-red-400", props.className)}
		/>
	),
	[FileType.Image]: (props) => (
		<IconPhoto
			{...props}
			className={twMerge("stroke-sky-600 dark:stroke-sky-400", props.className)}
		/>
	),
	[FileType.Link]: (props) => (
		<IconLink
			{...props}
			className={twMerge("stroke-gray-600 dark:stroke-gray-400", props.className)}
		/>
	),
	[FileType.Plaintext]: (props) => (
		<IconFileText
			{...props}
			className={twMerge("stroke-pear-700 dark:stroke-pear-400", props.className)}
		/>
	),
	[FileType.Unknown]: (props) => (
		<IconFile
			{...props}
			className={twMerge("stroke-gray-700 dark:stroke-gray-400", props.className)}
		/>
	),
}

export function FileTypeIcon({
	fileType,
	...props
}: { fileType: FileType } & IconProps & React.SVGProps<SVGSVGElement>) {
	const IconComponent = fileTypeIcons[fileType] || fileTypeIcons[FileType.Unknown]
	return <IconComponent {...props} />
}
