import { z } from "zod";

export const movieIdSchema = z.coerce.number().int().positive();
export const pageSchema = z.coerce.number().int().min(1).max(1000);

export const newMovieSchema = z.object({
  movieId: movieIdSchema,
  page: pageSchema,
});
export type NewMovieInput = z.infer<typeof newMovieSchema>;

export const swipeChoiceSchema = z.object({
  movieData: newMovieSchema,
  choice: z.boolean(),
});
export type SwipeChoiceInput = z.infer<typeof swipeChoiceSchema>;

export const notificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1024),
  link: z
    .string()
    .min(1)
    .max(1024)
    .refine(
      (v) => v.startsWith("/") && !v.startsWith("//"),
      "link must be a same-origin path starting with /",
    ),
});
export type NotificationInput = z.infer<typeof notificationSchema>;

export const idSchema = z.coerce.number().int().positive();
export const idListSchema = z.union([idSchema, z.array(idSchema).min(1).max(500)]);

export const fcmTokenSchema = z.string().min(20).max(4096);

/**
 * Throws a typed validation error with a public message safe to surface
 * to the client.
 */
export class ValidationError extends Error {
  issues: { path: string; message: string }[];
  constructor(issues: { path: string; message: string }[]) {
    super("Invalid input");
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export function parseInput<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    );
  }
  return result.data;
}
