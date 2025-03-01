export const dateNormalizer = (date) => {
	if (!date) return '';

	try {
		// If it's a string (ISO format) or Date object, convert to Date
		const dateObj = new Date(date);

		if (isNaN(dateObj.getTime())) {
			console.error('Invalid date:', date);
			return '';
		}

		const month = dateObj.getMonth() + 1; // getMonth() returns 0-11
		const day = dateObj.getDate();
		const year = dateObj.getFullYear();

		return `${month}/${day}/${year}`;
	} catch (error) {
		console.error('Error normalizing date:', error);
		return '';
	}
};
