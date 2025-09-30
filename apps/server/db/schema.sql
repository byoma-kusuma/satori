SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: center_location; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.center_location AS ENUM (
    'Nepal',
    'USA',
    'Australia',
    'UK'
);


--
-- Name: event_registration_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_registration_mode AS ENUM (
    'PRE_REGISTRATION',
    'WALK_IN'
);


--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'CLOSED'
);


--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender_type AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);


--
-- Name: person_title; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.person_title AS ENUM (
    'dharma_dhar',
    'sahayak_dharmacharya',
    'sahayak_samathacharya'
);


--
-- Name: person_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.person_type AS ENUM (
    'interested',
    'contact',
    'sangha_member',
    'new_inquiry',
    'attended_orientation'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column_snake(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column_snake() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp without time zone,
    "refreshTokenExpiresAt" timestamp without time zone,
    scope text,
    password text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


--
-- Name: event_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_category (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    requires_full_attendance boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    registration_mode public.event_registration_mode NOT NULL,
    status public.event_status DEFAULT 'ACTIVE'::public.event_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text NOT NULL,
    last_updated_by text NOT NULL,
    category_id uuid NOT NULL,
    closed_at timestamp with time zone,
    closed_by text,
    empowerment_id uuid,
    guru_id uuid,
    CONSTRAINT event_date_range CHECK ((end_date >= start_date))
);


--
-- Name: event_attendee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendee (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid NOT NULL,
    person_id uuid NOT NULL,
    registration_mode public.event_registration_mode NOT NULL,
    registered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    registered_by text NOT NULL,
    is_cancelled boolean DEFAULT false NOT NULL,
    notes text,
    received_empowerment boolean DEFAULT false NOT NULL,
    empowerment_record_id uuid
);


--
-- Name: event_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendance (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_attendee_id uuid NOT NULL,
    event_day_id uuid NOT NULL,
    checked_in_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    checked_in_by text NOT NULL
);


--
-- Name: event_day; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_day (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid NOT NULL,
    day_number integer NOT NULL,
    event_date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_day_number_check CHECK ((day_number > 0))
);


--
-- Name: group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."group" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL
);


--
-- Name: person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    address text NOT NULL,
    "emailId" character varying(255),
    "phoneNumber" character varying(20),
    "yearOfBirth" integer,
    photo text,
    gender public.gender_type,
    refugee boolean NOT NULL,
    center public.center_location NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL,
    type public.person_type DEFAULT 'interested'::public.person_type NOT NULL,
    country character varying(100),
    nationality character varying(100),
    "languagePreference" character varying(50),
    "refugeName" character varying(100),
    "yearOfRefuge" integer,
    title public.person_title,
    "membershipStatus" character varying(50),
    "hasMembershipCard" boolean,
    CONSTRAINT "person_yearOfBirth_check" CHECK (("yearOfBirth" > 1900)),
    CONSTRAINT person_yearofrefuge_check CHECK ((("yearOfRefuge" IS NULL) OR ("yearOfRefuge" > 1900)))
);


--
-- Name: COLUMN person.country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.country IS 'Country of residence';


--
-- Name: COLUMN person.nationality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.nationality IS 'Nationality of the person';


--
-- Name: COLUMN person."languagePreference"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."languagePreference" IS 'Preferred language for communication';


--
-- Name: COLUMN person."refugeName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."refugeName" IS 'Dharma name given during refuge ceremony (for Sangha members)';


--
-- Name: COLUMN person."yearOfRefuge"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."yearOfRefuge" IS 'Year when refuge was taken (for Sangha members)';


--
-- Name: COLUMN person.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.title IS 'Dharma title for Sangha members';


--
-- Name: COLUMN person."membershipStatus"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."membershipStatus" IS 'Current membership status (for Sangha members)';


--
-- Name: COLUMN person."hasMembershipCard"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."hasMembershipCard" IS 'Whether the person has a membership card (for Sangha members)';


--
-- Name: person_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_group (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "personId" uuid NOT NULL,
    "groupId" uuid NOT NULL,
    "joinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "addedBy" text NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone
);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: event_category event_category_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_category
    ADD CONSTRAINT event_category_code_key UNIQUE (code);


--
-- Name: event_category event_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_category
    ADD CONSTRAINT event_category_pkey PRIMARY KEY (id);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


--
-- Name: event_attendance event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_pkey PRIMARY KEY (id);


--
-- Name: event_attendance event_attendance_unique_attendee_day; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_unique_attendee_day UNIQUE (event_attendee_id, event_day_id);


--
-- Name: event_attendee event_attendee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendee
    ADD CONSTRAINT event_attendee_pkey PRIMARY KEY (id);


--
-- Name: event_attendee event_attendee_unique_person; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendee
    ADD CONSTRAINT event_attendee_unique_person UNIQUE (event_id, person_id);


--
-- Name: event_day event_day_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_day
    ADD CONSTRAINT event_day_pkey PRIMARY KEY (id);


--
-- Name: event_day event_day_unique_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_day
    ADD CONSTRAINT event_day_unique_date UNIQUE (event_id, event_date);


--
-- Name: event_day event_day_unique_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_day
    ADD CONSTRAINT event_day_unique_number UNIQUE (event_id, day_number);


