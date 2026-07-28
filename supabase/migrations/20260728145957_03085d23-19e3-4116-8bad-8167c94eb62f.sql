
-- Comment notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner uuid; commenter text;
BEGIN
  SELECT author_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NULL OR post_owner = NEW.author_id THEN RETURN NEW; END IF;
  SELECT full_name INTO commenter FROM public.profiles WHERE id = NEW.author_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (post_owner, 'comment', COALESCE(commenter,'Someone') || ' commented on your post', LEFT(NEW.body, 140), '/feed');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.post_comments;
CREATE TRIGGER trg_notify_on_comment AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Like notifications
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner uuid; liker text;
BEGIN
  SELECT author_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NULL OR post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT full_name INTO liker FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (post_owner, 'like', COALESCE(liker,'Someone') || ' liked your post', NULL, '/feed');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_on_like ON public.post_likes;
CREATE TRIGGER trg_notify_on_like AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Review notifications
CREATE OR REPLACE FUNCTION public.notify_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reviewer_name text;
BEGIN
  IF NEW.reviewee_id = NEW.reviewer_id THEN RETURN NEW; END IF;
  SELECT full_name INTO reviewer_name FROM public.profiles WHERE id = NEW.reviewer_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (NEW.reviewee_id, 'review',
    COALESCE(reviewer_name,'Someone') || ' left you a ' || NEW.rating || '★ review',
    LEFT(COALESCE(NEW.comment,''), 140),
    '/profile/' || NEW.reviewee_id);
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_on_review() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_on_review ON public.reviews;
CREATE TRIGGER trg_notify_on_review AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_review();

-- Request completed + karma earned notifications (extend existing)
CREATE OR REPLACE FUNCTION public.award_karma_on_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Notify requester
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.requester_id, 'request_completed',
      'Your request was marked completed',
      LEFT(COALESCE(NEW.title,''), 140),
      '/requests/' || NEW.id);
    -- Award + notify helper
    IF NEW.helper_id IS NOT NULL AND NEW.helper_id <> NEW.requester_id THEN
      UPDATE public.profiles SET karma_points = karma_points + 10 WHERE id = NEW.helper_id;
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (NEW.helper_id, 'karma',
        'You earned +10 karma for helping',
        LEFT(COALESCE(NEW.title,''), 140),
        '/requests/' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.award_karma_on_complete() FROM PUBLIC, anon, authenticated;
