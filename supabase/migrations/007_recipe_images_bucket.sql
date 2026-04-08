insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "Public read recipe images"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "Authenticated users can upload recipe images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'recipe-images');

create policy "Users can delete their own recipe images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'recipe-images' and auth.uid()::text = (storage.foldername(name))[1]);
