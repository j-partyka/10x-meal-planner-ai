# Technical Architecture - 10x Meal Planner

## Technology Stack

### Frontend Framework
- **Astro 5**
  - Why: Content-focused web framework with excellent performance
  - Benefits: Server-side rendering, minimal JavaScript by default, React integration
  - Alternative considered: Next.js (Astro provides better performance for content-heavy apps)

- **React 19**
  - Why: Latest stable version with improved performance and features
  - Benefits: Hooks, component architecture, massive ecosystem, improved rendering
  - Alternative considered: React 18 (React 19 provides better performance)

- **TypeScript 5**
  - Why: Type safety prevents bugs, better IDE support
  - Benefits: Catch errors at compile-time, self-documenting code
  - Alternative considered: JavaScript (higher bug risk without type safety)

### Styling & UI Components
- **Tailwind CSS 4**
  - Why: Latest version with improved performance and features
  - Benefits: Utility-first CSS, rapid prototyping, responsive utilities, optimized bundle
  - Alternative considered: Tailwind 3 (Tailwind 4 provides better performance)

- **Shadcn/ui**
  - Why: Accessible, customizable components built on Radix UI
  - Benefits: Copy-paste components, no npm bloat, full control
  - Alternative considered: Material UI (too heavy, opinionated styling)

### Backend & Database
- **Supabase**
  - Why: Backend-as-a-Service with instant REST API
  - Benefits: PostgreSQL database, real-time subscriptions, generous free tier
  - Services used:
    - PostgreSQL database for inventory storage
    - Supabase JS client for CRUD operations
    - Auto-generated REST API
  - Alternative considered: Firebase (prefer SQL over NoSQL for structured data)

- **Astro API Endpoints**
  - Why: Server-side endpoints for OpenRouter integration
  - Benefits: Secure API key storage, simple to implement, same codebase
  - Alternative considered: Supabase Edge Functions (adds Deno complexity)

### AI Integration
- **OpenRouter.ai**
  - Why: Unified API for multiple AI models
  - Benefits: Model flexibility, usage limits, fallback options
  - Alternative considered: Direct OpenAI API (vendor lock-in)

- **OpenAI GPT-3.5-turbo**
  - Why: 10x cheaper than GPT-4, likely sufficient for meal planning
  - Cost: ~$0.05-0.20 per meal plan generation
  - Upgrade path: Switch to GPT-4 if quality insufficient

### Authentication
- **HTTP Basic Authentication**
  - Why: Simple, built-in browser support, adequate for single-user
  - Implementation: Astro middleware
  - Upgrade path: Supabase Auth when multi-user needed

### Deployment & Hosting
- **Node.js Adapter**
  - Why: Enables server-side rendering with Astro
  - Benefits: Standalone server mode, flexible deployment options
  - Deployment platforms: Vercel, Netlify, Railway, Render, or any Node.js hosting
  - Cost: Varies by platform (many offer free tiers)
  - Alternative considered: Static site generation (requires API endpoints, so SSR needed)

## Project Structure

```
10x-meal-planner/
├── src/
│   ├── layouts/                      # Astro layouts
│   │   └── Layout.astro              # Root layout
│   │
│   ├── pages/                        # Astro pages
│   │   ├── index.astro               # Home/Inventory page
│   │   └── api/                      # API endpoints
│   │       ├── meal-plan/
│   │       │   └── index.ts          # POST /api/meal-plan
│   │       └── shopping-list/
│   │           └── index.ts          # GET /api/shopping-list
│   │
│   ├── components/                   # Components (Astro & React)
│   │   ├── ui/                       # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── table.tsx
│   │   ├── inventory/
│   │   │   ├── product-form.tsx      # Add/Edit product form
│   │   │   ├── product-list.tsx      # Inventory table
│   │   │   ├── product-search.tsx    # Search input
│   │   │   └── delete-dialog.tsx     # Confirmation modal
│   │   ├── meal-plan/
│   │   │   ├── meal-plan-table.tsx   # 7-day meal grid
│   │   │   ├── meal-card.tsx         # Individual meal display
│   │   │   └── generate-button.tsx   # AI generation trigger
│   │   └── shopping-list/
│   │       ├── shopping-list.tsx     # Grouped shopping items
│   │       └── category-group.tsx    # Category section
│   │
│   ├── lib/                          # Utility functions
│   │   ├── supabase.ts               # Supabase client
│   │   ├── openrouter.ts             # OpenRouter API client
│   │   └── utils.ts                  # Helper functions
│   │
│   ├── db/                           # Supabase clients and types
│   │   └── ...
│   │
│   ├── middleware/                   # Astro middleware
│   │   └── index.ts                  # HTTP Basic Auth
│   │
│   ├── types.ts                      # Shared types
│   │
│   └── styles/                       # Global styles
│       └── global.css                # Tailwind imports
│
├── public/                           # Static assets
├── .env.local                        # Environment variables (not committed)
├── .env.example                      # Template for env vars
├── astro.config.mjs                  # Astro configuration
├── tsconfig.json                     # TypeScript configuration
├── components.json                   # Shadcn/ui configuration
├── package.json                      # Dependencies
└── README.md                         # Setup instructions
```

