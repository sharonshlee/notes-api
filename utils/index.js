export const handleBadRequest = (res, message) => {
	return res.status(400).json({ message }) //bad request
}

export const handleNotFound = (res) => {
	return res.status(404).json({ message: "Not Found." })
}

export const handleForbidden = (res) => {
	return res.status(403).json({ message: "Forbidden." })
}

export const handleUnauthorized = (res) => {
	return res.status(401).json({ message: "Unauthorized." })
}

export const handleServerError = (res, error) => {
	console.error(error)
	return res.status(500).json({ message: "Interval Server Error." })
}
