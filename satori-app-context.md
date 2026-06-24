# Membership Database App — Full Context Document

> Use this document to give Claude full context about the app when generating use cases, feature ideas, or technical specifications.

---

## What Is This App?

The **Membership Database** is a full-stack web application purpose-built for managing a Buddhist/Dharma organization (Sangha). It tracks members, their spiritual progress, empowerments, events, centers, groups, and internal communications. It is an internal tool used by administrators, instructors, and members of the organization — not a public-facing product.

---

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build tool**: Vite
- **Routing**: TanStack Router (file-based)
- **Data fetching / caching**: TanStack Query (React Query)
- **Form validation**: React Hook Form + Zod
- **UI components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages

### Backend
- **Runtime**: Bun
- **Framework**: Hono (lightweight TypeScript HTTP framework)
- **ORM**: Kysely (type-safe SQL query builder)
- **Database**: PostgreSQL
- **Authentication**: better-auth (sessions, OTP, password reset)
- **Deployment**: Docker on Digital Ocean

### Monorepo
- **Tool**: Turborepo
- **Packages**: `apps/admin` (frontend), `apps/server` (backend), shared packages

### API
- REST API under `/api/*` prefix
- All routes are authenticated
- Role-based access enforced server-side

---

## Role System

There are 6 roles with progressively wider permissions:

| Role | Description |
|------|-------------|
| `sysadmin` | Full system access, can manage users and all data |
| `admin` | Organization-wide admin, manages members, events, empowerments |
| `krama_instructor` | Spiritual instructor, manages student progress through Mahakrama |
| `center_admin` | Manages members and events within their assigned center |
| `group_admin` | Manages members and events within their assigned group |
| `viewer` | Read-only member; can view events, register, check notifications |

---

## Feature Inventory

### 1. Members (Persons)

The core entity of the system. A "Person" represents any individual in the organization's orbit — members, guests, instructors, board members, etc.

**Fields tracked per person:**
- Name (first, middle, last), photo, gender, year of birth
- Contact: email, primary phone, secondary phone, Viber number
- Location: address, country, nationality
- Language preference, occupation, notes
- Refuge name, year of refuge (supports both BS/AD calendar types)
- Membership type: Life Time / Board Member / General Member / Honorary Member
- Membership card number, whether card has been issued
- Title: dharma_dhar / sahayak_dharmacharya / sahayak_samathacharya / khenpo / dharmacharya
- Person code (unique ID within the org)
- Assigned center
- Whether they are a Krama Instructor, and who their assigned instructor is
- Emergency contact (name, relationship, phone)
- Referred by (another person)
- Whether they have received a major empowerment
- Person type (configurable via `person-type-config`)

**Capabilities:**
- Full CRUD (create, edit, delete)
- Photo upload
- Search and filter by name, role, krama instructor status, center
- Relationship tracking (see Person Relationships below)
- Empowerment tracking (see Empowerments below)
- Mahakrama progress tracking (see Mahakrama below)
- Event registration history per person

---

### 2. Dashboard

Real-time KPI overview for admins.

**Metrics displayed:**
- Total persons in the system
- Total Krama Instructors
- Total Sangha members
- Total active events

---

### 3. Events

Manages formal religious ceremonies and events. Two specific types are supported:

**Event types:**
- `REFUGE` — Refuge Ceremony: tracks participant refuge names and completion status
- `BODHIPUSPANJALI` — Bodhipushpanjali ceremony: tracks whether participants have taken refuge and referral medium

**Fields:**
- Name, description, start date, end date
- Event type (Refuge / Bodhipushpanjali)
- Event group assignment
- Participant metadata (per-type structured JSON)

**Capabilities:**
- CRUD events
- Add/remove participants from events
- Track participant-specific metadata (e.g. refuge name assigned during ceremony)
- Group events into Event Groups
- Print attendance badges for events or entire event groups
- Viewers can register themselves for events and see their registration history
- Viewers can see if they are registered or disapproved for each event

---

### 4. Groups

Organizational sub-units below the center level. Members, events, and notifications can be scoped to a group.

**Capabilities:**
- CRUD groups
- Assign members to groups
- Scope events to a group
- Group-level notification targeting

---

### 5. Centers

Geographic or organizational locations (e.g., a city center or retreat center). Members and events belong to centers.

**Capabilities:**
- CRUD centers (name, description)
- Assign members to centers
- center_admin role is scoped to their center
- Center-level notification targeting

---

### 6. Gurus

A simple registry of spiritual teachers referenced in empowerment records.

**Fields:** Name only (plus audit fields)

**Capabilities:**
- CRUD gurus
- Referenced when recording person empowerments

---

### 7. Empowerments

A catalog of Buddhist empowerments, transmissions, and teachings that members can receive.

**Fields:**
- Name
- Type: Sutra / Tantra
- Class: Kriyā Tantra / Charyā Tantra / Yoga Tantra / Anuttarayoga Tantra
- Form: Wang (empowerment) / Lung (reading transmission) / Tri (oral instructions)
- Description, prerequisites
- Whether it is a major empowerment (boolean)

**Capabilities:**
- CRUD empowerment catalog entries
- Link empowerments to individual persons (Person Empowerments)

---

### 8. Person Empowerments

Tracks which empowerments a specific person has received and from which guru.

**Fields per record:**
- Person, Empowerment, Guru
- Start date, end date

