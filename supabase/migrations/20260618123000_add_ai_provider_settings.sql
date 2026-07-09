alter table public.ai_settings
  add column if not exists ai_provider text not null default 'openai',
  add column if not exists openai_api_key text,
  add column if not exists openai_image_model text not null default 'gpt-image-1-mini',
  add column if not exists openai_image_size text not null default '1024x1536',
  add column if not exists openai_image_quality text not null default 'low',
  add column if not exists lovable_api_key text;

update public.ai_settings
set
  ai_provider = coalesce(nullif(ai_provider, ''), 'openai'),
  openai_image_model = coalesce(nullif(openai_image_model, ''), 'gpt-image-1-mini'),
  openai_image_size = coalesce(nullif(openai_image_size, ''), '1024x1536'),
  openai_image_quality = coalesce(nullif(openai_image_quality, ''), 'low');
