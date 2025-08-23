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
-- Name: event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type AS ENUM (
    'REFUGE',
    'BODHIPUSPANJALI'
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
-- Name: event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "startDate" timestamp with time zone NOT NULL,
    "endDate" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL,
    type public.event_type NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
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
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


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
-- Name: idx_event_createdby; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_createdby ON public.event USING btree (split_part("createdBy", '#'::text, 2));


--
-- Name: idx_event_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_dates ON public.event USING btree ("startDate", "endDate");


--
-- Name: idx_event_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_name ON public.event USING btree (name);


--
-- Name: idx_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_type ON public.event USING btree (type);


--
-- Name: idx_event_updatedby; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_updatedby ON public.event USING btree (split_part("lastUpdatedBy", '#'::text, 2));


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
-- Name: event update_event_updatedat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_updatedat BEFORE UPDATE ON public.event FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
    ('20250708084043');
