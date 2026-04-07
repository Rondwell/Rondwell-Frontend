/**
 * Cleans up verbose backend error messages (e.g. Mongoose validation errors)
 * into short, user-friendly messages suitable for toast notifications.
 */
export function cleanErrorMessage(msg: string): string {
	if (!msg) return 'Something went wrong. Please try again.';
	// Clean up verbose Mongoose/backend validation errors
	if (msg.toLowerCase().includes('validation failed')) {
		const parts = msg.split(':').slice(1).join(':').trim();
		const fields = parts.split(',').map(p => {
			const match = p.match(/`(\w+)`\s+is required/i);
			if (match) return match[1].replace(/([A-Z])/g, ' $1').trim();
			const pathMatch = p.match(/Path\s+`([^`]+)`/i);
			if (pathMatch) return pathMatch[1].split('.').pop()?.replace(/([A-Z])/g, ' $1').trim();
			return null;
		}).filter(Boolean);
		if (fields.length > 0) return `Missing required fields: ${fields.join(', ')}`;
		return 'Please fill in all required fields.';
	}
	// Truncate overly long messages
	if (msg.length > 120) return msg.slice(0, 120) + '...';
	return msg;
}
