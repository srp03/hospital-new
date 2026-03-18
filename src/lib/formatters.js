/**
 * Formats a doctor's name to ensure it has a single "Dr." prefix.
 * @param {string} name - The doctor's full name.
 * @returns {string} - The formatted name (e.g., "Dr. Arjun Mehta").
 */
export const formatDoctorName = (name) => {
    if (!name) return 'Unknown Doctor';

    // Remove existing "Dr." or "Dr " prefixes (case-insensitive)
    const cleanName = name.replace(/^(dr\.?\s*)+/i, '').trim();

    return `Dr. ${cleanName}`;
};
