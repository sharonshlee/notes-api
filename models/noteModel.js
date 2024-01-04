import mongoose from "mongoose"

const noteSchema = new mongoose.Schema({
	ownerId: {
		type: String,
		required: true,
	},
	sharedWithUserIds: [
		{
			type: String,
			default: [],
		},
	],
	title: {
		type: String,
		required: true,
	},
	body: {
		type: String,
	},
	dateAdded: {
		type: Date,
		required: true,
	},
	dateModified: {
		type: Date,
	},
})
noteSchema.index({ ownerId: 1 })
noteSchema.index({ sharedWithUserIds: 1 })
noteSchema.index({ title: "text", body: "text" })

const Note = mongoose.model("Note", noteSchema)

export default Note
