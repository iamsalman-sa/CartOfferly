# Overview

RB Promo Management App is a comprehensive promotional management system designed for e-commerce businesses. The application provides milestone-based cart rewards, seasonal promotions, discount campaigns, and bundle configurations to increase average order value and customer engagement. It features both customer-facing cart interfaces and admin management dashboards for complete promotional control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool for fast development and optimized production builds
- **UI System**: shadcn/ui component library built on Radix UI primitives with TailwindCSS for consistent styling
- **Routing**: Wouter for lightweight client-side routing with support for both public and admin routes
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Styling**: TailwindCSS with CSS custom properties for theming, configured for dark mode with beauty industry color palette
- **Component Structure**: Modular architecture separating UI components, business logic, hooks, and pages

## Backend Architecture
- **Runtime Environment**: Node.js with Express.js server using ESM modules
- **Language**: TypeScript for type safety across the entire backend
- **Database Integration**: Drizzle ORM for type-safe database operations with PostgreSQL
- **API Design**: RESTful API with dedicated route handlers for stores, products, milestones, campaigns, and analytics
- **Development Setup**: Hot module replacement integration with Vite for seamless full-stack development
- **Error Handling**: Centralized error handling middleware with structured error responses

## Database Schema Design
The system uses PostgreSQL with comprehensive schemas for:
- **Store Management**: Shopify store integration with access tokens and configuration
- **Product Catalog**: Product information with eligibility flags and bundle support
- **Milestone System**: Configurable reward thresholds with multiple reward types (delivery, products, discounts)
- **Campaign Management**: Discount campaigns with rules, seasonal promotions, and bundle configurations
- **Analytics**: Comprehensive tracking for reward history, usage statistics, and performance metrics
- **User Management**: Basic user authentication and role management

## Core Business Logic
- **Progressive Milestone System**: Dynamic milestone evaluation based on cart value with real-time unlocking
- **Campaign Engine**: Flexible discount system supporting percentage, fixed amount, BOGO, and bundle campaigns
- **Seasonal Promotions**: Time-based promotional campaigns with themed interfaces
- **Product Selection Interface**: Customer-facing product selection for free rewards with urgency timers
- **Analytics Engine**: Real-time performance tracking and conversion analytics

## Authentication & Security
- **Store Authentication**: Shopify access token management for secure API interactions
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **Data Validation**: Zod schemas for runtime type checking and validation across API endpoints

## Development Patterns
- **Type Safety**: End-to-end TypeScript with shared schema definitions between client and server
- **Code Organization**: Monorepo structure with shared types and utilities
- **Development Experience**: Replit-optimized development with runtime error overlays and development banners

# External Dependencies

## Database
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe database operations with migrations support
- **Connection Pooling**: Neon serverless with connection caching for optimal performance

## E-commerce Integration
- **Shopify Integration**: Store access tokens and product catalog synchronization
- **Product Management**: Real-time product eligibility and inventory tracking

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI interactions
- **TailwindCSS**: Utility-first styling with custom color palette for beauty industry branding
- **Lucide React**: Consistent icon system throughout the application

## State Management
- **TanStack Query**: Server state management with background refetching and optimistic updates
- **React Hook Form**: Form state management with validation integration

## Development Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **Replit Plugins**: Development banner, error overlay, and cartographer for enhanced development experience
- **ESBuild**: Fast bundling for production server builds