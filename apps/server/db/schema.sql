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
-- Name: membership_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.membership_type AS ENUM (
    'Life Time',
    'Board Member',
    'General Member',
    'Honorary Member'
);


--
-- Name: person_title; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.person_title AS ENUM (
    'dharma_dhar',
    'sahayak_dharmacharya',
    'sahayak_samathacharya',
    'khenpo',
    'dharmacharya'
);


--
-- Name: person_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.person_type AS ENUM (
    'interested',
    'contact',
    'sangha_member',
    'attended_orientation'
);


--
-- Name: registration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.registration_status AS ENUM (
    'new',
    'complete',
    'invalid'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'krama_instructor',
    'viewer',
    'sysadmin'
);


--
-- Name: TYPE user_role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.user_role IS 'User roles: sysadmin (system administrator), admin (administrator), krama_instructor (krama instructor), viewer (read-only)';


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
-- Name: center; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.center (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    address text,
    country text,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: center_person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.center_person (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    center_id uuid NOT NULL,
    person_id uuid NOT NULL,
    "position" text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: empowerment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empowerment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    class character varying(50),
    description text,
    prerequisites text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(255) NOT NULL,
    last_updated_by character varying(255) NOT NULL,
    type text,
    form text,
    major_empowerment boolean DEFAULT false NOT NULL,
    CONSTRAINT empowerment_class_check CHECK (((class)::text = ANY ((ARRAY['Kriyā Tantra'::character varying, 'Charyā Tantra'::character varying, 'Yoga Tantra'::character varying, 'Anuttarayoga Tantra'::character varying])::text[])))
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
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    event_group_id uuid,
    requires_full_attendance boolean,
    CONSTRAINT event_date_range CHECK ((end_date >= start_date))
);


--
-- Name: COLUMN event.requires_full_attendance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.requires_full_attendance IS 'Overrides the category default when set. NULL means use category default.';


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
    empowerment_record_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT event_attendee_empowerment_record CHECK ((((received_empowerment = false) AND (empowerment_record_id IS NULL)) OR ((received_empowerment = true) AND (empowerment_record_id IS NOT NULL))))
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
-- Name: event_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_group (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text
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
-- Name: guru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guru (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "guruName" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL
);


--
-- Name: mahakrama_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mahakrama_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    mahakrama_step_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    mahakrama_instructor_id uuid,
    completion_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(255) NOT NULL,
    last_updated_by character varying(255) NOT NULL,
    CONSTRAINT mahakrama_history_status_check CHECK (((status)::text = ANY ((ARRAY['current'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: mahakrama_step; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mahakrama_step (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sequence_number double precision NOT NULL,
    group_id character varying(100) NOT NULL,
    group_name character varying(255) NOT NULL,
    step_id character varying(100) NOT NULL,
    step_name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(255) NOT NULL,
    last_updated_by character varying(255) NOT NULL
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
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL,
    "referredBy" character varying(255),
    "emergencyContactName" character varying(100),
    "emergencyContactRelationship" character varying(50),
    "emergencyContactPhone" character varying(20),
    type public.person_type DEFAULT 'interested'::public.person_type NOT NULL,
    country character varying(100),
    nationality character varying(100),
    "languagePreference" character varying(50),
    "refugeName" character varying(100),
    "yearOfRefuge" integer,
    title public.person_title,
    "hasMembershipCard" boolean,
    "middleName" character varying(100),
    "primaryPhone" character varying(20),
    "secondaryPhone" character varying(20),
    occupation character varying(100),
    notes text,
    "membershipType" public.membership_type,
    "membershipCardNumber" character varying(255),
    "yearOfRefugeCalendarType" character varying(2),
    is_krama_instructor boolean DEFAULT false,
    krama_instructor_person_id uuid,
    "personCode" character varying(6),
    center_id uuid,
    viber_number character varying(50),
    CONSTRAINT check_year_of_refuge_calendar_type CHECK ((("yearOfRefugeCalendarType")::text = ANY ((ARRAY['BS'::character varying, 'AD'::character varying])::text[]))),
    CONSTRAINT "person_yearOfBirth_check" CHECK (("yearOfBirth" > 1900)),
    CONSTRAINT person_yearofrefuge_check CHECK ((("yearOfRefuge" IS NULL) OR ("yearOfRefuge" > 1900)))
);


--
-- Name: COLUMN person."referredBy"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."referredBy" IS 'Free form text field indicating who referred this person';


--
-- Name: COLUMN person."emergencyContactName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."emergencyContactName" IS 'Name of emergency contact person';


--
-- Name: COLUMN person."emergencyContactRelationship"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."emergencyContactRelationship" IS 'Relationship to the emergency contact (e.g., spouse, parent, sibling)';


--
-- Name: COLUMN person."emergencyContactPhone"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."emergencyContactPhone" IS 'Phone number of emergency contact person';


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
-- Name: COLUMN person."hasMembershipCard"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."hasMembershipCard" IS 'Whether the person has a membership card (for Sangha members)';


--
-- Name: COLUMN person."middleName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."middleName" IS 'Middle name of the person';


--
-- Name: COLUMN person."primaryPhone"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."primaryPhone" IS 'Primary phone number of the person';


--
-- Name: COLUMN person."secondaryPhone"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."secondaryPhone" IS 'Secondary phone number of the person';


--
-- Name: COLUMN person.occupation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.occupation IS 'Occupation of the person';


--
-- Name: COLUMN person.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.notes IS 'Additional notes or comments about the person';


--
-- Name: COLUMN person."membershipType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."membershipType" IS 'Type of membership for Sangha members';


--
-- Name: COLUMN person."membershipCardNumber"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."membershipCardNumber" IS 'Membership card number for Sangha members';


--
-- Name: COLUMN person."yearOfRefugeCalendarType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person."yearOfRefugeCalendarType" IS 'Calendar type for year of refuge (BS or AD)';


--
-- Name: person_empowerment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_empowerment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empowerment_id uuid NOT NULL,
    person_id uuid NOT NULL,
    guru_id uuid,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(255) NOT NULL,
    last_updated_by character varying(255) NOT NULL
);


--
-- Name: COLUMN person_empowerment.guru_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person_empowerment.guru_id IS 'Guru who gave the empowerment (optional)';


--
-- Name: COLUMN person_empowerment.start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person_empowerment.start_date IS 'Start date of the empowerment (optional)';


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
-- Name: person_relationship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_relationship (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    related_person_id uuid NOT NULL,
    relationship_type character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(255) NOT NULL,
    last_updated_by character varying(255) NOT NULL,
    CONSTRAINT person_relationship_not_self CHECK ((person_id <> related_person_id))
);


--
-- Name: registration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registration (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    src_timestamp timestamp with time zone,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    phone character varying(40),
    email character varying(255),
    address text,
    country character varying(100),
    gender public.gender_type,
    previously_attended_camp boolean,
    krama_instructor_text text,
    empowerment_text text,
    session_text text,
    status public.registration_status DEFAULT 'new'::public.registration_status NOT NULL,
    invalid_reason text,
    status_updated_at timestamp with time zone,
    status_updated_by text,
    imported_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    imported_by text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    import_batch_id uuid,
    raw_data jsonb,
    viber_number character varying(40)
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
    "updatedAt" timestamp without time zone NOT NULL,
    role public.user_role DEFAULT 'viewer'::public.user_role NOT NULL,
    person_id uuid,
    "deletedAt" timestamp without time zone
);


--
-- Name: COLUMN "user".role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."user".role IS 'Role of the user for access control (admin, krama_instructor, viewer)';


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
-- Name: center center_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center
    ADD CONSTRAINT center_name_key UNIQUE (name);


--
-- Name: center_person center_person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center_person
    ADD CONSTRAINT center_person_pkey PRIMARY KEY (id);


--
-- Name: center_person center_person_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center_person
    ADD CONSTRAINT center_person_unique UNIQUE (center_id, person_id);


--
-- Name: center center_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center
    ADD CONSTRAINT center_pkey PRIMARY KEY (id);


--
-- Name: empowerment empowerment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empowerment
    ADD CONSTRAINT empowerment_pkey PRIMARY KEY (id);


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
-- Name: event_group event_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_group
    ADD CONSTRAINT event_group_pkey PRIMARY KEY (id);


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
-- Name: guru guru_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru
    ADD CONSTRAINT guru_pkey PRIMARY KEY (id);


--
-- Name: mahakrama_history mahakrama_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_history
    ADD CONSTRAINT mahakrama_history_pkey PRIMARY KEY (id);


--
-- Name: mahakrama_step mahakrama_step_group_step_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_step
    ADD CONSTRAINT mahakrama_step_group_step_unique UNIQUE (group_id, step_id);


--
-- Name: mahakrama_step mahakrama_step_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_step
    ADD CONSTRAINT mahakrama_step_pkey PRIMARY KEY (id);


--
-- Name: mahakrama_step mahakrama_step_sequence_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_step
    ADD CONSTRAINT mahakrama_step_sequence_unique UNIQUE (sequence_number);


--
-- Name: person_empowerment person_empowerment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_empowerment
    ADD CONSTRAINT person_empowerment_pkey PRIMARY KEY (id);


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
-- Name: person person_personCode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT "person_personCode_key" UNIQUE ("personCode");


--
-- Name: person person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pkey PRIMARY KEY (id);


--
-- Name: person_relationship person_relationship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_relationship
    ADD CONSTRAINT person_relationship_pkey PRIMARY KEY (id);


--
-- Name: person_relationship person_relationship_unique_pair; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_relationship
    ADD CONSTRAINT person_relationship_unique_pair UNIQUE (person_id, related_person_id);


--
-- Name: registration registration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration
    ADD CONSTRAINT registration_pkey PRIMARY KEY (id);


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
-- Name: user user_person_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_person_unique UNIQUE (person_id);


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
-- Name: event_group_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX event_group_name_unique ON public.event_group USING btree (name);


--
-- Name: idx_center_person_center_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_center_person_center_id ON public.center_person USING btree (center_id);


--
-- Name: idx_center_person_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_center_person_person_id ON public.center_person USING btree (person_id);


--
-- Name: idx_empowerment_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empowerment_class ON public.empowerment USING btree (class);


--
-- Name: idx_empowerment_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empowerment_name ON public.empowerment USING btree (name);


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
-- Name: idx_event_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_group_id ON public.event USING btree (event_group_id);


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
-- Name: idx_guru_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guru_name ON public.guru USING btree ("guruName");


--
-- Name: idx_mahakrama_history_current; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mahakrama_history_current ON public.mahakrama_history USING btree (person_id) WHERE ((status)::text = 'current'::text);


--
-- Name: idx_mahakrama_history_person; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mahakrama_history_person ON public.mahakrama_history USING btree (person_id);


--
-- Name: idx_mahakrama_history_step; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mahakrama_history_step ON public.mahakrama_history USING btree (mahakrama_step_id);


--
-- Name: idx_mahakrama_step_group_step; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mahakrama_step_group_step ON public.mahakrama_step USING btree (group_id, step_id);


--
-- Name: idx_mahakrama_step_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mahakrama_step_sequence ON public.mahakrama_step USING btree (sequence_number);


--
-- Name: idx_person_center_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_center_id ON public.person USING btree (center_id);


--
-- Name: idx_person_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_code ON public.person USING btree ("personCode");


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
-- Name: idx_person_emergency_contact_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_emergency_contact_name ON public.person USING btree ("emergencyContactName") WHERE ("emergencyContactName" IS NOT NULL);


--
-- Name: idx_person_emergency_contact_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_emergency_contact_phone ON public.person USING btree ("emergencyContactPhone") WHERE ("emergencyContactPhone" IS NOT NULL);


--
-- Name: idx_person_empowerment_empowerment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_empowerment_empowerment_id ON public.person_empowerment USING btree (empowerment_id);


--
-- Name: idx_person_empowerment_guru_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_empowerment_guru_id ON public.person_empowerment USING btree (guru_id);


--
-- Name: idx_person_empowerment_person_empowerment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_empowerment_person_empowerment_id ON public.person_empowerment USING btree (person_id, empowerment_id);


--
-- Name: idx_person_empowerment_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_empowerment_person_id ON public.person_empowerment USING btree (person_id);


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
-- Name: idx_person_is_krama_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_is_krama_instructor ON public.person USING btree (is_krama_instructor);


--
-- Name: idx_person_krama_instructor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_krama_instructor_id ON public.person USING btree (krama_instructor_person_id);


--
-- Name: idx_person_language_pref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_language_pref ON public.person USING btree ("languagePreference") WHERE ("languagePreference" IS NOT NULL);


--
-- Name: idx_person_membership_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_membership_card ON public.person USING btree ("hasMembershipCard") WHERE ("hasMembershipCard" IS NOT NULL);


--
-- Name: idx_person_membership_card_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_membership_card_number ON public.person USING btree ("membershipCardNumber") WHERE ("membershipCardNumber" IS NOT NULL);


--
-- Name: idx_person_membership_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_membership_type ON public.person USING btree ("membershipType") WHERE ("membershipType" IS NOT NULL);


--
-- Name: idx_person_middle_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_middle_name ON public.person USING btree ("middleName") WHERE ("middleName" IS NOT NULL);


--
-- Name: idx_person_names; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_names ON public.person USING btree ("firstName", "lastName");


--
-- Name: idx_person_nationality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_nationality ON public.person USING btree (nationality) WHERE (nationality IS NOT NULL);


--
-- Name: idx_person_occupation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_occupation ON public.person USING btree (occupation) WHERE (occupation IS NOT NULL);


--
-- Name: idx_person_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_phone ON public.person USING btree ("phoneNumber") WHERE ("phoneNumber" IS NOT NULL);


--
-- Name: idx_person_primary_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_primary_phone ON public.person USING btree ("primaryPhone") WHERE ("primaryPhone" IS NOT NULL);


--
-- Name: idx_person_referred_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_referred_by ON public.person USING btree ("referredBy") WHERE ("referredBy" IS NOT NULL);


--
-- Name: idx_person_relationship_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_relationship_person_id ON public.person_relationship USING btree (person_id);


--
-- Name: idx_person_relationship_related_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_relationship_related_person_id ON public.person_relationship USING btree (related_person_id);


--
-- Name: idx_person_secondary_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_secondary_phone ON public.person USING btree ("secondaryPhone") WHERE ("secondaryPhone" IS NOT NULL);


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
-- Name: idx_person_year_of_refuge_calendar_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_year_of_refuge_calendar_type ON public.person USING btree ("yearOfRefugeCalendarType") WHERE ("yearOfRefugeCalendarType" IS NOT NULL);


--
-- Name: idx_registration_dupe_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_dupe_key ON public.registration USING btree (src_timestamp, lower(TRIM(BOTH FROM first_name)), lower(TRIM(BOTH FROM last_name)), COALESCE(TRIM(BOTH FROM phone), ''::text), COALESCE(lower(TRIM(BOTH FROM email)), ''::text));


--
-- Name: idx_registration_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_email ON public.registration USING btree (lower((email)::text)) WHERE (email IS NOT NULL);


--
-- Name: idx_registration_import_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_import_batch ON public.registration USING btree (import_batch_id);


--
-- Name: idx_registration_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_phone ON public.registration USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: idx_registration_raw_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_raw_data ON public.registration USING gin (raw_data);


--
-- Name: idx_registration_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_status ON public.registration USING btree (status);


--
-- Name: idx_user_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_person_id ON public."user" USING btree (person_id);


--
-- Name: idx_user_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role ON public."user" USING btree (role);


--
-- Name: center_person update_center_person_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_center_person_updated_at BEFORE UPDATE ON public.center_person FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: center update_center_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_center_updated_at BEFORE UPDATE ON public.center FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: event_category update_event_category_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_category_updated_at BEFORE UPDATE ON public.event_category FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: event_group update_event_group_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_group_updated_at BEFORE UPDATE ON public.event_group FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: event update_event_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON public.event FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_snake();


--
-- Name: group update_group_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_group_updated_at BEFORE UPDATE ON public."group" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: guru update_guru_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guru_updated_at BEFORE UPDATE ON public.guru FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: person update_person_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_person_updated_at BEFORE UPDATE ON public.person FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registration update_registration_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_registration_updated_at BEFORE UPDATE ON public.registration FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: center_person center_person_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center_person
    ADD CONSTRAINT center_person_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.center(id) ON DELETE CASCADE;


--
-- Name: center_person center_person_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center_person
    ADD CONSTRAINT center_person_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE;


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
-- Name: event event_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.event_category(id);


--
-- Name: event_day event_day_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_day
    ADD CONSTRAINT event_day_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: event event_empowerment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_empowerment_id_fkey FOREIGN KEY (empowerment_id) REFERENCES public.empowerment(id);


--
-- Name: event event_event_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_event_group_id_fkey FOREIGN KEY (event_group_id) REFERENCES public.event_group(id) ON DELETE RESTRICT;


--
-- Name: event event_guru_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_guru_id_fkey FOREIGN KEY (guru_id) REFERENCES public.guru(id);


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
-- Name: person fk_person_krama_instructor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT fk_person_krama_instructor FOREIGN KEY (krama_instructor_person_id) REFERENCES public.person(id) ON DELETE SET NULL;


--
-- Name: mahakrama_history mahakrama_history_mahakrama_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_history
    ADD CONSTRAINT mahakrama_history_mahakrama_instructor_id_fkey FOREIGN KEY (mahakrama_instructor_id) REFERENCES public.person(id);


--
-- Name: mahakrama_history mahakrama_history_mahakrama_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_history
    ADD CONSTRAINT mahakrama_history_mahakrama_step_id_fkey FOREIGN KEY (mahakrama_step_id) REFERENCES public.mahakrama_step(id);


--
-- Name: mahakrama_history mahakrama_history_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mahakrama_history
    ADD CONSTRAINT mahakrama_history_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE;


--
-- Name: person person_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.center(id) ON DELETE SET NULL;


--
-- Name: person_empowerment person_empowerment_empowerment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_empowerment
    ADD CONSTRAINT person_empowerment_empowerment_id_fkey FOREIGN KEY (empowerment_id) REFERENCES public.empowerment(id) ON DELETE RESTRICT;


--
-- Name: person_empowerment person_empowerment_guru_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_empowerment
    ADD CONSTRAINT person_empowerment_guru_id_fkey FOREIGN KEY (guru_id) REFERENCES public.guru(id) ON DELETE RESTRICT;


--
-- Name: person_empowerment person_empowerment_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_empowerment
    ADD CONSTRAINT person_empowerment_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE;


--
-- Name: person_relationship person_relationship_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_relationship
    ADD CONSTRAINT person_relationship_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE;


--
-- Name: person_relationship person_relationship_related_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_relationship
    ADD CONSTRAINT person_relationship_related_person_id_fkey FOREIGN KEY (related_person_id) REFERENCES public.person(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: user user_person_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_person_fk FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250120000001'),
    ('20250120000002'),
    ('20250218032240'),
    ('20250219000000'),
    ('20250219000001'),
    ('20250303000000'),
    ('20250311000000'),
    ('20250317213500'),
    ('20250708084043'),
    ('20250718000000'),
    ('20250718000001'),
    ('20250718000003'),
    ('20250718000004'),
    ('20250718000005'),
    ('20250718000006'),
    ('20250825000000'),
    ('20250914000000'),
    ('20250923140000'),
    ('20250923150000'),
    ('20250924000000'),
    ('20250924000001'),
    ('20251001000000'),
    ('20251002000000'),
    ('20251002000001'),
    ('20251002000002'),
    ('20251002000003'),
    ('20251002000004'),
    ('20251002000005'),
    ('20251002000006'),
    ('20251003000000'),
    ('20251004000000'),
    ('20251005000000'),
    ('20251005020000'),
    ('20251007000000'),
    ('20251013000000'),
    ('20251013000001'),
    ('20251015000000'),
    ('20251015001000'),
    ('20251015002000'),
    ('20251018083024'),
    ('20251020090000'),
    ('20251020091500'),
    ('20251022000000'),
    ('20251105000000');