--
-- Name: group group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."group"
    ADD CONSTRAINT group_pkey PRIMARY KEY (id);


--
-- Name: person_group person_group_personId_groupId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_group
    ADD CONSTRAINT "person_group_personId_groupId_key" UNIQUE ("personId", "groupId");


--
-- Name: person_group person_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_group
    ADD CONSTRAINT person_group_pkey PRIMARY KEY (id);


--
-- Name: person person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: idx_event_attendance_attendee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_attendee_id ON public.event_attendance USING btree (event_attendee_id);


--
-- Name: idx_event_attendance_day_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_day_id ON public.event_attendance USING btree (event_day_id);


--
-- Name: idx_event_attendee_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendee_event_id ON public.event_attendee USING btree (event_id);


--
-- Name: idx_event_attendee_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendee_person_id ON public.event_attendee USING btree (person_id);


--
-- Name: idx_event_attendee_registration_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendee_registration_mode ON public.event_attendee USING btree (registration_mode);


--
-- Name: idx_event_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_category_id ON public.event USING btree (category_id);


--
-- Name: idx_event_day_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_day_date ON public.event_day USING btree (event_date);


--
-- Name: idx_event_day_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_day_event_id ON public.event_day USING btree (event_id);


--
-- Name: idx_event_registration_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registration_mode ON public.event USING btree (registration_mode);


--
-- Name: idx_event_start_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_start_end ON public.event USING btree (start_date, end_date);


--
-- Name: idx_event_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_status ON public.event USING btree (status);


--
-- Name: idx_group_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_name ON public."group" USING btree (name);


--
-- Name: idx_person_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_center ON public.person USING btree (center);


--
-- Name: idx_person_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_country ON public.person USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: idx_person_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_created_by ON public.person USING btree (split_part("createdBy", '#'::text, 2));


--
-- Name: idx_person_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_email ON public.person USING btree ("emailId") WHERE ("emailId" IS NOT NULL);


--
-- Name: idx_person_group_added_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_group_added_by ON public.person_group USING btree (split_part("addedBy", '#'::text, 2));


--
-- Name: idx_person_group_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_group_group_id ON public.person_group USING btree ("groupId");


--
-- Name: idx_person_group_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_group_person_id ON public.person_group USING btree ("personId");


--
-- Name: idx_person_language_pref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_language_pref ON public.person USING btree ("languagePreference") WHERE ("languagePreference" IS NOT NULL);


--
-- Name: idx_person_membership_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_membership_card ON public.person USING btree ("hasMembershipCard") WHERE ("hasMembershipCard" IS NOT NULL);


--
-- Name: idx_person_names; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_names ON public.person USING btree ("firstName", "lastName");


--
-- Name: idx_person_nationality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_nationality ON public.person USING btree (nationality) WHERE (nationality IS NOT NULL);


--
-- Name: idx_person_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_phone ON public.person USING btree ("phoneNumber") WHERE ("phoneNumber" IS NOT NULL);


--
-- Name: idx_person_refugee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_refugee ON public.person USING btree (refugee);


--
-- Name: idx_person_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_title ON public.person USING btree (title) WHERE (title IS NOT NULL);


--
-- Name: idx_person_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_type ON public.person USING btree (type);


--
-- Name: idx_person_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_updated_by ON public.person USING btree (split_part("lastUpdatedBy", '#'::text, 2));


--
-- Name: event update_event_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON public.event FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: event_category update_event_category_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_category_updated_at BEFORE UPDATE ON public.event_category FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: group update_group_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_group_updated_at BEFORE UPDATE ON public."group" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: person update_person_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_person_updated_at BEFORE UPDATE ON public.person FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: event event_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.event_category(id);


--
-- Name: event event_empowerment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_empowerment_id_fkey FOREIGN KEY (empowerment_id) REFERENCES public.empowerment(id);


--
-- Name: event event_guru_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_guru_id_fkey FOREIGN KEY (guru_id) REFERENCES public.guru(id);


--
-- Name: event_attendance event_attendance_event_attendee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_attendee_id_fkey FOREIGN KEY (event_attendee_id) REFERENCES public.event_attendee(id) ON DELETE CASCADE;


--
-- Name: event_attendance event_attendance_event_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_day_id_fkey FOREIGN KEY (event_day_id) REFERENCES public.event_day(id) ON DELETE CASCADE;


--
-- Name: event_attendee event_attendee_empowerment_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendee
    ADD CONSTRAINT event_attendee_empowerment_record_id_fkey FOREIGN KEY (empowerment_record_id) REFERENCES public.person_empowerment(id);


--
-- Name: event_attendee event_attendee_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendee
    ADD CONSTRAINT event_attendee_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: event_attendee event_attendee_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendee
    ADD CONSTRAINT event_attendee_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id);


--
-- Name: event_day event_day_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_day
    ADD CONSTRAINT event_day_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: person_group fk_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_group
    ADD CONSTRAINT fk_group FOREIGN KEY ("groupId") REFERENCES public."group"(id) ON DELETE CASCADE;


--
-- Name: person_group fk_person; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_group
    ADD CONSTRAINT fk_person FOREIGN KEY ("personId") REFERENCES public.person(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250218032240'),
    ('20250303000000'),
    ('20250311000000'),
    ('20250317213500'),
    ('20250708084043'),
    ('20251001000000');
