import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"

import authRoutes from "./routes/authRoutes.js"
import noteRoutes from "./routes/noteRoutes.js"
import { authMiddleware } from "./middlewares/authMiddleware.js"
import { searchNote } from "./controllers/noteController.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRoutes)
app.use("/api/notes", noteRoutes)
app.get("/api/search", authMiddleware, searchNote)

export default app
