-- =============================================================================
-- Book It Daily -- rename the seeded demo studio from "Maison and Co."
--
-- Idempotent: only updates rows that still carry the old brand. Safe to re-run.
-- All FKs reference studios.id (UUID), so renaming name + slug doesn't break
-- bookings, members, messages, etc.
-- =============================================================================

update public.studios
   set name = 'Book It Daily',
       slug = 'book-it-daily'
 where slug = 'maison-and-co'
    or name = 'Maison and Co.'
    or name = 'Maison & Co.';
