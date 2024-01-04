jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("../../utils/index")
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { jest, expect } from "@jest/globals"
import User from "../../models/userModel"
import { handleBadRequest } from "../../utils/index"
import { signup, login, logout } from "../authController"

describe("Auth Controller Test", () => {
	const mockJsonResponse = jest.fn()
	const response = {
		status: () => ({
			json: mockJsonResponse,
		}),
		cookie: jest.fn(),
	}
	const password = "badpassword"
	const email = "test@test.com"
	const mockLean = jest.fn()
	const mockFindOne = jest.fn(() => ({
		select: () => ({ lean: mockLean }),
	}))
	it("should sign up successfully", async () => {
		const mockUser = { email, name: "John" }
		const mockCreate = jest
			.fn()
			.mockResolvedValue({ _id: "1", ...mockUser })

		User.findOne = mockFindOne
		User.create = mockCreate

		await signup(
			{
				body: {
					...mockUser,
					password,
				},
			},
			response
		)

		expect(mockFindOne).toBeCalledTimes(1)
		expect(mockCreate).toBeCalledTimes(1)
	})

	it("should failed to sign up if no email is provided", async () => {
		const mockUser = { name: "John" }

		await signup(
			{
				body: {
					...mockUser,
					password,
				},
			},
			response
		)

		expect(handleBadRequest).toBeCalledTimes(1)
	})

	it("should handle user already exists error", async () => {
		const mockUser = { email: "test@test.com", name: "John" }
		const mockCreate = jest
			.fn()
			.mockResolvedValue({ _id: "1", ...mockUser })
		mockLean.mockResolvedValue({ _id: "1" })
		User.findOne = mockFindOne
		User.create = mockCreate

		await signup(
			{
				body: {
					...mockUser,
					password,
				},
			},
			response
		)

		expect(mockFindOne).toBeCalledTimes(1)
		expect(mockCreate).not.toHaveBeenCalled()
	})

	it("should login successfully", async () => {
		mockLean.mockResolvedValue({ email, password, _id: "1" })
		mockFindOne.mockReturnValue({ lean: mockLean })
		bcryptjs.compare = jest.fn().mockResolvedValue(true)
		const accessToken = "TESTING"
		jwt.sign.mockReturnValue(accessToken)
		await login({ body: { email, password } }, response)

		expect(mockJsonResponse).toBeCalledTimes(1)
		expect(mockJsonResponse).toBeCalledWith({ accessToken })
	})

	it("should failed to login", async () => {
		mockLean.mockResolvedValue({ email, password, _id: "1" })
		mockFindOne.mockReturnValue({ lean: mockLean })
		bcryptjs.compare = jest.fn().mockResolvedValue(false)
		await login({ body: { email, password } }, response)

		expect(jwt.sign).not.toHaveBeenCalled()
	})

	it("should logout successfully", async () => {
		response.clearCookie = jest.fn()
		const result = await logout(
			{ cookies: { jwt_cookie: "cookie" } },
			response
		)

		expect(response.clearCookie).toBeCalledTimes(1)
		expect(mockJsonResponse).toBeCalledTimes(1)
		expect(mockJsonResponse).toBeCalledWith({ message: "Logged out." })
	})

	it("should logout successfully with no cookie", async () => {
		response.sendStatus = jest.fn()
		await logout({}, response)

		expect(response.sendStatus).toBeCalledTimes(1)
		expect(mockJsonResponse).toBeCalledTimes(0)
	})
})
