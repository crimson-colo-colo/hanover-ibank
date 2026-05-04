import Stream from "node:stream"
import type { ReadableStream } from "node:stream/web"
import { Upload } from "@aws-sdk/lib-storage"
import type { NextFunction, Request, Response } from "express"
import * as jose from "jose"
import { v2 as webdav } from "webdav-server"
import { db } from "../database.ts"
import { env } from "../env.ts"
import { auth0Cache } from "../lib/auth0.ts"
import { getFileExtensionForType } from "../lib/filetype.ts"
import { bucketName, s3 } from "../s3.ts"

interface WebDAVUser extends webdav.IUser {
	contentId?: string
	objectId?: string
	filename?: string
}

const OFFICE_ALLOW_HEADER = "OPTIONS, PROPFIND, PROPPATCH, LOCK, UNLOCK, GET, HEAD, PUT"
const WEBDAV_DEBUG = process.env.WEBDAV_DEBUG === "1" || process.env.WEBDAV_DEBUG === "true"

function debugLog(message: string, ...args: unknown[]) {
	if (!WEBDAV_DEBUG) {
		return
	}
	console.debug(message, ...args)
}

function parseTokenFromPathname(pathname: string) {
	const segments = pathname.split("/").filter(Boolean)
	const webdavIndex = segments.indexOf("webdav")
	const token = webdavIndex !== -1 ? segments[webdavIndex + 1] : segments[0]
	return token
}

function normalizeEtag(etag?: string) {
	if (!etag) {
		return undefined
	}

	const trimmed = etag.trim()
	if (!trimmed) {
		return undefined
	}

	return trimmed.startsWith('"') ? trimmed : `"${trimmed}"`
}

function normalizeEtagForCompare(etag: string) {
	return etag.trim().replace(/^W\//i, "")
}

function ifNoneMatchMatches(currentEtag: string, ifNoneMatchHeader: unknown) {
	if (typeof ifNoneMatchHeader !== "string") {
		return false
	}

	const candidate = normalizeEtagForCompare(currentEtag)
	const tags = ifNoneMatchHeader
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)

	if (tags.includes("*")) {
		return true
	}

	return tags.some((tag) => normalizeEtagForCompare(tag) === candidate)
}

function parseHttpDate(headerValue: unknown) {
	if (typeof headerValue !== "string") {
		return undefined
	}

	const parsed = Date.parse(headerValue)
	if (Number.isNaN(parsed)) {
		return undefined
	}

	return parsed
}

class TokenAuthentication implements webdav.HTTPAuthentication {
	async getUser(
		ctx: webdav.HTTPRequestContext,
		callback: (error: Error, user?: WebDAVUser) => void
	) {
		const url = new URL(ctx.request.url!, `http://${ctx.request.headers.host}`)
		const segments = url.pathname.split("/").filter(Boolean)

		const webdavIndex = segments.indexOf("webdav")
		const token = webdavIndex !== -1 ? segments[webdavIndex + 1] : segments[0]

		// Allow anonymous OPTIONS/PROPFIND on root/base paths for Word probing
		if (!token) {
			if (ctx.request.method === "OPTIONS" || ctx.request.method === "PROPFIND") {
				return callback(null!, {
					uid: "anonymous",
					username: "anonymous",
					isDefaultUser: true,
				})
			}
			return callback(null!)
		}

		try {
			const tok = await jose.jwtVerify(token, new TextEncoder().encode(env.APP_SECRET), {
				algorithms: ["HS256"],
				audience: "webdav",
			})

			const { sub, contentId } = tok.payload as {
				sub: string
				contentId: string
			}

			const [user, content] = await Promise.all([
				auth0Cache.getUser(sub),
				db.content.findUnique({ where: { id: contentId } }),
			])

			if (!user || !content || !content.objectId) {
				return callback(null!)
			}

			// Get FileType from S3 metadata
			let fileExtension = ".docx" // default for backward compatibility
			try {
				const metadata = await s3.headObject({
					Bucket: bucketName,
					Key: content.objectId,
				})
				const fileType = metadata.Metadata?.filetype as string | undefined
				if (fileType) {
					fileExtension = getFileExtensionForType(fileType)
				}
			} catch (_headError) {
				// If we can't get metadata, fall back to default
			}

			const filename = content.title.includes(".")
				? content.title
				: `${content.title}${fileExtension}`

			callback(null!, {
				uid: sub,
				username: user.username || "unknown",
				isAdministrator: true,
				contentId,
				objectId: content.objectId,
				filename,
			})
		} catch (_e) {
			callback(null!)
		}
	}

