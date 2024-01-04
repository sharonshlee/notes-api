import express from "express"
import {
	getNotes,
	getNoteById,
	createNote,
	updateNote,
	deleteNote,
	shareNote,
} from "../controllers/noteController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", authMiddleware, getNotes)
router.post("/", authMiddleware, createNote)
router.get("/:id", authMiddleware, getNoteById)
router.put("/:id", authMiddleware, updateNote)
router.delete("/:id", authMiddleware, deleteNote)
router.post("/:id/share", authMiddleware, shareNote)

export default router
