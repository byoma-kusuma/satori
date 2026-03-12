-- migrate:up

CREATE TYPE public.notification_target_type AS ENUM ('all', 'groups', 'centers');

CREATE TABLE public.notification (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  target_type public.notification_target_type NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by varchar(255) NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_notification_updated_at
  BEFORE UPDATE ON public.notification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_snake();

CREATE TABLE public.notification_target_group (
  notification_id uuid NOT NULL REFERENCES public.notification(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.group(id) ON DELETE CASCADE,
  PRIMARY KEY (notification_id, group_id)
);

CREATE TABLE public.notification_target_center (
  notification_id uuid NOT NULL REFERENCES public.notification(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.center(id) ON DELETE CASCADE,
  PRIMARY KEY (notification_id, center_id)
);

CREATE TABLE public.notification_attachment (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  notification_id uuid NOT NULL REFERENCES public.notification(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text NOT NULL,
  file_data bytea NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.notification_acknowledgement (
  notification_id uuid NOT NULL REFERENCES public.notification(id) ON DELETE CASCADE,
  user_id varchar(255) NOT NULL,
  acknowledged_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX idx_notification_is_active ON public.notification(is_active);
CREATE INDEX idx_notification_target_group_group_id ON public.notification_target_group(group_id);
CREATE INDEX idx_notification_target_center_center_id ON public.notification_target_center(center_id);
CREATE INDEX idx_notification_acknowledgement_user_id ON public.notification_acknowledgement(user_id);

-- migrate:down

DROP TABLE IF EXISTS public.notification_acknowledgement;
DROP TABLE IF EXISTS public.notification_attachment;
DROP TABLE IF EXISTS public.notification_target_center;
DROP TABLE IF EXISTS public.notification_target_group;
DROP TABLE IF EXISTS public.notification;
DROP TYPE IF EXISTS public.notification_target_type;