	askForAuthentication() {
		return {}
	}
}

class S3Serializer implements webdav.FileSystemSerializer {
	uid() {
		return "S3Serializer-1.0.0"
	}
	serialize(_fs: webdav.FileSystem, callback: webdav.ReturnCallback<unknown>) {
		callback(null!, {})
	}
	unserialize(_serializedData: unknown, callback: webdav.ReturnCallback<webdav.FileSystem>) {
		callback(null!, new S3FileSystem())
	}
}

class S3FileSystem extends webdav.FileSystem {
	private resources: Record<
		string,
		{ locks: webdav.ILockManager; props: webdav.IPropertyManager }
	> = {}

	constructor() {
		super(new S3Serializer())
	}

	private getResource(path: webdav.Path) {
		const p = path.toString()
		if (!this.resources[p]) {
			debugLog(`[webdav][S3FS] creating resource entry for ${p}`)
			this.resources[p] = {
				locks: new webdav.LocalLockManager(),
				props: new webdav.LocalPropertyManager(),
			}
		}
		return this.resources[p]
	}

	protected _lockManager(
		path: webdav.Path,
		_ctx: webdav.LockManagerInfo,
		callback: webdav.ReturnCallback<webdav.ILockManager>
	): void {
		callback(null!, this.getResource(path).locks)
	}

	protected _propertyManager(
		path: webdav.Path,
		_ctx: webdav.PropertyManagerInfo,
		callback: webdav.ReturnCallback<webdav.IPropertyManager>
	): void {
		callback(null!, this.getResource(path).props)
	}

	async _type(
		path: webdav.Path,
		ctx: webdav.TypeInfo,
		callback: webdav.ReturnCallback<webdav.ResourceType>
	) {
		if (path.isRoot()) {
			return callback(null!, webdav.ResourceType.Directory)
		}

		const user = ctx.context.user as WebDAVUser
		if (!user?.objectId) {
			return callback(webdav.Errors.ResourceNotFound)
		}

		if (path.paths.length === 1) {
			return callback(null!, webdav.ResourceType.Directory)
		}

		if (path.paths.length === 2) {
			const requestedFilename = path.paths[1]
			// Allow the main file and temp files (starting with ~$)
			if (requestedFilename === user.filename || requestedFilename.startsWith("~$")) {
				return callback(null!, webdav.ResourceType.File)
			}
		}

		callback(webdav.Errors.ResourceNotFound)
	}

	async _readDir(
		path: webdav.Path,
		ctx: webdav.ReadDirInfo,
		callback: webdav.ReturnCallback<string[]>
	) {
		if (path.isRoot()) {
			return callback(null!, [])
		}

		const user = ctx.context.user as WebDAVUser
		if (path.paths.length === 1 && user?.filename) {
			return callback(null!, [user.filename])
		}

		callback(null!, [])
	}

