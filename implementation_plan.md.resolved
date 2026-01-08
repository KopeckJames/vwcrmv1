# CRM Foundation - Implementation Plan

A modern, customizable CRM application inspired by EspoCRM, built with Next.js and featuring full integration with Google Workspace, Outlook/Microsoft 365, Gemini AI, and advanced geolocation capabilities.

## User Review Required

> [!IMPORTANT]
> **API Keys Required**: You will need to provide API keys for:
> - Google Cloud (Calendar, OAuth)
> - Microsoft Azure (Outlook Calendar, OAuth)
> - Google Gemini AI
> - Mapbox (for mapping features)

> [!WARNING]
> **Database Choice**: This plan uses PostgreSQL with Prisma ORM. If you prefer a different database (MySQL, MongoDB), please let me know before I proceed.

### Questions for Clarification

1. **Geolocation Features**: You mentioned wanting geo-location features with custom details. Could you elaborate on the specific geolocation features you need? For example:
   - Lead/contact location visualization on maps?
   - Sales territory management?
   - Route optimization for field reps?
   - Geofencing/proximity alerts?
   - Address auto-complete?

2. **Authentication**: Do you want to support sign-in with Google/Microsoft accounts, or use a custom email/password authentication, or both?

3. **Deployment Target**: Where do you plan to deploy this? (Vercel, self-hosted, Docker, etc.)

4. **Initial Entities**: Besides the core CRM entities (Contacts, Accounts, Leads, Opportunities, Tasks), are there any specific custom entities you want from the start?

---

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js App Router)"]
        UI[React Components]
        Pages[Pages & Layouts]
        Hooks[Custom Hooks]
    end
    
    subgraph Backend["Backend (Next.js API Routes)"]
        API[REST API Routes]
        Auth[NextAuth.js]
        AI[Gemini AI Service]
    end
    
    subgraph Integrations["External Integrations"]
        Google[Google Calendar API]
        Outlook[Microsoft Graph API]
        Gemini[Gemini AI API]
        Maps[Mapbox/Leaflet]
    end
    
    subgraph Database["Data Layer"]
        Prisma[Prisma ORM]
        PG[(PostgreSQL)]
    end
    
    UI --> API
    API --> Prisma
    Prisma --> PG
    API --> Google
    API --> Outlook
    API --> Gemini
    UI --> Maps
