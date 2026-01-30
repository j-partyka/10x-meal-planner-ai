# 10x Meal Planner

A web-based meal planning application that helps families optimize meal preparation by leveraging existing kitchen inventory, reducing food waste, and minimizing unnecessary grocery expenses through AI-powered weekly meal planning.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x Meal Planner is an MVP (Minimum Viable Product) designed to solve common meal planning challenges faced by families. The application helps users:

- **Reduce meal-related expenses** by prioritizing existing kitchen inventory
- **Minimize food waste** through better visibility and planning of expiring items
- **Organize kitchen inventory** with an easy-to-use tracking system
- **Generate weekly meal plans** using AI that considers available inventory, expiration dates, and nutritional needs
- **Create shopping lists** automatically for only the missing ingredients

The application is designed for families with young children who want to prepare healthy, home-cooked meals efficiently while managing their kitchen inventory and grocery expenses.

### Key Features

- **Inventory Management**: Full CRUD operations for tracking kitchen products with expiration dates
- **AI-Powered Meal Planning**: Weekly meal plans generated using OpenAI GPT-3.5-turbo via OpenRouter.ai
- **Smart Prioritization**: Automatically prioritizes items expiring soon to reduce waste
- **Shopping List Generation**: Creates organized shopping lists for missing ingredients only
- **Nutritional Considerations**: Meal plans account for adult and toddler nutritional needs
- **Time-Efficient Recipes**: Meal suggestions respect preparation time constraints (10-30 minutes)

## Tech Stack

### Frontend Framework
- **Astro 5** - Content-focused web framework with server-side rendering
- **React 19** - UI library for interactive components
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Accessible, customizable UI components built on Radix UI

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Astro API Endpoints** - Server-side endpoints for secure API integrations

### AI Integration
- **OpenRouter.ai** - Unified API for multiple AI models
- **OpenAI GPT-3.5-turbo** - AI model for meal plan generation (~$0.40-1.60/month for typical usage)
- The OpenRouter service (`src/lib/services/openrouter.service.ts`) is **server-only**; it is used from API routes and domain services. Set `OPENROUTER_API_KEY` in your environment. Structured output uses `response_format` with `type: 'json_schema'` and `strict: true`.

### Authentication
- **HTTP Basic Authentication** - Simple authentication for single-user MVP

### Deployment
- **Node.js Adapter** - Enables server-side rendering with Astro
- Compatible with Vercel, Netlify, Railway, Render, and other Node.js hosting platforms

### Testing
- **Vitest** - Unit and integration tests
  - Unit tests for `src/lib` (Zod schemas, services, utils) with valid/invalid inputs and mocked Supabase/OpenRouter
  - Integration/API tests for REST endpoints using `fetch` and Supabase Auth token (see `.ai/api-test-scenarios.md`)
  - Run with: `npm run test`
- **Playwright** - End-to-end tests
  - Browser-based tests for critical user journeys: authentication, inventory CRUD, meal plan generation, shopping list
  - Run against `npm run dev` or a deployed preview
  - Run with: `npm run test:e2e`
- Detailed test scope, scenarios, and acceptance criteria are in `.ai/test-plan.md`

## Getting Started Locally

### Prerequisites