## Data Models

### Product (Supabase table: `products`)
```typescript
interface Product {
  id: string;                 // UUID (auto-generated)
  name: string;               // Product name
  quantity: number;           // Numeric quantity
  unit: string;               // kg, g, ml, L, pieces
  expiration_date: string;    // ISO date string
  category?: string;          // Optional free text
  created_at: string;         // Timestamp
  updated_at: string;         // Timestamp
}
```

### Meal Plan (In-memory, not stored)
```typescript
interface Meal {
  name: string;               // Dish name
  ingredients: Ingredient[];  // List of ingredients
  instructions: string[];     // 3-5 bullet points
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface MealPlan {
  days: {
    date: string;             // ISO date
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
  }[];
}
```

### Shopping List (Generated on-demand)
```typescript
interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface ShoppingList {
  items: ShoppingItem[];
  grouped: {
    [category: string]: ShoppingItem[];
  };
}
```

## API Endpoints

### Inventory (Supabase Auto-generated)
- `GET /rest/v1/products` - List all products
- `POST /rest/v1/products` - Create product
- `PATCH /rest/v1/products?id=eq.{id}` - Update product
- `DELETE /rest/v1/products?id=eq.{id}` - Delete product

### AI Integration (Custom Astro API endpoints)
- `POST /api/meal-plan` - Generate weekly meal plan
  - Body: `{ products: Product[], familyProfile: FamilyProfile }`
  - Response: `{ mealPlan: MealPlan, shoppingList: ShoppingList }`

## Environment Variables

```bash
# .env.local (not committed to git)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...  # Public, safe for client
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...      # Secret, only for server

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxx...          # Secret, only for server

# Basic Auth
BASIC_AUTH_USERNAME=family               # Your chosen username
BASIC_AUTH_PASSWORD=your-secure-password # Your chosen password
```

## Development Workflow

### Initial Setup
1. Create Astro project: `npm create astro@latest meal-planner`
2. Add React integration: `npx astro add react`
3. Install dependencies: `npm install @supabase/supabase-js`
4. Set up Supabase project and get credentials
5. Configure environment variables
6. Initialize Shadcn/ui: `npx shadcn-ui@latest init`
7. Add Node adapter: `npx astro add node`

### Development
1. Run dev server: `npm run dev`
2. Access at `http://localhost:3000`
3. Hot reload on file changes

### Deployment
1. Build for production: `npm run build`
2. Push to GitHub repository
3. Deploy to chosen platform (Vercel, Netlify, Railway, etc.)
4. Configure environment variables in deployment platform
5. Auto-deploy on every `git push` (if supported by platform)

## Security Considerations

### API Keys
- ✅ OpenRouter key stored in environment variable
- ✅ Only accessible in server-side code (API endpoints)
- ❌ NEVER expose in client-side code
- ✅ Environment variables encrypted at rest by deployment platform

### Authentication
- HTTP Basic Auth via Astro middleware
- Credentials stored in environment variables
- Browser handles credential storage/caching
- Applies to all routes (pages + API)

### Database Access
- Supabase anon key is public (safe for client-side)
- No Row Level Security needed (single-user)
- Service role key only used if needed server-side

### HTTPS
- Enforced by deployment platform (free SSL certificates)
- No mixed content warnings

## Cost Breakdown

### Development (One-time)
- Tools: All free (VS Code, GitHub, etc.)

### Monthly Operating Costs
- **Supabase:** $0 (free tier: 500MB database, 50K MAU)
- **OpenRouter (GPT-3.5-turbo):** $0.40-1.60 (2 generations/week)
- **Hosting:** $0 (free tier available on most platforms)
- **Total:** ~$0.50-2.00/month

### Upgrade Costs (if needed)
- GPT-4: ~$4-16/month (10x more expensive)
- Supabase Pro: $25/month (if exceed free tier)
- Hosting Pro: Varies by platform ($20-25/month typically)

## Performance Targets