**Capabilities:**
- Record empowerment receipt for a person
- View full empowerment history per person
- `hasMajorEmpowerment` flag on Person is derived from this

---

### 9. Mahakrama (Spiritual Path Tracking)

The most specialized feature. Tracks each member's progress through a structured spiritual curriculum of sequential steps.

**Step definition fields:**
- Sequence number (ordering)
- Group ID + Group Name (curriculum grouping)
- Step ID + Step Name
- Description
- Attached documents (multi-language PDF/file support per step)

**Progress history fields per person:**
- Which step they are on
- Status: `current` / `completed` / `requested_completion`
- Start date, end date
- Assigned Mahakrama instructor
- Completion notes (from instructor)
- Student notes

**Workflow:**
1. Instructor starts a student on a step
2. Student can request completion
3. Instructor marks step as completed (optionally sending documents to student)
4. Student progresses to the next step

**Capabilities:**
- Define and manage the step catalog
- Upload documents per step (multi-language)
- Start students on steps
- Track and update progress
- Request/approve step completion
- Send documents to students on completion

---

### 10. Notifications

An internal broadcast and inbox system for the organization.

**Admin side — sending notifications:**
- Create notifications with title and message
- Target: All members / Specific groups / Specific centers / Specific individual users / My centers / My groups
- Role-based targeting UI (instructors see my-groups/my-centers options)
- Notification management table (view sent notifications)

**Member side — inbox:**
- View received notifications with unread count
- Mark individual notifications as read (is_acknowledged flag)
- Mark all as read

---

### 11. Registrations

An intake pipeline for onboarding new members. Handles importing raw signup data and converting it into full Person records.

**Capabilities:**
- List all incoming registrations
- Dynamically generated table columns (adapts to whatever fields exist in the registration data)
- Import from CSV
- Convert a registration into a Person record

---

### 12. Person Relationships

Tracks family/social relationships between persons in the system.

**Relationship types supported:**
parent, child, spouse, sibling, grandparent, grandchild, guardian, ward, partner, relative, other

**Capabilities:**
- Add/edit/delete relationships between two persons
- View all relationships for a given person

---

### 13. Users (System Accounts)

Manages login accounts separate from Person records. A user account is linked to a Person record.

**Capabilities:**
- List active users
- View deleted/deactivated users (toggle)
- Manage user roles and linked person records

---

### 14. Settings

Per-user settings accessible to all roles.

**Sections:**
- Profile (name, bio, etc.)
- Account (email, password)
- Appearance (theme: light/dark)
- Notifications (notification preferences)
- Display settings

---

### 15. Chats (Placeholder)

A chat UI exists in the navigation with a mock conversation list and message thread interface. Currently uses static/fake data — real-time messaging is not yet implemented.

---

### 16. Tasks (Placeholder)

A task list UI exists using static mock data. Not yet connected to a backend. Likely intended for admin to-do / follow-up task tracking.

---

## API Routes Summary

All routes are under `/api/`:

| Route | Description |
|-------|-------------|
| `/api/auth/*` | Authentication (sign-in, sign-up, OTP, password reset) |
| `/api/user` | User account management |
| `/api/person` | Member CRUD and queries |
| `/api/group` | Group management |
| `/api/event` | Event management and participant tracking |
| `/api/center` | Center management |
| `/api/empowerment` | Empowerment catalog |
| `/api/guru` | Guru registry |
| `/api/person-empowerment` | Person ↔ Empowerment linking |
| `/api/mahakrama` | Spiritual path steps and progress history |
| `/api/person-relationship` | Person ↔ Person relationship tracking |
| `/api/registration` | Registration intake and conversion |
| `/api/event-groups` | Event group management |
| `/api/notification` | Notification creation and inbox |
| `/api/dashboard` | Aggregated KPI data |
| `/api/person-type-config` | Configurable person type definitions |

---

## Key Domain Concepts

- **Sangha**: The Buddhist community/congregation this app serves
- **Refuge**: A formal ceremony marking someone becoming a Buddhist. Tracked as an event type and on the Person record (refuge name, year of refuge)
- **Krama**: The structured spiritual curriculum a member progresses through (managed via Mahakrama)
- **Krama Instructor**: A qualified teacher assigned to guide a student through the Krama. Each student has one assigned instructor.
- **Empowerment (Wang/Lung/Tri)**: Formal transmission of teachings from a guru to a student — tracked per person
- **Guru**: A spiritual teacher who gives empowerments
- **Person Type**: Configurable member categories (e.g., visitor, student, member, teacher) — managed via person-type-config
- **BS/AD Calendar**: The app supports both Bikram Sambat (Nepali calendar) and Anno Domini (Gregorian) for date fields like year of refuge

---

## Current Limitations / Known Gaps

- **Chats**: UI exists but uses fake data — real-time messaging is not implemented
- **Tasks**: Static mock data — not connected to any backend
- **Reporting**: No built-in reporting or export features beyond badge printing
- **Audit trail**: Audit fields (created_by, last_updated_by) exist on all entities but there is no audit log UI
- **Bulk operations**: Limited bulk actions (badge printing for event groups exists; general bulk edits are not available)
- **Mobile app**: No native mobile app; web app is desktop-first
- **Public portal**: No public-facing member self-service portal; all access is through the admin app with a viewer role
