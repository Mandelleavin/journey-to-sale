-- Triggery dla zadań od mentora — powiadomienia i XP
DROP TRIGGER IF EXISTS trg_mentor_task_assigned ON public.mentor_assigned_tasks;
CREATE TRIGGER trg_mentor_task_assigned
AFTER INSERT ON public.mentor_assigned_tasks
FOR EACH ROW EXECUTE FUNCTION public.on_mentor_task_assigned();

DROP TRIGGER IF EXISTS trg_mentor_task_reviewed ON public.mentor_assigned_tasks;
CREATE TRIGGER trg_mentor_task_reviewed
AFTER UPDATE ON public.mentor_assigned_tasks
FOR EACH ROW EXECUTE FUNCTION public.on_mentor_task_reviewed();

-- updated_at automatycznie
DROP TRIGGER IF EXISTS trg_mentor_task_updated_at ON public.mentor_assigned_tasks;
CREATE TRIGGER trg_mentor_task_updated_at
BEFORE UPDATE ON public.mentor_assigned_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pozostałe brakujące triggery wykorzystywane w grze (XP / streak / wyzwania / odznaki)
DROP TRIGGER IF EXISTS trg_lesson_progress_inserted ON public.user_lesson_progress;
CREATE TRIGGER trg_lesson_progress_inserted
AFTER INSERT ON public.user_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.on_lesson_progress_inserted();

DROP TRIGGER IF EXISTS trg_lesson_watched_xp ON public.user_lesson_progress;
CREATE TRIGGER trg_lesson_watched_xp
AFTER INSERT ON public.user_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.on_lesson_watched();

DROP TRIGGER IF EXISTS trg_xp_logged ON public.user_xp_log;
CREATE TRIGGER trg_xp_logged
AFTER INSERT ON public.user_xp_log
FOR EACH ROW EXECUTE FUNCTION public.on_xp_logged();

DROP TRIGGER IF EXISTS trg_submission_reviewed ON public.task_submissions;
CREATE TRIGGER trg_submission_reviewed
AFTER UPDATE ON public.task_submissions
FOR EACH ROW EXECUTE FUNCTION public.on_submission_reviewed();

DROP TRIGGER IF EXISTS trg_submission_first_approved ON public.task_submissions;
CREATE TRIGGER trg_submission_first_approved
AFTER UPDATE ON public.task_submissions
FOR EACH ROW EXECUTE FUNCTION public.on_submission_first_approved();

DROP TRIGGER IF EXISTS trg_community_post_created ON public.community_posts;
CREATE TRIGGER trg_community_post_created
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.on_community_post_created();

DROP TRIGGER IF EXISTS trg_community_comment_created ON public.community_comments;
CREATE TRIGGER trg_community_comment_created
AFTER INSERT ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION public.on_community_comment_created();

DROP TRIGGER IF EXISTS trg_profile_created_init_credits ON public.profiles;
CREATE TRIGGER trg_profile_created_init_credits
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_profile_created_init_credits();

DROP TRIGGER IF EXISTS trg_survey_hot_lead ON public.survey_responses;
CREATE TRIGGER trg_survey_hot_lead
AFTER INSERT OR UPDATE ON public.survey_responses
FOR EACH ROW EXECUTE FUNCTION public.on_survey_hot_lead();