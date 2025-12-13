import { Book, BookStatus } from '@/types';

// Helper type for intermediate import
export interface ImportedBook extends Partial<Book> {
    isbn?: string;
}

function parseCSVLine(text: string): string[] {
    const result: string[] = [];
    let start = 0;
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            let field = text.substring(start, i);
            // Remove surrounding quotes and unescape double quotes
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.substring(1, field.length - 1).replace(/""/g, '"');
            }
            // Handle weird Excel/Goodreads artifacts like ="123"
            if (field.startsWith('="') && field.endsWith('"')) {
                field = field.substring(2, field.length - 1);
            }
            result.push(field);
            start = i + 1;
        }
    }
    // Push the last field
    let field = text.substring(start);
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1).replace(/""/g, '"');
    }
    if (field.startsWith('="') && field.endsWith('"')) {
        field = field.substring(2, field.length - 1);
    }
    result.push(field);

    return result;
}

export function parseGoodreadsCSV(csvText: string): ImportedBook[] {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);

    // Map header names to indices
    const idx: Record<string, number> = {};
    headers.forEach((h, i) => idx[h.trim()] = i);

    const books: ImportedBook[] = [];

    // Helper to get value safe
    const getVal = (row: string[], colName: string) => {
        const i = idx[colName];
        return (i !== undefined && row[i]) ? row[i].trim() : '';
    };

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < headers.length) continue; // Skip malformed lines

        const title = getVal(row, 'Title');
        const author = getVal(row, 'Author');

        if (!title) continue;

        // Status Mapping
        const shelf = getVal(row, 'Exclusive Shelf');
        let status: BookStatus = 'tbr';
        if (shelf === 'read') status = 'finished';
        else if (shelf === 'currently-reading') status = 'reading';
        else if (shelf === 'to-read') status = 'tbr';

        // Dates
        const dateRead = getVal(row, 'Date Read') ? new Date(getVal(row, 'Date Read')).toISOString().split('T')[0] : undefined;
        const dateAdded = getVal(row, 'Date Added') ? new Date(getVal(row, 'Date Added')).toISOString().split('T')[0] : undefined;

        // Rating
        const myRating = parseInt(getVal(row, 'My Rating')) || 0;

        // Pages
        const pageCount = parseInt(getVal(row, 'Number of Pages')) || 0;

        // ISBN
        // Goodreads often formats ISBNs like ="978..."
        let isbn = getVal(row, 'ISBN13').replace(/[="]/g, '');
        if (!isbn) isbn = getVal(row, 'ISBN').replace(/[="]/g, '');

        // Tags/Genres from Bookshelves
        const bookshelvesRaw = getVal(row, 'Bookshelves');
        const tags: string[] = [];
        if (bookshelvesRaw) {
            // Bookshelves are comma-separated in Goodreads CSV
            // Filter out internal state shelves
            const ignoredShelves = new Set(['to-read', 'currently-reading', 'read', 'favorites', 'owned']);
            const shelves = bookshelvesRaw.split(',')
                .map(s => s.trim())
                .filter(s => s && !ignoredShelves.has(s.toLowerCase()));
            tags.push(...shelves);
        }

        books.push({
            title,
            author,
            pageCount,
            status,
            rating: myRating > 0 ? myRating : undefined,
            dateFinished: dateRead,
            dateStarted: dateAdded, // Rough fallback
            progress: status === 'finished' ? pageCount : 0,
            coverUrl: '', // No cover in CSV
            tags: tags.length > 0 ? tags : undefined,
            isbn: isbn || undefined
        });
    }

    return books.reverse(); // Process from end to beginning
}
