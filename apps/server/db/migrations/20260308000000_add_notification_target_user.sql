-- migrate:up

ALTER TYPE public.notification_target_type ADD VALUE 'users';

CREATE TABLE public.notification_target_user (
  notification_id uuid NOT NULL REFERENCES public.notification(id) ON DELETE CASCADE,
  user_id varchar(255) NOT NULL,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX idx_notification_target_user_user_id ON public.notification_target_user(user_id);

-- migrate:down

DROP TABLE IF EXISTS public.notification_target_user;
-- Note: PostgreSQL does not support removing enum values; the 'users' value remains.
