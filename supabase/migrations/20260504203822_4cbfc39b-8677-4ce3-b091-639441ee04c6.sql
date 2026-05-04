CREATE OR REPLACE FUNCTION public.send_task_due_reminders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec RECORD;
  _title text;
  _body text;
BEGIN
  -- 3 dni przed terminem
  FOR rec IN
    SELECT id, user_id, title, due_date
    FROM public.mentor_assigned_tasks
    WHERE due_date = current_date + 3
      AND status IN ('assigned','in_progress','needs_revision')
  LOOP
    _title := '📅 Za 3 dni termin: ' || rec.title;
    _body := 'Zadanie od mentora "' || rec.title || '" ma termin ' || to_char(rec.due_date, 'DD.MM.YYYY') || '.';
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = rec.user_id AND title = _title AND created_at::date = current_date
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, body)
      VALUES (rec.user_id, 'task_revision', _title, _body);
    END IF;
  END LOOP;

  -- Jutro
  FOR rec IN
    SELECT id, user_id, title, due_date
    FROM public.mentor_assigned_tasks
    WHERE due_date = current_date + 1
      AND status IN ('assigned','in_progress','needs_revision')
  LOOP
    _title := '⏰ Jutro termin: ' || rec.title;
    _body := 'Przypomnienie: zadanie od mentora "' || rec.title || '" ma termin jutro (' || to_char(rec.due_date, 'DD.MM.YYYY') || ').';
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = rec.user_id AND title = _title AND created_at::date = current_date
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, body)
      VALUES (rec.user_id, 'task_revision', _title, _body);
    END IF;
  END LOOP;

  -- Dziś
  FOR rec IN
    SELECT id, user_id, title, due_date
    FROM public.mentor_assigned_tasks
    WHERE due_date = current_date
      AND status IN ('assigned','in_progress','needs_revision')
  LOOP
    _title := '🔥 Dziś termin: ' || rec.title;
    _body := 'Ostatni dzień na wykonanie zadania od mentora "' || rec.title || '".';
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = rec.user_id AND title = _title AND created_at::date = current_date
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, body)
      VALUES (rec.user_id, 'task_revision', _title, _body);
    END IF;
  END LOOP;

  -- Po terminie (raz, w dniu po terminie)
  FOR rec IN
    SELECT id, user_id, title, due_date
    FROM public.mentor_assigned_tasks
    WHERE due_date = current_date - 1
      AND status IN ('assigned','in_progress','needs_revision')
  LOOP
    _title := '⚠️ Termin minął: ' || rec.title;
    _body := 'Zadanie "' || rec.title || '" miało termin ' || to_char(rec.due_date, 'DD.MM.YYYY') || '. Wykonaj je jak najszybciej.';
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = rec.user_id AND title = _title AND created_at::date = current_date
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, body)
      VALUES (rec.user_id, 'task_revision', _title, _body);
    END IF;
  END LOOP;
END;
$function$;