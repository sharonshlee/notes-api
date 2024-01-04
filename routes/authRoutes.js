import express from "express"
import {
	login,
	logout,
	signup,
	refresh,
} from "../controllers/authController.js"
import { rateLimiter } from "../middlewares/rateLimiter.js"

const router = express.Router()

router.post("/signup", rateLimiter, signup)
router.post("/login", rateLimiter, login)
router.get("/refresh", refresh)
router.post("/logout", logout)

export default router
