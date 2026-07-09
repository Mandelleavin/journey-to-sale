-- The program consists of eight sequential courses. Keep their public numbering 1-8.
with numbering(base_title, numbered_title) as (
  values
    ('Start: Mindset i fundamenty', '1. Start: Mindset i fundamenty'),
    ('Pomysł: Mikro-problem', '2. Pomysł: Mikro-problem'),
    ('Oferta: Value stack i cena', '3. Oferta: Value stack i cena'),
    ('Lejek: Landing, mail, checkout', '4. Lejek: Landing, mail, checkout'),
    ('Pierwsze rozmowy: DM i lead magnet', '5. Pierwsze rozmowy: DM i lead magnet'),
    ('Reklamy: Meta Ads i ROAS', '6. Reklamy: Meta Ads i ROAS'),
    ('Optymalizacja: A/B i dostarczalność', '7. Optymalizacja: A/B i dostarczalność'),
    ('Skalowanie: Drabinka i automatyzacja', '8. Skalowanie: Drabinka i automatyzacja')
)
update public.courses as course
set title = numbering.numbered_title
from numbering
where trim(regexp_replace(course.title, '^\s*[0-9]+\.\s*', '')) = numbering.base_title
  and course.title is distinct from numbering.numbered_title;

with numbering(base_title, numbered_title) as (
  values
    ('Start: Mindset i fundamenty', '1. Start: Mindset i fundamenty'),
    ('Pomysł: Mikro-problem', '2. Pomysł: Mikro-problem'),
    ('Oferta: Value stack i cena', '3. Oferta: Value stack i cena'),
    ('Lejek: Landing, mail, checkout', '4. Lejek: Landing, mail, checkout'),
    ('Pierwsze rozmowy: DM i lead magnet', '5. Pierwsze rozmowy: DM i lead magnet'),
    ('Reklamy: Meta Ads i ROAS', '6. Reklamy: Meta Ads i ROAS'),
    ('Optymalizacja: A/B i dostarczalność', '7. Optymalizacja: A/B i dostarczalność'),
    ('Skalowanie: Drabinka i automatyzacja', '8. Skalowanie: Drabinka i automatyzacja')
)
update public.modules as module
set title = numbering.numbered_title
from numbering
where trim(regexp_replace(module.title, '^\s*[0-9]+\.\s*', '')) = numbering.base_title
  and module.title is distinct from numbering.numbered_title;

with numbering(base_title, numbered_title) as (
  values
    ('Start: Mindset i fundamenty', '1. Start: Mindset i fundamenty'),
    ('Pomysł: Mikro-problem', '2. Pomysł: Mikro-problem'),
    ('Oferta: Value stack i cena', '3. Oferta: Value stack i cena'),
    ('Lejek: Landing, mail, checkout', '4. Lejek: Landing, mail, checkout'),
    ('Pierwsze rozmowy: DM i lead magnet', '5. Pierwsze rozmowy: DM i lead magnet'),
    ('Reklamy: Meta Ads i ROAS', '6. Reklamy: Meta Ads i ROAS'),
    ('Optymalizacja: A/B i dostarczalność', '7. Optymalizacja: A/B i dostarczalność'),
    ('Skalowanie: Drabinka i automatyzacja', '8. Skalowanie: Drabinka i automatyzacja')
)
update public.learning_path_steps as step
set label = numbering.numbered_title
from numbering
where trim(regexp_replace(step.label, '^\s*[0-9]+\.\s*', '')) = numbering.base_title
  and step.label is distinct from numbering.numbered_title;
