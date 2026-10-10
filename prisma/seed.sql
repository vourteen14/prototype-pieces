-- Manual seed equivalent to prisma/seed.ts
-- Run: docker exec -i sahaduta_db psql -U sahaduta -d klinik_sahaduta < prisma/seed.sql
-- or:  psql "postgresql://sahaduta:sahaduta123@localhost:5432/klinik_sahaduta" -f prisma/seed.sql

BEGIN;

-- Clear existing data (same order as seed.ts, respects FK dependencies)
TRUNCATE TABLE queues, schedules, staff, services, patients, users RESTART IDENTITY CASCADE;

-- Services
INSERT INTO services (name, code, opening_time, closing_time, is_active) VALUES
  ('Poli Umum',    'A', '08:00', '16:00', true),
  ('Poli KIA',     'K', '08:00', '14:00', true),
  ('Poli Gigi',    'G', '08:00', '13:00', true),
  ('Laboratorium', 'L', '08:00', '15:00', true);

-- Staff
INSERT INTO staff (name, type, service_id) VALUES
  ('dr. Andi Pratama',      'Dokter Umum',   (SELECT id FROM services WHERE code = 'A')),
  ('dr. Siti Rahma',        'Dokter Umum',   (SELECT id FROM services WHERE code = 'A')),
  ('dr. Rina Amelia',       'Dokter',        (SELECT id FROM services WHERE code = 'K')),
  ('Bidan Dewi Lestari',    'Bidan',         (SELECT id FROM services WHERE code = 'K')),
  ('drg. Fajar Nugraha',    'Dokter Gigi',   (SELECT id FROM services WHERE code = 'G')),
  ('drg. Maya Putri',       'Dokter Gigi',   (SELECT id FROM services WHERE code = 'G')),
  ('Ahmad',                 'Analis Lab',    (SELECT id FROM services WHERE code = 'L')),
  ('Rina',                  'Analis Lab',    (SELECT id FROM services WHERE code = 'L'));

-- Schedules: every staff member gets the same shift every day of the week
INSERT INTO schedules (staff_id, service_id, day, start_time, end_time)
SELECT s.id, s.service_id, d.day, shift.start_time, shift.end_time
FROM staff s
JOIN (VALUES
  ('dr. Andi Pratama',   '08:00', '12:00'),
  ('dr. Siti Rahma',     '13:00', '16:00'),
  ('dr. Rina Amelia',    '08:00', '12:00'),
  ('Bidan Dewi Lestari', '12:00', '14:00'),
  ('drg. Fajar Nugraha', '08:00', '11:00'),
  ('drg. Maya Putri',    '11:00', '13:00'),
  ('Ahmad',              '08:00', '12:00'),
  ('Rina',               '12:00', '15:00')
) AS shift(name, start_time, end_time) ON shift.name = s.name
CROSS JOIN (VALUES
  ('Senin'), ('Selasa'), ('Rabu'), ('Kamis'), ('Jumat'), ('Sabtu'), ('Minggu')
) AS d(day);

-- Users (bcrypt hashes below are for 'admin123' and 'petugas123', cost factor 10)
INSERT INTO users (name, username, password_hash, role) VALUES
  ('Administrator Klinik', 'admin',   '$2b$10$/v1kcKRCqQvLK7ME42YxzeCLnl/n9kRFAAtIx.mMpQaxCdtwQQwOC', 'ADMIN'),
  ('Petugas Pendaftaran',  'petugas', '$2b$10$hfLYkk0KMTmsMg3wJX7tO.7uKasz6baFu/7ppWo/Bh6VhztDxJvNe', 'PETUGAS');

-- Akun login dokter, satu per staff bertipe "Dokter*" (bcrypt hash di bawah
-- untuk 'dokter123', cost factor 10), lalu di-link ke baris staff-nya lewat
-- staff.user_id. Urutan username (dokter, dokter2, ...) ikut urutan staff
-- yang sama seperti di prisma/seed.ts.
-- DROP IF EXISTS versi data (DELETE dulu) supaya blok ini aman dijalankan
-- ulang sendiri, tanpa harus lewat TRUNCATE di atas.
DELETE FROM users WHERE username IN ('dokter', 'dokter2', 'dokter3', 'dokter4', 'dokter5');

INSERT INTO users (name, username, password_hash, role) VALUES
  ('dr. Andi Pratama',   'dokter',  '$2b$10$yPrQ8foRulLxCG1pGauVnOBtv6k4avyCkULiRn9EcX39s6JlQh.Ou', 'DOKTER'),
  ('dr. Siti Rahma',     'dokter2', '$2b$10$yPrQ8foRulLxCG1pGauVnOBtv6k4avyCkULiRn9EcX39s6JlQh.Ou', 'DOKTER'),
  ('dr. Rina Amelia',    'dokter3', '$2b$10$yPrQ8foRulLxCG1pGauVnOBtv6k4avyCkULiRn9EcX39s6JlQh.Ou', 'DOKTER'),
  ('drg. Fajar Nugraha', 'dokter4', '$2b$10$yPrQ8foRulLxCG1pGauVnOBtv6k4avyCkULiRn9EcX39s6JlQh.Ou', 'DOKTER'),
  ('drg. Maya Putri',    'dokter5', '$2b$10$yPrQ8foRulLxCG1pGauVnOBtv6k4avyCkULiRn9EcX39s6JlQh.Ou', 'DOKTER');

UPDATE staff SET user_id = (SELECT id FROM users WHERE username = 'dokter')  WHERE name = 'dr. Andi Pratama';
UPDATE staff SET user_id = (SELECT id FROM users WHERE username = 'dokter2') WHERE name = 'dr. Siti Rahma';
UPDATE staff SET user_id = (SELECT id FROM users WHERE username = 'dokter3') WHERE name = 'dr. Rina Amelia';
UPDATE staff SET user_id = (SELECT id FROM users WHERE username = 'dokter4') WHERE name = 'drg. Fajar Nugraha';
UPDATE staff SET user_id = (SELECT id FROM users WHERE username = 'dokter5') WHERE name = 'drg. Maya Putri';

COMMIT;