	async _openReadStream(
		path: webdav.Path,
		ctx: webdav.OpenReadStreamInfo,
		callback: webdav.ReturnCallback<Stream.Readable>
	) {
		const user = ctx.context.user as WebDAVUser
		if (!user?.objectId || path.paths.length !== 2) {
			return callback(webdav.Errors.ResourceNotFound)
		}

		const requestedFilename = path.paths[1]
		if (requestedFilename.startsWith("~$")) {
			// Return empty stream for temp files
			return callback(null!, Stream.Readable.from([]))
		}

		try {
			const object = await s3.getObject({
				Bucket: bucketName,
				Key: user.objectId,
			})
			debugLog(
				`[webdav][S3FS] getObject for ${user.objectId} received Body type=${typeof object.Body} ETag=${object.ETag ?? "unknown"}`
			)

			const body = object.Body
			if (!body) {
				return callback(webdav.Errors.ResourceNotFound)
			}

			callback(null!, Stream.Readable.fromWeb(body.transformToWebStream() as ReadableStream))
		} catch (e) {
			callback(e as Error)
		}
	}

	async _openWriteStream(
		path: webdav.Path,
		ctx: webdav.OpenWriteStreamInfo,
		callback: webdav.ReturnCallback<Stream.Writable>
	) {
		const user = ctx.context.user as WebDAVUser
		if (!user?.objectId || path.paths.length !== 2) {
			return callback(webdav.Errors.ResourceNotFound)
		}

		const requestedFilename = path.paths[1]
		if (requestedFilename.startsWith("~$")) {
			// Sink for temp files
			return callback(null!, new Stream.PassThrough())
		}

		const existingMetadata = await s3
			.headObject({
				Bucket: bucketName,
				Key: user.objectId,
			})
			.then((head) => head.Metadata || {})
			.catch(() => ({}))

		const passThrough = new Stream.PassThrough()
		debugLog(`[webdav][S3FS] starting upload for ${user.objectId} (filename=${requestedFilename})`)
		const upload = new Upload({
			client: s3,
			params: {
				Bucket: bucketName,
				Key: user.objectId,
				Body: passThrough,
				Metadata: existingMetadata,
			},
		})

		upload.done().catch((err) => {
			console.error("[webdav] S3 Upload failed:", err)
			passThrough.emit("error", err)
		})

		upload.on?.("httpUploadProgress", (p: unknown) => {
			debugLog(`[webdav][S3FS] upload progress for ${user.objectId}:`, p)
		})

		callback(null!, passThrough)
	}

	async _size(path: webdav.Path, ctx: webdav.SizeInfo, callback: webdav.ReturnCallback<number>) {
		const user = ctx.context.user as WebDAVUser
		if (!user?.objectId || path.paths.length !== 2) {
			return callback(webdav.Errors.ResourceNotFound)
		}

		const requestedFilename = path.paths[1]
		if (requestedFilename.startsWith("~$")) {
			return callback(null!, 0)
		}

		try {
			const head = await s3.headObject({
				Bucket: bucketName,
				Key: user.objectId,
			})
			callback(null!, head.ContentLength!)
		} catch (e) {
			callback(e as Error)
		}
	}

	async _lastModifiedDate(
		path: webdav.Path,
		ctx: webdav.LastModifiedDateInfo,
		callback: webdav.ReturnCallback<number>
	) {
		const user = ctx.context.user as WebDAVUser
		if (!user?.objectId || path.paths.length !== 2) {
			return callback(webdav.Errors.ResourceNotFound)
		}

		const requestedFilename = path.paths[1]
		if (requestedFilename.startsWith("~$")) {
			return callback(null!, Date.now())
		}

		try {
			const head = await s3.headObject({
				Bucket: bucketName,
				Key: user.objectId,
			})
			callback(null!, head.LastModified!.getTime())
		} catch (e) {
			callback(e as Error)
		}
	}

	async _etag(path: webdav.Path, ctx: webdav.ETagInfo, callback: webdav.ReturnCallback<string>) {
		const user = ctx.context.user as WebDAVUser
		if (!user?.objectId || path.paths.length !== 2) {
			return callback(webdav.Errors.ResourceNotFound)
		}

		const requestedFilename = path.paths[1]
		if (requestedFilename.startsWith("~$")) {
			return callback(null!, '"temp-lock-file"')
		}

		try {
			const head = await s3.headObject({
				Bucket: bucketName,
				Key: user.objectId,
			})

			const etag = normalizeEtag(head.ETag)
			if (!etag) {
				return callback(webdav.Errors.InvalidOperation)
			}

			callback(null!, etag)
		} catch (e) {
			callback(e as Error)
		}
	}
}

