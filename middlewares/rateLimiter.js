import { rateLimit } from "express-rate-limit"

/**
 * Limit each IP to 5 requests per `window` per minute
 */
export const rateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 5, // Limit each IP to 5 requests per `window` per minute
	message: {
		message:
			"Too many attempts from this IP, please try again after a 1 minute",
	},
	handler: (req, res, next, options) => {
		res.status(options.statusCode).send(options.message)
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
