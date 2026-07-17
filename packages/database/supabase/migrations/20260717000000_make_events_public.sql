-- Drop the authenticated-only SELECT policy
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;

-- Create a policy that allows everyone (authenticated and anonymous) to view events
CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT
USING (true);
