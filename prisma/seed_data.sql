-- Seed MairieConnect — À exécuter dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/tvsijgwkkfmeztigwvsn

-- Tenants (communes)
INSERT INTO tenants (id, name, slug, entity_type, post_code, city_name, latitude, longitude, source, is_active)
VALUES
  ('t_paris', 'Mairie de Paris Centre', 'mairie-de-paris-centre-75001', 'mairie', '75001', 'Paris', 48.8566, 2.3522, 'manual', true),
  ('t_lyon', 'Mairie de Lyon', 'mairie-de-lyon-69001', 'mairie', '69001', 'Lyon', 45.7675, 4.8330, 'manual', true),
  ('t_marseille', 'Mairie de Marseille', 'mairie-de-marseille-13001', 'mairie', '13001', 'Marseille', 43.2965, 5.3698, 'manual', true),
  ('t_bordeaux', 'Mairie de Bordeaux', 'mairie-de-bordeaux-33000', 'mairie', '33000', 'Bordeaux', 44.8378, -0.5792, 'manual', true),
  ('t_lille', 'Mairie de Lille', 'mairie-de-lille-59000', 'mairie', '59000', 'Lille', 50.6292, 3.0573, 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- Notices (informations)
INSERT INTO official_notices (id, tenant_id, title, content, category, sign_type, is_published, source)
VALUES
  ('n1', 't_paris', 'Travaux rue de la République', '<p>Travaux du <strong>15 au 30 septembre 2026</strong>. Circulation alternée.</p>', 'travaux', 'info', true, 'manual'),
  ('n2', 't_paris', 'Collecte des déchets verts', '<p>Calendrier automne : mardi et vendredi 7h-12h.</p>', 'dechets', 'info', true, 'manual'),
  ('n3', 't_paris', 'Alerte canicule — Vigilance orange', '<p>Buvez de l''eau, évitez les sorties 12h-16h. Salle rafraîchie en mairie.</p>', 'securite', 'alert', true, 'manual'),
  ('n4', 't_lyon', 'Réunion publique — Budget participatif', '<p>Réunion le 12 septembre à 18h en mairie. Présentation des projets 2026.</p>', 'evenement', 'info', true, 'manual'),
  ('n5', 't_lyon', 'Marché de Noël — Appel à candidatures', '<p>Inscriptions jusqu''au 15 novembre pour les exposants.</p>', 'evenement', 'info', true, 'manual'),
  ('n6', 't_marseille', 'Fermeture de la piscine municipale', '<p>Fermeture pour travaux du 1er au 30 septembre.</p>', 'travaux', 'info', true, 'manual')
ON CONFLICT (id) DO NOTHING;

-- Admin user
INSERT INTO users (id, email, name, password_hash, role, is_active)
VALUES ('u_admin', 'admin@mairieconnect.fr', 'Admin', '$2a$04$QyJZ2m3NvGk4b7W1dE9XeO5zVQrGk5j6p8s2n4l1m9w', 'superadmin', true)
ON CONFLICT (email) DO NOTHING;