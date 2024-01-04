import mongoose from "mongoose"

const connectDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI)
		console.log("Connected to MongoDB!")
	} catch (error) {
		console.log("Connection failed!")
		process.exit(1)
	}
}

export default connectDatabase
