jest.mock("jsonwebtoken")
jest.mock("../../utils/index")
import { jest, expect } from "@jest/globals"
import jwt from "jsonwebtoken"
import { handleUnauthorized } from "../../utils/index"
import { authMiddleware } from "../authMiddleware"
import User from "../../models/userModel"

describe("Auth Middleware Test", () => {
	const mockToken = "TESTING"
	it("should pass all checks", async () => {
		const mockLean = jest.fn().mockResolvedValue({ _id: "1" })
		const mockNext = jest.fn()

		jwt.verify.mockReturnValue({ userId: "1" })

		User.findById = () => ({
			select: () => ({ lean: mockLean }),
		})

		await authMiddleware(
			{
				headers: {
					authorization: `Bearer ${mockToken}`,
				},
			},
			null,
			mockNext
		)

		expect(mockLean).toHaveBeenCalledTimes(1)
		expect(mockNext).toHaveBeenCalledTimes(1)
	})

	it("should fail when no access token found", async () => {
		const mockNext = jest.fn()
		const mockResponse = jest.fn()

		await authMiddleware({ headers: {} }, mockResponse, mockNext)

		expect(handleUnauthorized).toHaveBeenCalledTimes(1)
		expect(handleUnauthorized).toBeCalledWith(mockResponse)
		expect(mockNext).not.toHaveBeenCalled()
	})

	it("should fail when access token is invalid", async () => {
		const mockNext = jest.fn()
		const mockResponse = jest.fn()

		jwt.verify = () => {
			throw "Invalid token"
		}

		await authMiddleware(
			{
				headers: {
					authorization: `Bearer ${mockToken}`,
				},
			},
			mockResponse,
			mockNext
		)

		expect(handleUnauthorized).toHaveBeenCalledTimes(1)
		expect(handleUnauthorized).toBeCalledWith(mockResponse)
		expect(mockNext).not.toHaveBeenCalled()
	})

	it("should fail when user is not found", async () => {
		const mockNext = jest.fn()
		const mockResponse = jest.fn()
		const mockLean = jest.fn().mockResolvedValue()

		jwt.verify = jest.fn().mockReturnValue({ userId: "1" })

		User.findById = () => ({
			select: () => ({ lean: mockLean }),
		})

		await authMiddleware(
			{
				headers: {
					authorization: `Bearer ${mockToken}`,
				},
			},
			mockResponse,
			mockNext
		)

		expect(handleUnauthorized).toHaveBeenCalledTimes(1)
		expect(handleUnauthorized).toBeCalledWith(mockResponse)
		expect(mockNext).not.toHaveBeenCalled()
	})
})
