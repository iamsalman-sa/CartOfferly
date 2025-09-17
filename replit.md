# Overview

Premium Cart Rewards is a Shopify app that implements milestone-based cart rewards to increase average order value. The application provides a shopping cart experience with progressive reward unlocking, including free delivery and free product selections, designed to incentivize customers to add more items to their cart to reach reward thresholds.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Component Structure**: Modular component architecture with separate UI components and business logic components

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with dedicated routes for stores, products, milestones, and cart sessions
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot module replacement with Vite integration in development

## Database Schema Design
The system uses PostgreSQL with the following core entities:
- **Stores**: Shopify store information with access tokens
- **Products**: Product catalog with eligibility flags for rewards
- **Milestones**: Configurable reward thresholds with different reward types
- **Cart Sessions**: Active cart tracking with unlocked milestones and selected rewards
- **Reward History**: Transaction history for analytics
- **Users**: Basic user management system

## Core Business Logic
- **Progressive Rewards**: Milestone system that unlocks rewards based on cart value thresholds
- **Real-time Updates**: Cart value tracking with immediate milestone evaluation
- **Urgency Mechanisms**: Timer-based expiration for reward selections
- **Product Selection**: Interface for customers to choose free products from eligible inventory

## State Management Pattern
- Server state managed through TanStack Query with optimistic updates
- Local cart state synchronized with backend cart sessions
- Real-time milestone evaluation and celebration animations
- Persistent cart sessions across browser sessions

# External Dependencies

## Database
- **Neon Database**: PostgreSQL serverless database with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## UI Framework
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library for UI components

## Development Tools
- **Replit Integration**: Development environment plugins for cartographer and dev banner
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime type validation for API requests and responses

## Shopify Integration
- **Shopify API**: Store and product data synchronization (integration points prepared)
- **Webhook Support**: Ready for Shopify cart and order event processing

## Styling and Animation
- **TailwindCSS**: Utility-first CSS framework
- **CSS Variables**: Dynamic theming system
- **Embla Carousel**: Product selection carousel component
- **Custom Animations**: Celebration effects for milestone achievements