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

/**
 * Format event date/time using the stored values (UTC components) so the displayed
 * time matches what was set on the event, without applying the device's timezone.
 * Use for eventDate / eventEndDate from the API.
 */
export function formatEventDateUTC(dateStr) {
	if (!dateStr) return '';
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return '';
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
	} catch (e) {
		return '';
	}
}

export function formatEventTimeUTC(dateStr) {
	if (!dateStr) return '';
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return '';
		const h = d.getUTCHours();
		const m = d.getUTCMinutes();
		const am = h < 12;
		const hour = h % 12 || 12;
		const min = String(m).padStart(2, '0');
		return `${hour}:${min} ${am ? 'AM' : 'PM'}`;
	} catch (e) {
		return '';
	}
}

export function formatEventDateTimeRangeUTC(eventDateStr, eventEndDateStr) {
	if (!eventDateStr) return 'Time TBD';
	const datePart = formatEventDateUTC(eventDateStr);
	const timePart = formatEventTimeUTC(eventDateStr);
	if (!eventEndDateStr) return `${datePart} • ${timePart}`;
	const start = new Date(eventDateStr);
	const end = new Date(eventEndDateStr);
	const sameDay = start.getUTCDate() === end.getUTCDate() &&
		start.getUTCMonth() === end.getUTCMonth() &&
		start.getUTCFullYear() === end.getUTCFullYear();
	if (sameDay) {
		const endTime = formatEventTimeUTC(eventEndDateStr);
		return `${datePart} • ${timePart} - ${endTime}`;
	}
	return `${datePart} • ${timePart}`;
}

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
