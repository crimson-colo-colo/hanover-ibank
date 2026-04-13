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

const fileTypeIcons: Record<
	FileType,
	(props: IconProps & React.SVGProps<SVGSVGElement>) => React.ReactNode
> = {
	[FileType.WordDocument]: (props) => <IconFileTypeDocx className="stroke-blue-600" {...props} />,
	[FileType.Powerpoint]: (props) => <IconFileTypePpt className="stroke-orange-600" {...props} />,
	[FileType.Excel]: (props) => <IconFileTypeXls className="stroke-emerald-600" {...props} />,
	[FileType.Pdf]: (props) => <IconFileTypePdf className="stroke-red-600" {...props} />,
	[FileType.Audio]: (props) => <IconFileMusic className="stroke-emerald-600" {...props} />,
	[FileType.Video]: (props) => <IconMovie className="stroke-red-600" {...props} />,
	[FileType.Image]: (props) => <IconPhoto className="stroke-sky-600" {...props} />,
	[FileType.Link]: (props) => <IconLink className="stroke-gray-600" {...props} />,
	[FileType.Plaintext]: (props) => <IconFileText className="stroke-gray-600" {...props} />,
	[FileType.Unknown]: (props) => <IconFile className="stroke-gray-600" {...props} />,
}

export function FileTypeIcon({
	fileType,
	...props
}: { fileType: FileType } & IconProps & React.SVGProps<SVGSVGElement>) {
	const IconComponent = fileTypeIcons[fileType] || fileTypeIcons[FileType.Unknown]
	return <IconComponent {...props} />
}
