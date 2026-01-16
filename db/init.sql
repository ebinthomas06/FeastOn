--
-- PostgreSQL database dump
--

\restrict BY8lE66HejiEF30cM0k9aCzOjOuLOCgGEp89LdgY5EKFpUhJxAsTom5R0QKeJT9

-- Dumped from database version 17.7 (e429a59)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: event_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_slots (
    slot_id integer NOT NULL,
    event_id integer NOT NULL,
    floor character varying(20),
    time_start timestamp without time zone NOT NULL,
    time_end timestamp without time zone NOT NULL,
    counter integer,
    capacity integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: event_slots_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_slots_slot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_slots_slot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_slots_slot_id_seq OWNED BY public.event_slots.slot_id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    date date NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    registration_id integer NOT NULL,
    student_id integer NOT NULL,
    event_id integer NOT NULL,
    slot_id integer,
    qr_token character varying(64) NOT NULL,
    status character varying(20) DEFAULT 'registered'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    served_at timestamp without time zone
);


--
-- Name: registrations_registration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registrations_registration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registrations_registration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registrations_registration_id_seq OWNED BY public.registrations.registration_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(120) NOT NULL,
    role character varying(20) NOT NULL,
    batch character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    password character varying(255)
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: volunteer_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_actions (
    id integer NOT NULL,
    volunteer_id integer NOT NULL,
    registration_id integer NOT NULL,
    action character varying(50) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now(),
    floor character varying(50),
    counter character varying(50)
);


--
-- Name: volunteer_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.volunteer_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: volunteer_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.volunteer_actions_id_seq OWNED BY public.volunteer_actions.id;


--
-- Name: volunteers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteers (
    id integer NOT NULL,
    event_id integer,
    name character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_floor character varying(50),
    current_counter character varying(50),
    role character varying(20) DEFAULT 'volunteer'::character varying
);


--
-- Name: volunteers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.volunteers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: volunteers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.volunteers_id_seq OWNED BY public.volunteers.id;


--
-- Name: event_slots slot_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_slots ALTER COLUMN slot_id SET DEFAULT nextval('public.event_slots_slot_id_seq'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Name: registrations registration_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations ALTER COLUMN registration_id SET DEFAULT nextval('public.registrations_registration_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: volunteer_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_actions ALTER COLUMN id SET DEFAULT nextval('public.volunteer_actions_id_seq'::regclass);


--
-- Name: volunteers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers ALTER COLUMN id SET DEFAULT nextval('public.volunteers_id_seq'::regclass);


--
-- Name: event_slots event_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_slots
    ADD CONSTRAINT event_slots_pkey PRIMARY KEY (slot_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (registration_id);


--
-- Name: registrations registrations_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_qr_token_key UNIQUE (qr_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: volunteer_actions volunteer_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_actions
    ADD CONSTRAINT volunteer_actions_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_username_key UNIQUE (username);


--
-- Name: idx_event_slots_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_slots_event ON public.event_slots USING btree (event_id);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_date ON public.events USING btree (date);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_reg_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reg_event ON public.registrations USING btree (event_id);


--
-- Name: idx_reg_qr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reg_qr ON public.registrations USING btree (qr_token);


--
-- Name: idx_reg_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_reg_unique ON public.registrations USING btree (student_id, event_id);


--
-- Name: idx_registrations_event_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_event_status ON public.registrations USING btree (event_id, status);


--
-- Name: idx_registrations_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_qr_token ON public.registrations USING btree (qr_token);


--
-- Name: idx_slots_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slots_event ON public.event_slots USING btree (event_id);


--
-- Name: idx_slots_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slots_time ON public.event_slots USING btree (time_start, time_end);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_volunteer_actions_reg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_actions_reg ON public.volunteer_actions USING btree (registration_id);


--
-- Name: idx_volunteer_actions_vol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_actions_vol ON public.volunteer_actions USING btree (volunteer_id);


--
-- Name: idx_volunteer_actions_volunteer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_actions_volunteer ON public.volunteer_actions USING btree (volunteer_id);


--
-- Name: event_slots event_slots_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_slots
    ADD CONSTRAINT event_slots_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: registrations registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- Name: registrations registrations_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.event_slots(slot_id) ON DELETE SET NULL;


--
-- Name: registrations registrations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: volunteer_actions volunteer_actions_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_actions
    ADD CONSTRAINT volunteer_actions_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.registrations(registration_id) ON DELETE CASCADE;


--
-- Name: volunteers volunteers_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BY8lE66HejiEF30cM0k9aCzOjOuLOCgGEp89LdgY5EKFpUhJxAsTom5R0QKeJT9

