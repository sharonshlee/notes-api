jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
import { jest, expect, beforeAll } from "@jest/globals"
import request from "supertest"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/userModel"
import Note from "../models/noteModel"

import app from "../app"

const mockLean = jest.fn()
const mockSelect = jest.fn()
const mockFind = jest.fn(() => ({
	lean: mockLean,
}))
const mockFindOne = jest.fn(() => ({
	select: () => ({ lean: mockLean }),
}))
const mockFindById = jest.fn(() => ({
	select: mockSelect,
}))

describe("Auth Controller Routes Testing", () => {
	const password = "badpassword"
	const email = "test@test.com"
	it("should sign up successfully", async () => {
		const mockUser = { email, name: "John" }
		const mockCreate = jest
			.fn()
			.mockResolvedValue({ _id: "1", ...mockUser })

		User.findOne = mockFindOne
		User.create = mockCreate

		const response = await request(app)
			.post("/api/auth/signup")
			.send({ ...mockUser, password })

		expect(response.statusCode).toBe(201)
		expect(mockFindOne).toBeCalledTimes(1)
		expect(mockCreate).toBeCalledTimes(1)
	})

	it("should handle user already exists error", async () => {
		const mockUser = { email: "test@test.com", name: "John" }
		const mockCreate = jest
			.fn()
			.mockResolvedValue({ _id: "1", ...mockUser })

		mockLean.mockResolvedValue({ _id: "1" })
		User.findOne = mockFindOne
		User.create = mockCreate

		const response = await request(app)
			.post("/api/auth/signup")
			.send({ ...mockUser, password })

		expect(response.statusCode).toBe(400)
		expect(mockFindOne).toBeCalledTimes(1)
		expect(mockCreate).not.toHaveBeenCalled()
	})

	it("should login successfully", async () => {
		jwt.sign.mockReturnValue("testing")

		mockLean.mockResolvedValue({ email, password, _id: "1" })
		mockFindOne.mockReturnValue({ lean: mockLean })

		bcryptjs.compare = jest.fn().mockResolvedValue(true)

		const response = await request(app)
			.post("/api/auth/login")
			.send({ email, password })
			.expect("Set-Cookie", /jwt_cookie=/)

		expect(response.statusCode).toBe(200)
		expect(response.text).toContain("accessToken")
	})

	it("should refresh successfully", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })
		jwt.sign.mockReturnValue("testing")

		mockSelect.mockResolvedValue({ _id: "1" })
		User.findById = mockFindById

		const response = await request(app)
			.get("/api/auth/refresh")
			.set("Cookie", "jwt_cookie=testing")

		expect(response.statusCode).toBe(200)
		expect(response.text).toContain("accessToken")
	})

	it("should failed to login", async () => {
		mockLean.mockResolvedValue({ email, password, _id: "1" })
		mockFindOne.mockReturnValue({ lean: mockLean })

		bcryptjs.compare = jest.fn().mockResolvedValue(false)

		const response = await request(app)
			.post("/api/auth/login")
			.send({ email, password })

		expect(response.statusCode).toBe(401)
		expect(response).not.toContain("accessToken")
	})

	it("should logout successfully", async () => {
		const response = await request(app)
			.post("/api/auth/logout")
			.set("Cookie", "jwt_cookie=testing")
			.expect("Set-Cookie", /jwt_cookie=;/)

		expect(response.statusCode).toBe(200)
	})

	it("should logout return 204 without jwt_cookie", async () => {
		const response = await request(app).post("/api/auth/logout")

		expect(response.statusCode).toBe(204)
	})
})

