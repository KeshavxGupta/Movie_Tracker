import { z } from 'zod';

export const MediaItemSchema = z.object({
    id: z.string().uuid().optional(),
    tmdbId: z.number().int().positive(),
    title: z.string().min(1).max(255),
    year: z.string().regex(/^\d{4}$/).or(z.string().length(0)),
    poster: z.string().url().nullable().optional(),
    backdrop: z.string().url().nullable().optional(),
    type: z.enum(['Movie', 'Series', 'Anime']),
    status: z.enum(['Plan to Watch', 'Watching', 'Completed', 'Dropped']),
    rating: z.number().min(0).max(10),
    episodes: z.number().int().min(0).default(0),
    totalEpisodes: z.number().int().min(0).default(0),
    totalSeasons: z.number().int().min(0).default(0),
    addedAt: z.number().int().positive(),
    overview: z.string().max(2000).optional(),
    notes: z.string().max(10000).optional().default(''),
    genres: z.array(z.any()).optional()
}).strict();

export const UpdateMediaItemSchema = MediaItemSchema.partial().omit({ id: true, tmdbId: true });

export const SearchQuerySchema = z.string().min(1).max(100).trim();

export const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, ''); // Simple XSS prevention for <> tags
};
