-- A3 — Corriger la policy INSERT sur storage.objects
-- La policy précédente (007) permettait à un utilisateur authentifié d'uploader
-- dans le dossier de n'importe quel autre utilisateur.
-- On restreint maintenant l'upload au dossier propre de l'utilisateur : userId/filename

-- Supprimer l'ancienne policy INSERT trop permissive
drop policy if exists "Authenticated users can upload recipe images" on storage.objects;

-- Créer la nouvelle policy INSERT restreinte au dossier de l'utilisateur
create policy "Users can upload to their own recipe image folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