- **Node.js v22.14.0** (as specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Supabase account** (free tier available)
- **OpenRouter.ai account** with API key

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd 10x-meal-planner-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values:
   ```bash
   # Supabase
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJxxx...  # Supabase anon key
   
   # OpenRouter
   OPENROUTER_API_KEY=sk-or-xxx...
   
   # Basic Auth (optional, for production)
   BASIC_AUTH_USERNAME=family
   BASIC_AUTH_PASSWORD=your-secure-password
   ```

4. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Create a `products` table with the following schema:
     ```sql
     CREATE TABLE products (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       quantity NUMERIC NOT NULL,
       unit TEXT NOT NULL,
       expiration_date DATE NOT NULL,
       category TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```
   - Copy your Supabase URL and anon key to `.env.local`

5. **Set up OpenRouter.ai:**
   - Create an account at [openrouter.ai](https://openrouter.ai)
   - Generate an API key
   - Set financial limits to control costs
   - Add the API key to `.env.local`

6. **Run the development server:**
   ```bash
   npm run dev
   ```

   **If you get 503 (e.g. meal plan generation) or env changes don't apply:** clean caches and restart:
   ```bash
   npm run clean
   npm run dev
   ```
   This removes `dist`, `.astro`, and Vite cache so the server picks up fresh code and env from `.env.local`.

7. **Access the application:**
   - Open your browser and navigate to `http://localhost:4321`
   - If Basic Auth is configured, enter your credentials when prompted

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run clean` - Remove `dist`, `.astro`, and Vite cache (run before restart if env or code changes don't apply)
- `npm run test` - Run unit and integration tests (Vitest)
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:ui` - Run Vitest with UI mode
- `npm run test:coverage` - Run Vitest with coverage report
- `npm run test:e2e` - Run E2E tests (Playwright; dev server started automatically)
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code using Prettier
- `npm run astro` - Run Astro CLI commands

## Testing

The project uses **Vitest** for unit and integration tests and **Playwright** for end-to-end tests (see [Tech Stack > Testing](#testing) for details).

- **Unit / integration:** `npm run test` — exercises schemas, services, and API routes (with mocked Supabase and OpenRouter where needed).
- **E2E:** `npm run test:e2e` — runs Playwright against the app (dev server is started automatically by Playwright’s config).
- **Test plan:** Scope, scenarios, and acceptance criteria are documented in [.ai/test-plan.md](.ai/test-plan.md). API checklists are in [.ai/api-test-scenarios.md](.ai/api-test-scenarios.md).

**Test environment**

- **Vitest:** `vitest.config.ts` (jsdom, `src/test/setup.ts` for `@testing-library/jest-dom`). Unit tests live in `src/**/*.test.ts` or `*.spec.ts`. Use `npm run test:watch` for watch mode and `npm run test:ui` for the Vitest UI.
- **Playwright:** `playwright.config.ts` (Chromium only). E2E specs and Page Objects live in `e2e/` (e.g. `e2e/smoke.spec.ts`, `e2e/pages/LoginPage.ts`). First time: run `npx playwright install chromium` to install the browser.

## Project Scope

### In Scope (MVP)

**Phase 0: Setup**
- HTTP Basic Authentication for application access
- Astro 5 project setup with TypeScript
- Supabase database configuration
- Deployment configuration

**Phase 1: Inventory Management**
- Product CRUD operations (create, read, update, delete)
- Inventory list display with search functionality
- Manual product entry
- Expiration date indicators (visual warnings for items expiring soon)
- Basic data validation

**Phase 2: Meal Planning & Shopping**
- AI-powered weekly meal plan generation (7 days, 3 meals per day)
- Shopping list with quantities grouped by category
- Leftover utilization suggestions
- Expiration date priority logic
- Meal plan regeneration

### Out of Scope (MVP)

- Individual user accounts with signup/login
- Multi-user support
- CSV import/export for bulk inventory management
- Barcode scanning
- Cost tracking per product
- Expense management features
- Multi-week or long-term meal planning
- Historical meal plan storage
- Recipe customization
- Mobile application (responsive design only)
- Imperial unit system support
- Multiple language support

## Project Status

**Current Status:** MVP in Development

This is a Minimum Viable Product (MVP) focused on core functionality:

- ✅ Project setup and configuration
- 🔄 Inventory management features (in progress)
- 🔄 AI meal planning integration (in progress)
- ⏳ Shopping list generation (planned)
- ⏳ Deployment and testing (planned)

### Success Metrics

The MVP will be considered successful if:
1. All user stories pass acceptance criteria
2. Application is deployed and accessible via web browser
3. Family achieves measurable expense reduction (target: 50%)
4. Application is used consistently
5. Technical performance metrics are met (page load < 2s, meal plan generation < 30s)
6. AI meal plan generation costs remain under $2/month

### Estimated Operating Costs

- **Supabase:** $0 (free tier: 500MB database, 50K MAU)
- **OpenRouter (GPT-3.5-turbo):** $0.40-1.60/month (2 generations/week)
- **Hosting:** $0 (free tier available on most platforms)
- **Total:** ~$0.50-2.00/month

## License

MIT

---

## Additional Resources

- [Astro Documentation](https://docs.astro.build)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
