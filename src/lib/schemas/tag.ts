import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1, 'Le nom du tag est requis').max(50, 'Le nom est trop long'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};
