import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import User from "../models/userModel.js"

import {
	handleBadRequest,
	handleServerError,
	handleUnauthorized,
} from "../utils/index.js"

/**
 * Create a new user account.
 */
export const signup = async (req, res) => {
	try {
		const { email, name, password } = req.body

		if (!email || !name || !password) {
			return handleBadRequest(res, "Incomplete data.")
		}

		const userExists = await User.findOne({ email }).select("_id").lean()
		if (userExists) {
			return handleBadRequest(res, "User already exists.")
		}

		const salt = await bcrypt.genSalt()

		const hashedPassword = await bcrypt.hash(password, salt)

		const newUser = await User.create({
			name,
			email,
			password: hashedPassword,
		})

		res.status(201).json({
			userId: newUser._id.toString(),
			name: newUser.name,
			email: newUser.email,
		})
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Refresh access token for an authenticated user account.
 */
export const refresh = async (req, res) => {
	const cookies = req.cookies

	if (!cookies?.jwt_cookie) {
		return handleUnauthorized(res)
	}

	const refreshToken = cookies.jwt_cookie

	try {
		const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

		const user = await User.findById(decoded.userId).select("_id")

		if (!user) {
			return handleUnauthorized(res)
		}

		const accessToken = jwt.sign(
			{
				userId: user._id.toString(),
			},
			process.env.JWT_SECRET,
			{ expiresIn: "15m" }
		)

		res.status(200).json({ accessToken })
	} catch (error) {
		handleUnauthorized(res)
	}
}

/**
 * Log in to an existing user account and receive an access token.
 */
export const login = async (req, res) => {
	try {
		const { email, password } = req.body

		if (!email || !password) {
			return handleBadRequest(res, "Incomplete data.")
		}

		const user = await User.findOne({ email }).lean()

		if (user) {
			const passwordsMatch = await bcrypt.compare(password, user.password)

			if (!passwordsMatch) {
				return handleUnauthorized(res)
			}

			const tokenPayload = {
				userId: user._id.toString(),
			}

			const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
				expiresIn: "15m",
			})

			const refreshToken = jwt.sign(
				tokenPayload,
				process.env.JWT_REFRESH_SECRET,
				{ expiresIn: "1d" }
			)

			res.cookie("jwt_cookie", refreshToken, {
				httpOnly: true,
				sameSite: "None",
				maxAge: 24 * 60 * 60 * 1000,
			})

			res.status(200).json({
				accessToken,
			})
		} else {
			handleUnauthorized(res)
		}
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Log out an existing user account.
 */
export const logout = async (req, res) => {
	const cookies = req.cookies

	if (!cookies?.jwt_cookie) {
		return res.sendStatus(204) // no content
	}
	res.clearCookie("jwt_cookie", {
		httpOnly: true,
		sameSite: "None",
	})

	res.status(200).json({ message: "Logged out." })
}
