
-- ENUMS
CREATE TYPE public.user_role AS ENUM ('seeker', 'helper', 'both');
CREATE TYPE public.request_category AS ENUM ('education','medical','food','transport','technology','elder_care','child_care','jobs','donations','emergency','other');
CREATE TYPE public.urgency_level AS ENUM ('low','normal','high','emergency');
CREATE TYPE public.request_status AS ENUM ('open','accepted','completed','cancelled');
CREATE TYPE public.offer_status AS ENUM ('pending','accepted','declined','withdrawn');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  role public.user_role NOT NULL DEFAULT 'both',
  karma_points INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- HELP REQUESTS
CREATE TABLE public.help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.request_category NOT NULL DEFAULT 'other',
  urgency public.urgency_level NOT NULL DEFAULT 'normal',
  location TEXT DEFAULT '',
  image_url TEXT,
  budget NUMERIC(10,2),
  deadline TIMESTAMPTZ,
  status public.request_status NOT NULL DEFAULT 'open',
  helper_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.help_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests are viewable by everyone" ON public.help_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated can create requests" ON public.help_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Requester can update" ON public.help_requests FOR UPDATE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = helper_id);
CREATE POLICY "Requester can delete" ON public.help_requests FOR DELETE TO authenticated USING (auth.uid() = requester_id);

CREATE INDEX idx_requests_status ON public.help_requests(status);
CREATE INDEX idx_requests_category ON public.help_requests(category);

-- OFFERS
CREATE TABLE public.request_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status public.offer_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, helper_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_offers TO authenticated;
GRANT ALL ON public.request_offers TO service_role;
ALTER TABLE public.request_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers visible to request owner and helper" ON public.request_offers FOR SELECT TO authenticated USING (
  auth.uid() = helper_id OR auth.uid() = (SELECT requester_id FROM public.help_requests WHERE id = request_id)
);
CREATE POLICY "Helpers create their own offers" ON public.request_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = helper_id);
CREATE POLICY "Owner or helper update" ON public.request_offers FOR UPDATE TO authenticated USING (
  auth.uid() = helper_id OR auth.uid() = (SELECT requester_id FROM public.help_requests WHERE id = request_id)
);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their conversations" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send their messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver marks read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);
CREATE INDEX idx_msg_conversation ON public.messages(sender_id, receiver_id, created_at DESC);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, reviewer_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users write own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.help_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AWARD KARMA WHEN A REQUEST IS COMPLETED
CREATE OR REPLACE FUNCTION public.award_karma_on_complete() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.helper_id IS NOT NULL THEN
    UPDATE public.profiles SET karma_points = karma_points + 10 WHERE id = NEW.helper_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER requests_award_karma AFTER UPDATE ON public.help_requests FOR EACH ROW EXECUTE FUNCTION public.award_karma_on_complete();
