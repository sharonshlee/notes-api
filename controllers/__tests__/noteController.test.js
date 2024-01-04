jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("../../utils/index")
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { jest, expect } from "@jest/globals"
import User from "../../models/userModel"
import Note from "../../models/noteModel"
import { handleBadRequest, handleServerError } from "../../utils/index"
import {
	createNote,
	getNoteById,
	getNotes,
	updateNote,
} from "../noteController"

describe("Note Controller Test", () => {
	const mockResponse = jest.fn()
	it("should failed for list notes when db connection breaks", async () => {
		const error = "DB Connection ERROR"
		Note.find = () => ({ lean: jest.fn().mockRejectedValueOnce(error) })
		await getNotes({ user: { userId: "1" } }, mockResponse)
		expect(handleServerError).toBeCalledTimes(1)
		expect(handleServerError).toBeCalledWith(mockResponse, error)
	})

	it("should failed to get a note when invalid note id is provided", async () => {
		await getNoteById(
			{ user: { userId: "1" }, params: { id: "1" } },
			mockResponse
		)
		expect(handleBadRequest).toBeCalledTimes(1)
		expect(handleBadRequest).toBeCalledWith(
			mockResponse,
			"Invalid note id."
		)
	})

	it("should failed to create note when title is not provided", async () => {
		await createNote({ user: { userId: "1" }, body: {} }, mockResponse)
		expect(handleBadRequest).toBeCalledTimes(1)
		expect(handleBadRequest).toBeCalledWith(
			mockResponse,
			"Incomplete data."
		)
	})

	it("should failed to update note when invalid note id is provided", async () => {
		await updateNote({ params: { id: "1" }, body: {} }, mockResponse)
		expect(handleBadRequest).toBeCalledTimes(1)
		expect(handleBadRequest).toBeCalledWith(
			mockResponse,
			"Invalid note id."
		)
	})
})