```

---

## Proposed Changes

### Core Application Structure

#### [NEW] [my-crm](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm)

Project structure:
```
my-crm/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── contacts/
│   │   │   ├── accounts/
│   │   │   ├── leads/
│   │   │   ├── opportunities/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── map/
│   │   │   └── ai-assistant/
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── forms/             # Form components
│   │   └── map/               # Map components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── google-calendar.ts # Google Calendar integration
│   │   ├── outlook-calendar.ts# Outlook Calendar integration
│   │   ├── gemini.ts          # Gemini AI integration
│   │   └── geocoding.ts       # Geocoding utilities
│   ├── hooks/
│   └── types/
├── public/
├── .env.local                 # Environment variables
├── package.json
└── tailwind.config.js
```

---

### Database Schema (Prisma)

#### [NEW] [schema.prisma](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm/prisma/schema.prisma)

Core entities inspired by EspoCRM:

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **User** | System users with authentication | email, name, role, avatar |
| **Contact** | Individual people | firstName, lastName, email, phone, accountId, address, coordinates |
| **Account** | Companies/Organizations | name, website, industry, billingAddress, coordinates |
| **Lead** | Potential customers | name, status, source, estimatedValue, assignedTo, coordinates |
| **Opportunity** | Sales opportunities | name, stage, amount, probability, expectedCloseDate |
| **Task** | Action items | title, status, priority, dueDate, assignedTo |
| **Activity** | Calls, meetings, emails | type, subject, dateTime, relatedTo |
| **CalendarEvent** | Synced calendar events | title, start, end, provider, externalId |

All location-enabled entities include:
- `address` (street, city, state, zip, country)
- `latitude` / `longitude` for map plotting

---

### Google Workspace Integration

#### [NEW] [google-calendar.ts](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm/src/lib/google-calendar.ts)

Features:
- **OAuth 2.0 authentication** via NextAuth.js with Google provider
- **Two-way calendar sync**: Events created in CRM appear in Google Calendar and vice versa
- **Meeting scheduling**: Create meetings with attendees, set reminders
- **Free/busy lookup**: Check availability before scheduling

```typescript
// API capabilities
- fetchCalendarEvents(startDate, endDate)
- createCalendarEvent(event)
- updateCalendarEvent(eventId, updates)
- deleteCalendarEvent(eventId)
- getFreeBusySlots(emails, startDate, endDate)
```

---

### Outlook/Microsoft 365 Integration

#### [NEW] [outlook-calendar.ts](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm/src/lib/outlook-calendar.ts)

Features:
- **OAuth 2.0 authentication** via NextAuth.js with Azure AD provider
- **Microsoft Graph API** for calendar operations
- **Two-way sync** with Outlook Calendar
- **Teams meeting integration** (optional)

```typescript
// API capabilities
- fetchOutlookEvents(startDate, endDate)
- createOutlookEvent(event)
- updateOutlookEvent(eventId, updates)
- deleteOutlookEvent(eventId)
- syncContactsFromOutlook()
```

---

### Gemini AI Integration

#### [NEW] [gemini.ts](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm/src/lib/gemini.ts)

AI-powered features:
- **Smart Lead Scoring**: Analyze lead data and suggest priority scores
- **Email Draft Generation**: Generate professional emails for leads/contacts
- **Meeting Summary**: Summarize meeting notes and extract action items
- **Data Enrichment**: Suggest missing contact/company information
- **Conversational Assistant**: Chat interface for CRM queries

```typescript
// AI capabilities
- generateEmailDraft(context, tone)
- scoreLead(leadData)
- summarizeMeeting(notes)
- enrichContactData(contact)
- answerCRMQuery(question, context)
```

---

### Geolocation & Mapping Features

#### [NEW] [map/](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm/src/components/map)

Using **Mapbox GL JS** with **React Map GL**:

| Feature | Description |
|---------|-------------|
| **Entity Map View** | Visualize contacts, leads, accounts on an interactive map |
| **Clustering** | Group nearby pins at lower zoom levels |
| **Status Coloring** | Different colors for lead status, opportunity stages |
| **Popup Details** | Click markers to see entity details |
| **Address Autocomplete** | Mapbox Geocoding for address entry |
| **Route Planning** | Optimize routes for visiting multiple locations |
| **Territory Management** | Draw/assign sales territories on the map |
| **Heatmaps** | Visualize lead density or sales by region |

#### [NEW] [geocoding.ts](file:///Users/jameskopeck/.gemini/antigravity/scratch/my-crm/src/lib/geocoding.ts)

- Auto-geocode addresses when entities are created/updated
- Reverse geocoding for mobile location capture
- Batch geocoding for CSV imports

---

### UI Components & Design

Using a modern design system with:
- **Tailwind CSS** for styling
- **Radix UI** primitives for accessibility
- **Framer Motion** for animations
- **Recharts** for analytics dashboards

Key UI Features:
- Dark/light mode toggle
- Responsive sidebar navigation
- Kanban board view for leads/opportunities
- Calendar view with drag-and-drop
- Quick search with keyboard shortcuts (Cmd+K)
- Toast notifications
- Modal forms for entity creation/editing

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | NextAuth.js 5 |
| **Styling** | Tailwind CSS |
| **UI Components** | Radix UI + Framer Motion |
| **Maps** | Mapbox GL JS / React Map GL |
| **AI** | Google Gemini API |
| **Calendar** | Google Calendar API + Microsoft Graph API |
| **Forms** | React Hook Form + Zod |

---

## Verification Plan

### Automated Tests
- Unit tests for API routes using Vitest
- Integration tests for database operations
- E2E tests for critical flows (login, create lead, schedule meeting) using Playwright

### Manual Verification
1. Create entities and verify they appear in list/map views
2. Connect Google Calendar and verify two-way sync
3. Connect Outlook Calendar and verify two-way sync
4. Test Gemini AI features (email generation, lead scoring)
5. Test map features (markers, clustering, route planning)
6. Test responsive design on mobile devices

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Project setup & auth | 1-2 hours |
| Database schema & core entities | 1-2 hours |
| Dashboard & entity CRUD | 2-3 hours |
| Google Calendar integration | 1-2 hours |
| Outlook Calendar integration | 1-2 hours |
| Gemini AI integration | 1 hour |
| Geolocation/mapping | 2-3 hours |
| Polish & testing | 1-2 hours |
| **Total** | **~10-15 hours** |

---

## Next Steps

Once you approve this plan, I will:

1. Initialize the Next.js project in `/Users/jameskopeck/.gemini/antigravity/scratch/my-crm`
2. Set up the database schema with Prisma
3. Implement authentication with NextAuth.js
4. Build the dashboard and core entity pages
5. Integrate Google and Outlook calendars
6. Add Gemini AI assistant
7. Implement mapping/geolocation features
8. Create a walkthrough demonstrating the completed application

Please review and let me know:
1. If the overall approach looks good
2. Your answers to the clarification questions above
3. Any features you want to add, remove, or prioritize
