import mongoose from "mongoose"
import User from "../models/userModel.js"
import {
	handleBadRequest,
	handleServerError,
	handleForbidden,
	handleNotFound,
} from "../utils/index.js"
import Note from "../models/noteModel.js"

/**
 * Filter sharedWithUserIds other than `sharedUserId`
 * when `sharedUserId` is not the owner of the note
 * @param {Object} note
 * @param {String} sharedUserId
 * @returns {Object} updated note
 */
const removeSharedUserIdsForNonOwner = (note, sharedUserId) => {
	const userId = sharedUserId
	if (note.ownerId !== userId) {
		return { ...note, sharedWithUserIds: [userId] }
	}
	return note
}

/**
 * Get a list of all notes for the authenticated user.
 */
export const getNotes = async (req, res) => {
	try {
		const { userId } = req.user
		const notes = await Note.find({
			$or: [
				{ ownerId: userId },
				{ sharedWithUserIds: { $in: [userId] } },
			],
		}).lean()

		res.status(200).json(
			notes.map((note) => removeSharedUserIdsForNonOwner(note, userId))
		)
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Get a note by ID for the authenticated user.
 */
export const getNoteById = async (req, res) => {
	try {
		const noteId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(noteId)) {
			return handleBadRequest(res, "Invalid note id.")
		}

		const note = await Note.findById(noteId).lean()

		if (!note) {
			return handleNotFound(res)
		}
		const { userId } = req.user
		if (
			note.ownerId !== userId &&
			!note.sharedWithUserIds.includes(userId)
		) {
			return handleForbidden(res)
		}

		res.status(200).json(removeSharedUserIdsForNonOwner(note, userId))
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Create a new note for the authenticated user.
 */
export const createNote = async (req, res) => {
	try {
		const { userId } = req.user
		const { title, body } = req.body

		if (!title) {
			return handleBadRequest(res, "Incomplete data.")
		}
		const existingNote = await Note.findOne({
			ownerId: userId,
			title,
		})
			.select("_id")
			.lean()

		if (existingNote) {
			return handleBadRequest(res, "Duplicate title.")
		}

		const newNote = await Note.create({
			ownerId: userId,
			title: title,
			body: body,
			dateAdded: new Date(),
		})

		return res.status(201).json(newNote)
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Update an existing note by ID for the authenticated user.
 */
export const updateNote = async (req, res) => {
	try {
		const noteId = req.params.id
		const { title, body } = req.body

		if (!mongoose.Types.ObjectId.isValid(noteId)) {
			return handleBadRequest(res, "Invalid note id.")
		}

		const note = await Note.findById(noteId)

		if (!note) {
			return handleNotFound(res)
		}
		const { userId } = req.user
		if (note.ownerId !== userId) {
			return handleForbidden(res)
		}
		const existingNote = await Note.findOne({
			ownerId: userId,
			_id: { $ne: noteId },
			title,
		})
			.select("_id")
			.lean()

		if (existingNote) {
			return handleBadRequest(res, "Duplicate title.")
		}

		note.title = title
		note.body = body
		note.dateModified = new Date()
		await note.save()

		return res.status(200).json({ message: `${note.title} updated` })
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Delete a note by ID for the authenticated user.
 */
export const deleteNote = async (req, res) => {
	try {
		const noteId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(noteId)) {
			return handleBadRequest(res, "Invalid note id.")
		}
		const note = await Note.findById(noteId)
		if (!note) {
			return handleNotFound(res)
		}

		const { userId } = req.user
		if (note.ownerId !== userId) {
			return handleForbidden(res)
		}

		await note.deleteOne()

		res.status(204).json({ message: "Note Deleted!" })
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Share a note with another user for the authenticated user.
 */
export const shareNote = async (req, res) => {
	try {
		const { userId } = req.user
		const { sharedWithUserId } = req.body
		const noteId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(sharedWithUserId)) {
			return handleBadRequest(res, "Invalid user id.")
		}

		if (!mongoose.Types.ObjectId.isValid(noteId)) {
			return handleBadRequest(res, "Invalid note id.")
		}

		if (userId === sharedWithUserId) {
			return handleBadRequest(res, "Cannot share with same user.")
		}

		const sharedUser = await User.findById(sharedWithUserId)
			.select("_id")
			.lean()
		if (!sharedUser) {
			return handleNotFound(res)
		}

		const note = await Note.findById(noteId)
		if (!note) {
			return handleNotFound(res)
		}

		if (note.ownerId !== userId) {
			return handleForbidden(res)
		}

		const exists = note.sharedWithUserIds.find(
			(sharedId) => sharedId === sharedWithUserId
		)
		if (exists) {
			return handleBadRequest(res, "Already shared with this user.")
		}

		note.sharedWithUserIds.push(sharedWithUserId)
		await note.save()

		return res.status(200).json({ message: `${note.title} shared` })
	} catch (error) {
		handleServerError(res, error)
	}
}

/**
 * Search for notes based on keywords for the authenticated user.
 */
export const searchNote = async (req, res) => {
	try {
		const { userId } = req.user
		const { q } = req.query

		if (q) {
			const filteredNotes = await Note.find({
				$and: [
					{
						$or: [
							{ ownerId: userId },
							{ sharedWithUserIds: { $in: [userId] } },
						],
					},
					{
						$or: [
							{ title: new RegExp(q, "i") },
							{ body: new RegExp(q, "i") },
						],
					},
				],
			}).lean()

			if (!filteredNotes?.length) {
				return handleNotFound(res)
			}

			return res
				.status(200)
				.json(
					filteredNotes.map((note) =>
						removeSharedUserIdsForNonOwner(note, userId)
					)
				)
		}
		return handleNotFound(res)
	} catch (error) {
		handleServerError(res, error)
	}
}
