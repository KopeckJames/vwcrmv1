# Custom CRM Platform Development

## Project Setup
- [x] Initialize Next.js project with TypeScript, Tailwind CSS, and essential dependencies
- [x] Install all required packages (Prisma, NextAuth, Mapbox, Gemini, Radix UI, etc.)
- [x] Configure Prisma with PostgreSQL adapter for Prisma 7

## Database Schema
- [x] Define core CRM entities (Contacts, Accounts, Leads, Opportunities, Tasks)
- [x] Add Activity model for generic activity tracking
- [x] Add DoorActivity model for door-to-door sales logging
- [x] Add CalendarEvent model for calendar integration
- [x] Add Territory model for sales territory management
- [x] Configure NextAuth.js models (User, Account, Session, VerificationToken)

## Authentication
- [x] Configure NextAuth.js v5 with Google OAuth provider
- [x] Include Google Calendar API scopes
- [x] Create login page with Google sign-in button

## UI Components
- [x] Create Button, Card, Input, Label, Textarea components
- [x] Create Dialog, Select, Badge, Skeleton, Avatar components
- [x] Set up utility functions (cn, formatters)

## Dashboard Layout
- [x] Create Sidebar with navigation and user profile
- [x] Create Header component
- [x] Create dashboard layout with authentication check

## CRM Pages
- [x] Dashboard home page with stats and quick actions
- [x] Leads listing page with status badges
- [x] Lead creation form
- [x] Contacts listing page
- [x] Accounts listing page with company cards
- [x] Opportunities listing page with pipeline stages
- [x] Tasks listing page with status and priority
- [x] Settings page with integration status

## Door Activity Feature
- [x] Door activity API routes
- [x] Door activity listing page grouped by date
- [x] Door activity logging form with geolocation capture

## Map & Geolocation Cleanup
- [x] Remove Mapbox GL and all associated dependencies
- [x] Switch reverse geocoding to Nominatim (OSM)
- [x] Ensure CRM Map uses Leaflet with OSM tiles

## Build & Verification
- [ ] Verify address resolution with Nominatim
- [ ] Fix TypeScript type issues across all pages
- [x] Configure Prisma 7 with PostgreSQL adapter
- [ ] Verify production build succeeds
