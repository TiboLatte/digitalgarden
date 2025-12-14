/**
 * Sanitizes and upgrades Google Books image URLs
 * 1. Forces HTTPS
 * 2. Removes low-quality zoom parameters
 * 3. Removes edge curl effects
 */
export const getSecureCoverUrl = (url: string | undefined): string => {
    if (!url) return '';

    return url
        .replace(/^http:/, 'https:')       // Force HTTPS
        .replace(/&zoom=\d/, '')           // Remove zoom constraint (get best quality)
        .replace('&edge=curl', '');        // Remove "page curl" effect
};