- **Inventory page load:** < 2 seconds
- **Meal plan generation:** < 30 seconds
- **Form submissions:** < 1 second
- **Search filtering:** < 500ms
- **API response times:** < 3 seconds

## Scalability Considerations

### Current Limits
- Single-user by design
- ~1000 products (Supabase free tier: 500MB)
- ~100 meal plan generations/month before costs rise

### Future Scaling Path
1. Add Supabase Auth for multi-user
2. Implement Row Level Security (RLS)
3. Add user_id foreign key to products table
4. Upgrade to Supabase Pro if needed
5. Cache meal plans in database to reduce API costs
6. Add Redis for session/cache management

## Development Tasks

### Setup Phase
- [ ] Create Astro project
- [ ] Install and configure Tailwind CSS 4
- [ ] Set up Shadcn/ui
- [ ] Create Supabase project and products table
- [ ] Configure environment variables
- [ ] Implement HTTP Basic Auth middleware
- [ ] Set up Node.js adapter
- [ ] Configure deployment

### Inventory Management Phase
- [ ] Design product form component
- [ ] Implement create product functionality
- [ ] Build product list/table with expiration indicators
- [ ] Add edit product modal
- [ ] Add delete confirmation dialog
- [ ] Implement search/filter
- [ ] Add form validation
- [ ] Style with Tailwind + Shadcn/ui

### AI Meal Planning Phase
- [ ] Create OpenRouter API client
- [ ] Build meal plan prompt with family profile
- [ ] Implement POST /api/meal-plan endpoint
- [ ] Design 7-day meal plan table UI
- [ ] Add meal details display (ingredients, instructions)
- [ ] Implement shopping list generation logic
- [ ] Build shopping list grouped by category
- [ ] Add "Regenerate" button
- [ ] Handle loading and error states

### Testing & Deployment Phase
- [ ] Test all CRUD operations
- [ ] Test meal plan generation with various inventories
- [ ] Verify expiration date logic
- [ ] Test responsive design on mobile
- [ ] Fix any bugs
- [ ] Update README with setup instructions
- [ ] Final deployment
- [ ] Share URL with family

## Testing Strategy (Manual for MVP)

### Inventory Testing
- [ ] Add product with all fields
- [ ] Add product with minimal fields (no category)
- [ ] Edit product quantity
- [ ] Delete product with confirmation
- [ ] Search products by name
- [ ] Verify expiration indicators (red <3 days, yellow <7 days)

### Meal Planning Testing
- [ ] Generate plan with 10+ products
- [ ] Generate plan with 2-3 products (minimal inventory)
- [ ] Verify expiring items appear in early meals
- [ ] Check ingredient quantities are specific
- [ ] Verify instructions are 3-5 bullet points
- [ ] Test regenerate functionality
- [ ] Verify shopping list accuracy

### Error Handling Testing
- [ ] Submit empty product form (validation)
- [ ] Submit negative quantity (validation)
- [ ] Generate plan with empty inventory (disabled button)
- [ ] Simulate API failure (disconnect internet)
- [ ] Test retry after API failure

### Authentication Testing
- [ ] Access without credentials (should prompt)
- [ ] Enter wrong credentials (should re-prompt)
- [ ] Enter correct credentials (should access app)
- [ ] Verify session persists across pages

## Common Pitfalls to Avoid

1. **Exposing API keys in client code** - Always use API routes
2. **Not handling loading states** - AI calls take 10-30 seconds
3. **Forgetting form validation** - Empty quantities cause errors
4. **Hardcoding dates** - Use dynamic dates for meal plans
5. **Not grouping shopping items** - Aggregate quantities for same item
6. **Over-engineering** - Stick to MVP scope, no extras
7. **Not testing with real data** - Use actual grocery items
8. **Ignoring mobile layout** - Test on phone screen sizes

## Resources & Documentation

- Astro Documentation: https://docs.astro.build
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- OpenRouter API: https://openrouter.ai/docs
- Shadcn/ui Components: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs
- Astro Deployment: https://docs.astro.build/en/guides/deploy/

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-27 | Use Astro 5 | Content-focused framework with excellent performance, React integration |
| 2026-01-27 | Use React 19 | Latest stable version with improved performance |
| 2026-01-27 | Use Tailwind CSS 4 | Latest version with improved performance and features |
| 2026-01-27 | Use GPT-3.5-turbo instead of GPT-4 | 10x cheaper, test if sufficient before upgrading |
| 2026-01-27 | Add HTTP Basic Auth | Simple security, adequate for single-user |
| 2026-01-27 | Use Node.js adapter | Enables server-side rendering with flexible deployment options |
