-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function to automatically call generate-project-embeddings
CREATE OR REPLACE FUNCTION public.trigger_project_embedding()
RETURNS trigger AS $$
DECLARE
  v_headers JSONB;
  v_auth_header TEXT;
  v_host TEXT;
  v_url TEXT;
BEGIN
  -- Extract request headers set by PostgREST
  v_headers := COALESCE(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
  v_auth_header := v_headers->>'authorization';
  v_host := v_headers->>'host';

  -- If host is null, fallback to local Kong proxy in Supabase emulator environment
  IF v_host IS NULL THEN
    v_url := 'http://kong:8000/functions/v1/generate-project-embeddings';
  ELSE
    -- On live Supabase Cloud, construct URL using the request host
    v_url := 'https://' || v_host || '/functions/v1/generate-project-embeddings';
  END IF;

  -- Only trigger if authentication header is present (identifies the partner/company role)
  IF v_auth_header IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', v_auth_header
      ),
      body := jsonb_build_object('projectId', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution after insert on projects table
CREATE OR REPLACE TRIGGER on_project_created_generate_embeddings
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_project_embedding();
