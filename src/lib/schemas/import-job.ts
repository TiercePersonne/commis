export type ImportJobStatus = 'pending' | 'downloading' | 'structuring' | 'done' | 'error';

export type ExtractedRecipe = {
  title: string;
  ingredients: { text: string; order: number }[];
  steps: { text: string; order: number }[];
  image_url?: string | null;
  source_url?: string;
  source_type?: 'web' | 'reel' | 'image' | 'text';
  confidence: 'complete' | 'partial';
  suggested_tags?: string[];
};

export type ImportJob = {
  id: string;
  user_id: string;
  status: ImportJobStatus;
  source_url: string;
  source_type: 'web' | 'reel';
  result: ExtractedRecipe | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