describe("Note Controller Routes Testing", () => {
	beforeAll(() => {
		User.findById = () => ({
			select: () => ({ lean: jest.fn().mockResolvedValue({ _id: "1" }) }),
		})
	})
	const mockNoteId = "0005a11e88685a5ef3b6e000"
	it("should list all notes for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })
		mockLean.mockResolvedValue([{ ownerId: "1" }])
		Note.find = mockFind

		User.findById = () => ({
			select: () => ({ lean: jest.fn().mockResolvedValue({ _id: "1" }) }),
		})
		const response = await request(app)
			.get("/api/notes")
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(200)
		expect(mockFind).toBeCalledTimes(1)
	})

	it("should get note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		mockLean.mockResolvedValue({ ownerId: "1" })
		Note.findById = () => ({ lean: mockLean })
		const response = await request(app)
			.get(`/api/notes/${mockNoteId}`)
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(200)
		expect(response.body).toEqual({ ownerId: "1" })
		expect(mockLean).toBeCalledTimes(1)
	})

	it("should error when nothing found for get note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		mockLean.mockResolvedValue()
		Note.findById = () => ({ lean: mockLean })
		const response = await request(app)
			.get(`/api/notes/${mockNoteId}`)
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(404)

		expect(mockLean).toBeCalledTimes(1)
	})

	it("should create note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		mockLean.mockResolvedValue()
		const mockCreate = jest.fn()

		Note.findOne = () => ({ select: () => ({ lean: mockLean }) })
		Note.create = mockCreate.mockResolvedValue({ _id: "1" })

		const response = await request(app)
			.post("/api/notes")
			.send({ title: "test", body: "" })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(201)
		expect(mockLean).toBeCalledTimes(1)
		expect(mockCreate).toBeCalledTimes(1)
	})

	it("should error when duplicate found on create note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		mockLean.mockResolvedValue({ _id: "1" })
		const mockCreate = jest.fn()

		Note.findOne = () => ({ select: () => ({ lean: mockLean }) })
		Note.create = mockCreate.mockResolvedValue({ _id: "1" })

		const response = await request(app)
			.post("/api/notes")
			.send({ title: "test", body: "" })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(400)
		expect(response.text).toContain("Duplicate title")
		expect(mockLean).toBeCalledTimes(1)
		expect(mockCreate).not.toHaveBeenCalled()
	})

	it("should update note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		const mockSave = jest.fn()
		mockLean.mockResolvedValue()

		Note.findOne = () => ({ select: () => ({ lean: mockLean }) })
		Note.findById = () => ({ ownerId: "1", save: mockSave })

		const response = await request(app)
			.put(`/api/notes/${mockNoteId}`)
			.send({ title: "test", body: "" })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(200)
		expect(response.text).toContain("test updated")
		expect(mockLean).toBeCalledTimes(1)
		expect(mockSave).toBeCalledTimes(1)
	})

	it("should error if duplicate title found on update note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		const mockSave = jest.fn()
		mockLean.mockResolvedValue({ ownerId: "1" })
		Note.findById = jest.fn().mockResolvedValue({ ownerId: "1" })
		Note.findOne = () => ({ select: () => ({ lean: mockLean }) })

		const response = await request(app)
			.put(`/api/notes/${mockNoteId}`)
			.send({ title: "test", body: "" })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(400)
		expect(response.text).toContain("Duplicate title")
		expect(mockLean).toBeCalledTimes(1)
		expect(mockSave).not.toHaveBeenCalled()
	})

	it("should delete note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		const mockDeleteOne = jest.fn()
		Note.findById = jest
			.fn()
			.mockResolvedValue({ ownerId: "1", deleteOne: mockDeleteOne })

		const response = await request(app)
			.delete(`/api/notes/${mockNoteId}`)
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(204)
		expect(mockDeleteOne).toBeCalledTimes(1)
	})

	it("should error if not not found on delete note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		const mockDeleteOne = jest.fn()
		Note.findById = jest.fn()

		const response = await request(app)
			.delete(`/api/notes/${mockNoteId}`)
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(404)
		expect(mockDeleteOne).toBeCalledTimes(0)
	})

	it("should share note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		const mockSave = jest.fn()

		Note.findById = () => ({
			ownerId: "1",
			sharedWithUserIds: [],
			save: mockSave,
		})

		const response = await request(app)
			.post(`/api/notes/${mockNoteId}/share`)
			.send({ sharedWithUserId: mockNoteId })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(200)

		expect(mockSave).toBeCalledTimes(1)
	})

	it("should error when try to share others note on share note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		const mockSave = jest.fn()

		Note.findById = () => ({
			lean: () => ({ ownerId: mockNoteId }),
		})

		const response = await request(app)
			.post(`/api/notes/${mockNoteId}/share`)
			.send({ sharedWithUserId: mockNoteId })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(403)
		expect(mockSave).not.toHaveBeenCalled()
	})

	it("should search note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		mockLean.mockResolvedValue([{ ownerId: "1" }])
		Note.find = () => ({ lean: mockLean })

		const response = await request(app)
			.get(`/api/search`)
			.query({ q: "test" })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(200)
		expect(response.body).toEqual([{ ownerId: "1" }])
		expect(mockLean).toBeCalledTimes(1)
	})

	it("should error if nothing found on search note by id for user", async () => {
		jwt.verify.mockReturnValue({ userId: "1" })

		mockLean.mockResolvedValue([])
		Note.find = () => ({ lean: mockLean })

		const response = await request(app)
			.get(`/api/search`)
			.query({ q: "test" })
			.set("Authorization", "Bearer testing")

		expect(response.statusCode).toBe(404)
		expect(mockLean).toBeCalledTimes(1)
	})
})
