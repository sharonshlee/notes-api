import jwt from "jsonwebtoken"
import User from "../models/userModel.js"
import { handleServerError, handleUnauthorized } from "../utils/index.js"

/**
 * To authenticate request payload and deny unauthorized request
 */
export const authMiddleware = async (req, res, next) => {
	try {
		const accessToken = req.headers.authorization?.split(" ")[1]

		if (!accessToken) {
			return handleUnauthorized(res)
		}
		let decoded = null
		try {
			decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
		} catch {
			return handleUnauthorized(res)
		}

		const user = await User.findById(decoded.userId)
			.select("-password")
			.lean()

		if (!user) {
			return handleUnauthorized(res)
		}
		const { _id, ...userData } = user
		req.user = { userId: _id.toString(), ...userData }
		next()
	} catch (error) {
		handleServerError(res, error)
	}
}
