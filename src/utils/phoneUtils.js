/**
 * Strip non-digit characters (except leading +) for storage/API.
 * e.g. "(111) 111-1111" or "111-111-1111" -> "1111111111"
 *      "+1 111-111-1111" -> "+11111111111"
 */
export function normalizePhone(phone) {
	if (phone == null || typeof phone !== 'string') return '';
	const trimmed = phone.trim();
	if (!trimmed) return '';
	const hasPlus = trimmed.startsWith('+');
	const digits = trimmed.replace(/[^\d]/g, '');
	return hasPlus ? `+${digits}` : digits;
}

/**
 * Format a 10-digit US number for display: (111) 111-1111.
 * If the value has a leading + (international), return as-is or format if 11 digits (+1 + 10).
 */
export function formatPhoneForDisplay(phone) {
	if (phone == null || typeof phone !== 'string') return '';
	const normalized = normalizePhone(phone);
	if (!normalized) return '';

	if (normalized.startsWith('+')) {
		// International: if +1 and 11 digits, format as US
		if (normalized.length === 12 && normalized.startsWith('+1')) {
			const ten = normalized.slice(2);
			return formatTenDigits(ten);
		}
		// Otherwise show normalized (e.g. +44 20 7123 4567 we could format per country; for now keep simple)
		return normalized;
	}

	if (normalized.length === 10) {
		return formatTenDigits(normalized);
	}
	// Not 10 digits (e.g. 7 or 11 without +): show as-is
	return normalized;
}

function formatTenDigits(digits) {
	if (digits.length !== 10) return digits;
	return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
