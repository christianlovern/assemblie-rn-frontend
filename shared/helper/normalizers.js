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

// Normalize date to YYYY-MM-DD format for comparison (handles timezone issues)
export const normalizeDateString = (date) => {
	if (!date) return '';

	try {
		// If already in YYYY-MM-DD format, return as-is
		if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return date;
		}

		// Parse the date and extract just the date part (ignoring time/timezone)
		const dateObj = new Date(date);
		if (isNaN(dateObj.getTime())) {
			console.error('Invalid date:', date);
			return '';
		}

		// Use UTC methods to avoid timezone conversion issues
		const year = dateObj.getUTCFullYear();
		const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getUTCDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	} catch (error) {
		console.error('Error normalizing date string:', error);
		return '';
	}
};

// Format date for scheduling (e.g., "Feb 15, 2026")
export const formatScheduleDate = (date) => {
	if (!date) return '';

	try {
		// Normalize to YYYY-MM-DD first to avoid timezone issues
		const normalizedDate = normalizeDateString(date);
		if (!normalizedDate) return '';

		// Parse the normalized date (which is already in YYYY-MM-DD format)
		const [year, month, day] = normalizedDate.split('-').map(Number);
		const dateObj = new Date(Date.UTC(year, month - 1, day));

		if (isNaN(dateObj.getTime())) {
			console.error('Invalid date:', date);
			return '';
		}

		const months = [
			'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
			'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
		];

		return `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;
	} catch (error) {
		console.error('Error formatting schedule date:', error);
		return '';
	}
};
