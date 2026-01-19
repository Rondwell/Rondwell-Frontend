# Rondwell Frontend

This is the official frontend application for **Rondwell**, accessible at [rondwell.com](https://rondwell.com). The application is built using [SvelteKit](https://kit.svelte.dev/) and styled with [Tailwind CSS](https://tailwindcss.com).

---

## 🚀 Tech Stack

- **Framework**: SvelteKit 2.16.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.7
- **UI Components**: bits-ui, lucide-svelte, @iconify/svelte
- **Charts**: @carbon/charts-svelte
- **Animations**: GSAP, motion-svelte
- **Build Tool**: Vite 6.2.6
- **Deployment**: Netlify (Static Adapter)

---

## 📋 Project Setup

### 1. GitHub Repository Setup

Clone the repository from GitHub:

```bash
git clone https://github.com/Rondwell/Rondwell-Frontend.git
cd Rondwell-Frontend
```

### 2. Installing Dependencies

Install all project dependencies using npm:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- **Development dependencies**: SvelteKit, TypeScript, ESLint, Prettier, Tailwind CSS plugins
- **Production dependencies**: UI libraries, chart components, animation libraries

---

## 💻 Running the Project Locally

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Other Available Scripts

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Type-check the project
npm run check

# Type-check in watch mode
npm run check:watch

# Format code with Prettier
npm run format

# Lint code with ESLint and Prettier
npm run lint
```

---

## 🚀 Deployment to Netlify

### Automatic Deployment

The project is configured for **automatic deployment** to Netlify:

1. **Trigger**: Any merge to the `main` branch automatically triggers a deployment
2. **Build Process**: Netlify runs `npm run build` to create a production build
3. **Output**: The static files from the `build` directory are deployed
4. **Adapter**: Uses `@sveltejs/adapter-static` for static site generation

### Deployment Configuration

The deployment is configured in `svelte.config.js`:

```javascript
adapter: adapter({
  pages: 'build',
  assets: 'build',
  fallback: '404.html',
  precompress: false,
  strict: true
})
```

### Manual Deployment Steps

If you need to deploy manually:

1. Ensure all changes are committed to your branch
2. Create a pull request to `main`
3. Review and merge the pull request
4. Netlify will automatically detect the merge and start the deployment
5. Monitor the deployment status in the Netlify dashboard

---

## 🏗️ Frontend Architecture

### Folder Structure

```
Rondwell-Frontend/
├── src/
│   ├── routes/              # SvelteKit file-based routing
│   │   ├── (app)/          # Main application routes (authenticated)
│   │   │   ├── (main)/     # Core app pages
│   │   │   │   ├── events/         # Event management pages
│   │   │   │   ├── collection/     # Collection pages
│   │   │   │   ├── overview/       # Overview/dashboard
│   │   │   │   └── settings/       # Settings pages
│   │   │   ├── components/         # App-level shared components
│   │   │   │   ├── Nav.svelte
│   │   │   │   └── Sidebar.svelte
│   │   │   ├── create-event/       # Event creation flow
│   │   │   ├── discover/           # Discovery/explore pages
│   │   │   └── welcome/            # Welcome/onboarding
│   │   ├── (homePage)/     # Public landing pages
│   │   ├── auth/           # Authentication pages
│   │   ├── +layout.svelte  # Root layout
│   │   └── +layout.server.ts
│   ├── lib/                # Shared utilities and components
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Button.svelte
│   │   │   ├── EventCard.svelte
│   │   │   ├── CollectionCard.svelte
│   │   │   ├── TextEditor.svelte
│   │   │   ├── ThemeToggle.svelte
│   │   │   └── Scroll.svelte
│   │   ├── assets/         # Static assets (images, icons)
│   │   ├── stores/         # Svelte stores for state management
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Library exports
│   ├── app.css             # Global styles
│   ├── app.html            # HTML template
│   └── app.d.ts            # TypeScript declarations
├── static/                 # Static files (served as-is)
├── svelte.config.js        # SvelteKit configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

### Routing System

**SvelteKit uses file-based routing** where the folder structure in `src/routes/` determines the URL structure:

#### Route Groups (Parentheses)

- `(app)/` - Route group for authenticated application pages (doesn't affect URL)
- `(homePage)/` - Route group for public landing pages (doesn't affect URL)
- `(main)/` - Nested route group for core app functionality

#### Special Files

- `+page.svelte` - Page component (renders at the route)
- `+layout.svelte` - Layout component (wraps child routes)
- `+layout.server.ts` - Server-side layout logic
- `+page.server.ts` - Server-side page logic

#### Example Routes

```
src/routes/(app)/(main)/events/+page.svelte
→ URL: /events

src/routes/(app)/(main)/events/[id]/+page.svelte
→ URL: /events/123 (dynamic route)

src/routes/(app)/(main)/events/[id]/planning/+page.svelte
→ URL: /events/123/planning

src/routes/(app)/create-event/+page.svelte
→ URL: /create-event

src/routes/(app)/discover/+page.svelte
→ URL: /discover

src/routes/auth/+page.svelte
→ URL: /auth
```

### Component Structure

#### Shared Components (`src/lib/components/`)

Reusable components used across the application:

- **Button.svelte** - Customizable button component
- **EventCard.svelte** - Card component for displaying events
- **CollectionCard.svelte** - Card component for collections
- **TextEditor.svelte** - Rich text editor component
- **ThemeToggle.svelte** - Dark/light theme switcher
- **Scroll.svelte** - Custom scroll component

#### Route-Specific Components

Components located within route folders are specific to those routes:

- `src/routes/(app)/components/` - App-level components (Nav, Sidebar)
- `src/routes/(app)/(main)/events/[id]/planning/components/` - Event planning components

### Styling Architecture

#### Tailwind CSS Configuration

The project uses **Tailwind CSS 4.1.7** with the following plugins:

- `@tailwindcss/forms` - Form styling
- `@tailwindcss/typography` - Typography utilities
- `tailwindcss-animate` - Animation utilities

#### Global Styles

- **app.css** - Global CSS file with Tailwind directives and custom styles
- Imported in the root layout (`+layout.svelte`)

#### Component Styling

- **Utility-first approach** - Tailwind utility classes in components
- **Scoped styles** - Component-specific `<style>` blocks when needed
- **CSS variables** - Theme colors and design tokens

#### Theme Support

- Dark/light theme toggle via `ThemeToggle.svelte`
- Theme persistence using browser storage
- CSS variables for dynamic theming

### State Management

#### Svelte Stores (`src/lib/stores/`)

- Reactive state management using Svelte stores
- Shared state across components
- Persistent state with localStorage integration

### Utilities (`src/lib/utils/`)

Helper functions and utilities:
- Date formatting
- Data validation
- API helpers
- Type guards

### TypeScript Configuration

- **Strict mode enabled** for type safety
- Type definitions in `src/app.d.ts`
- Component props typed with TypeScript
- Full IntelliSense support

---

## 📦 Key Dependencies

### Core Framework
- **@sveltejs/kit** (2.16.0) - SvelteKit framework
- **svelte** (5.0.0) - Svelte compiler
- **vite** (6.2.6) - Build tool

### UI & Styling
- **tailwindcss** (4.1.7) - Utility-first CSS framework
- **bits-ui** (0.21.2) - Headless UI components
- **lucide-svelte** (0.454.0) - Icon library
- **@iconify/svelte** (5.0.2) - Icon framework

### Animation
- **gsap** (3.13.0) - Animation library
- **motion-svelte** (0.0.1) - Motion components
- **svelte-motion** (0.12.2) - Animation utilities

### Data Visualization
- **@carbon/charts-svelte** (1.22.18) - Chart components
- **d3** (7.9.0) - Data visualization library

### Development Tools
- **typescript** (5.0.0) - Type checking
- **eslint** (9.18.0) - Code linting
- **prettier** (3.4.2) - Code formatting

---

## 🔧 Configuration Files

- **svelte.config.js** - SvelteKit and adapter configuration
- **vite.config.ts** - Vite build configuration and plugins
- **tailwind.config.ts** - Tailwind CSS customization
- **tsconfig.json** - TypeScript compiler options
- **eslint.config.js** - ESLint rules and plugins
- **.prettierrc** - Prettier formatting rules

---

## 📝 Development Guidelines

### Code Style
- Follow ESLint and Prettier configurations
- Use TypeScript for type safety
- Write semantic HTML
- Use Tailwind utility classes

### Component Guidelines
- Keep components focused and reusable
- Use TypeScript for prop definitions
- Document complex components
- Follow SvelteKit best practices

### Commit Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run check`
4. Commit with descriptive messages
5. Create a pull request to `main`
6. Merge triggers automatic Netlify deployment

---

## 🌐 Live Site

Visit the live application at: **[rondwell.com](https://rondwell.com)**

---

## 📄 License

This project is private and proprietary to Rondwell.
