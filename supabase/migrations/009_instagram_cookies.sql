-- Remplace instagram_session_id par instagram_cookies (contenu fichier Netscape complet)
ALTER TABLE user_settings
  RENAME COLUMN instagram_session_id TO instagram_cookies;