// 1. Create a server that uses our custom TokenAuthentication and S3FileSystem
const server = new webdav.WebDAVServer({
	requireAuthentification: false,
	httpAuthentication: new TokenAuthentication(),
	headers: {
		Allow: "GET, HEAD, OPTIONS, PROPFIND, PUT, LOCK, UNLOCK, PROPPATCH",
		"MS-Author-Via": "DAV",
		DAV: "1, 2",
		"Accept-Ranges": "bytes",
		"Cache-Control": "no-cache, no-store, must-revalidate",
	},
})

// Mount the S3 FileSystem at the root
server.setFileSystemSync("/", new S3FileSystem())

// Create the underlying WebDAV express handler once
const _innerWebdavHandler = webdav.extensions.express("/webdav", server)

// Export a small wrapper so we can log requests/responses and S3/lock activity
export const webdavMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const fullRequestPath = req.originalUrl || req.url || ""
	if (!fullRequestPath.includes("/webdav")) {
		return next()
	}

	debugLog(`[webdav] ${req.method} ${req.originalUrl} headers=`, req.headers)

	if (req.method === "OPTIONS") {
		res.setHeader("Allow", OFFICE_ALLOW_HEADER)
	}

	const start = Date.now()

	res.on("finish", () => {
		debugLog(
			`[webdav] => ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms headers=`,
			res.getHeaders?.()
		)
	})

	const maybeHandleConditionalGetHead = async () => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			return false
		}

		try {
			const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`)
			const token = parseTokenFromPathname(url.pathname)
			if (!token) {
				return false
			}

			const segments = url.pathname.split("/").filter(Boolean)
			const webdavIndex = segments.indexOf("webdav")
			const filename =
				webdavIndex !== -1
					? decodeURIComponent(segments[webdavIndex + 2] || "")
					: decodeURIComponent(segments[1] || "")

			if (!filename || filename.startsWith("~$")) {
				return false
			}

			const tok = await jose.jwtVerify(token, new TextEncoder().encode(env.APP_SECRET), {
				algorithms: ["HS256"],
				audience: "webdav",
			})

			const payload = tok.payload as { contentId?: string }
			if (!payload.contentId) {
				return false
			}

			const content = await db.content.findUnique({
				where: { id: payload.contentId },
				select: { objectId: true },
			})

			if (!content?.objectId) {
				return false
			}

			const head = await s3.headObject({
				Bucket: bucketName,
				Key: content.objectId,
			})

			const etag = normalizeEtag(head.ETag)
			if (etag) {
				res.setHeader("ETag", etag)

				if (ifNoneMatchMatches(etag, req.headers["if-none-match"])) {
					res.statusCode = 304
					res.removeHeader("Content-Type")
					res.removeHeader("Content-Length")
					res.end()
					return true
				}
			}

			if (head.LastModified) {
				res.setHeader("Last-Modified", head.LastModified.toUTCString())

				const ifModifiedSince = parseHttpDate(req.headers["if-modified-since"])
				if (ifModifiedSince && head.LastModified.getTime() <= ifModifiedSince) {
					res.statusCode = 304
					res.removeHeader("Content-Type")
					res.removeHeader("Content-Length")
					res.end()
					return true
				}
			}

			return false
		} catch (e) {
			debugLog("[webdav] unable to pre-set ETag/Last-Modified headers:", e)
			return false
		}
	}

	try {
		void maybeHandleConditionalGetHead().then((handled) => {
			if (!handled) {
				_innerWebdavHandler(req, res, next)
			}
		})
		return
	} catch (err) {
		console.error("[webdav] handler error:", err)
		next(err)
	}
}
