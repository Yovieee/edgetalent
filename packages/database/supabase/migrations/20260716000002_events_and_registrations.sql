-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    organizer TEXT NOT NULL,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT CHECK (category IN ('Hackathon', 'Webinar', 'Workshop', 'Networking', 'Pitch Night')) NOT NULL,
    capacity INTEGER,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_event_registration UNIQUE (event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events are viewable by authenticated users"
ON public.events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage events"
ON public.events FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Event Registrations policies
CREATE POLICY "Event registrations are viewable by registered user, event host, or admin"
ON public.event_registrations FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_registrations.event_id AND events.organizer_id = auth.uid()) OR
    public.is_admin()
);

CREATE POLICY "Users can register/RSVP for events"
ON public.event_registrations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their RSVP/registration"
ON public.event_registrations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Seed initial events
INSERT INTO public.events (title, description, content, event_date, location, organizer, category, capacity, link)
VALUES
(
  'EdgeTalent Tech Hackathon 2026',
  'A 48-hour virtual hackathon focused on building open-source AI and database tools for developer productivity.',
  'Join developers, designers, and innovators from around the world for a 48-hour sprint to build next-generation AI agents, pgvector integrations, and developer productivity tools. Top 3 teams win cash prizes, cloud credits, and direct introductions to venture capital partners. Hackathon participants get access to exclusive workshops and mentoring sessions hosted by industry experts.',
  '2026-08-15T09:00:00Z',
  'Virtual (Zoom / Discord)',
  'EdgeTalent Foundation',
  'Hackathon',
  200,
  'https://edgetalent.org/hackathon2026'
),
(
  'Building AI Agents with Gemini 2.5',
  'Deep-dive technical workshop on using Gemini models, prompt engineering, and function calling to build autonomous coding agents.',
  'In this hands-on workshop, you''ll learn how to build robust agentic coding tools using Google''s Gemini 2.5 models. We will cover tool definition, system instructions, function calling schemas, and error recovery patterns. Bring your laptop and your IDE — we will write code live!',
  '2026-07-25T14:00:00Z',
  'Virtual (Zoom)',
  'Google Developer Group',
  'Workshop',
  100,
  'https://gdg.community.dev/events/details/google-gdg-workshops/'
),
(
  'Tech Founders Pitch & Networking Night',
  'Connect with early-stage venture capital firms, angel investors, and fellow entrepreneurs in the ecosystem.',
  'Our monthly networking mixer returns! Startups can apply to present a 3-minute elevator pitch to a panel of local VCs and angel investors. Food and drinks are provided. Space is limited, so please RSVP early to reserve your spot.',
  '2026-08-05T18:30:00Z',
  'Silicon Alley Hub, Jakarta',
  'EdgeTalent Group',
  'Networking',
  75,
  'https://edgetalent.org/pitch-night'
);
