# Rondwell Frontend

> **AI-powered, real-time, multi-tenant event management SaaS with payment, analytics, chat, Web3, and more.**

A modern, responsive frontend application for the Rondwell event management platform, built with SvelteKit, Tailwind CSS, and TypeScript.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [Styling](#styling)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Rondwell is a comprehensive event management platform designed to simplify event planning, promotion, and execution. The frontend provides an intuitive interface for:

- **Event Organizers** - Create, manage, and promote events
- **Vendors & Exhibitors** - Showcase products and manage bookings
- **Speakers** - Manage presentations and presentations
- **Attendees** - Discover, register for, and participate in events

The application is built as a multi-page application with role-based access control and real-time features.

---

## 🛠️ Tech Stack

### Core Framework

- **[SvelteKit](https://kit.svelte.dev/)** - Modern web development framework
- **[Svelte 5](https://svelte.dev/)** - Reactive UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Styling & UI

- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[@tailwindcss/forms](https://github.com/tailwindlabs/tailwindcss-forms)** - Form styling
- **[@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)** - Typography plugin
- **Bits UI** - Unstyled, accessible component library
- **Tailwind Variants** - Type-safe Tailwind class composition

### Data Visualization & Charts

- **[@carbon/charts-svelte](https://github.com/carbon-design-system/carbon-charts)** - Carbon Design System charts
- **[D3.js](https://d3js.org/)** - Data visualization library

### Icons & Assets

- **[@iconify/svelte](https://iconify.design/)** - Icon library with Svelte support
- **svelte-motion** - Animation library

### Build Tools

- **[Vite](https://vitejs.dev/)** - Next-generation build tool
- **[Eslint](https://eslint.org/)** - JavaScript linter
- **[Prettier](https://prettier.io/)** - Code formatter
- **[PostCSS](https://postcss.org/)** - CSS transformations

### Progressive Web App

- **vite-plugin-pwa** - PWA support with auto-updating

### Deployment

- **[@sveltejs/adapter-netlify](https://kit.svelte.dev/docs/adapter-netlify)** - Netlify deployment adapter
- **[@sveltejs/adapter-static](https://kit.svelte.dev/docs/adapter-static)** - Static site adapter

---

## 📁 Project Structure

```
.
├── src/
│   ├── app.css              # Global styles
│   ├── app.html             # HTML entry point
│   ├── app.d.ts             # Type definitions
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components
│   │   │   ├── BoothContent.svelte
│   │   │   ├── Button.svelte
│   │   │   ├── CollectionCard.svelte
│   │   │   ├── EventCard.svelte
│   │   │   ├── TextEditor.svelte
│   │   │   ├── ThemeToggle.svelte
│   │   │   └── Scroll.svelte
│   │   ├── stores/          # Svelte stores (state management)
│   │   │   ├── theme.ts     # Theme store
│   │   │   └── uiStore.ts   # UI state store
│   │   ├── utils/           # Utility functions
│   │   │   ├── api.ts       # API calls
│   │   │   ├── animation.ts # Animation utilities
│   │   │   ├── colors.ts    # Color utilities
│   │   │   ├── statusStyle.ts
│   │   │   └── products.ts
│   │   ├── assets/          # Static assets
│   │   │   ├── fonts/       # Custom fonts
│   │   │   └── images/      # Images
│   │   └── index.ts         # Library exports
│   └── routes/              # SvelteKit file-based routing
│       ├── (homePage)/      # Public landing pages
│       │   ├── home/        # Home section components
│       │   ├── pricing/     # Pricing page
│       │   ├── faq/         # FAQ page
│       │   ├── help-center/ # Help center
│       │   ├── contact/     # Contact page
│       │   ├── terms/       # Terms of service
│       │   └── privacy/     # Privacy policy
│       ├── (app)/           # Authenticated app routes
│       │   ├── (main)/      # Main application
│       │   │   ├── collection/
│       │   │   ├── events/
│       │   │   ├── event-page/
│       │   │   ├── overview/
│       │   │   └── settings/
│       │   ├── exhibitor/   # Exhibitor routes
│       │   ├── vendor/      # Vendor routes
│       │   ├── speaker/     # Speaker routes
│       │   ├── discover/    # Discovery page
│       │   ├── create-event/# Event creation
│       │   ├── experience/  # Experience page
│       │   └── welcome/     # Welcome page
│       └── auth/            # Authentication routes
├── static/                  # Static assets served as-is
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── svelte.config.js         # SvelteKit configuration
├── vite.config.ts           # Vite configuration
├── eslint.config.js         # ESLint configuration
├── postcss.config.cjs       # PostCSS configuration
└── package.json             # Dependencies and scripts
```

### Key Directories Explained

- **`src/routes/(homePage)`** - Public-facing landing pages, don't require authentication
- **`src/routes/(app)`** - Protected application routes with authentication
- **`src/routes/auth`** - Authentication and verification pages
- **`src/lib/components`** - Reusable UI components used across the app
- **`src/lib/stores`** - Centralized state management using Svelte stores
- **`src/lib/utils`** - Helper functions for API calls, animations, styling, etc.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16.x or higher) - [Download](https://nodejs.org/)
- **npm** or **pnpm** (v7.x or higher)
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/Rondwell-Frontend.git
   cd Rondwell-Frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Create environment file** (if needed):

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your API endpoints and configuration.

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

---

## 💻 Development

### Running the Development Server

```bash
npm run dev
```

The development server includes:

- Hot Module Replacement (HMR)
- TypeScript checking
- Automatic file watching
- Browser auto-refresh

Visit `http://localhost:5173` in your browser.

### Type Checking

Ensure code quality with TypeScript checking:

```bash
npm run check
```

For continuous type checking:

```bash
npm run check:watch
```

### Code Formatting

Format all code with Prettier:

```bash
npm run format
```

### Linting

Check code quality with ESLint:

```bash
npm run lint
```

This runs both Prettier and ESLint checks.

### Project Structure Best Practices

- **Routes** - Use SvelteKit's file-based routing in `src/routes/`
- **Components** - Keep reusable components in `src/lib/components/`
- **Stores** - Use Svelte stores for global state in `src/lib/stores/`
- **Utils** - Place helper functions in `src/lib/utils/`
- **Styling** - Use Tailwind CSS classes; keep custom CSS minimal

---

## 🏗️ Building for Production

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Preview Production Build

Test the production build locally:

```bash
npm run preview
```

### Deployment

The application is configured for **Netlify deployment** via the `@sveltejs/adapter-netlify` adapter.

#### Automatic Deployment (Recommended)

Deployments are automatically triggered when code is merged to the **`main`** branch:

1. Create a feature branch from `main`
2. Make your changes and commit
3. Push to your feature branch
4. Open a pull request to `main`
5. Once merged to `main`, Netlify automatically:
   - Triggers a build
   - Runs `npm run build`
   - Deploys to production

**No manual deployment needed!** The process is fully automated.

#### Manual Deployment

If needed, you can also deploy manually:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### Deploy to Other Platforms

Change the adapter in `vite.config.ts` and `svelte.config.js`:

- **Static hosting** - Use `@sveltejs/adapter-static`
- **Vercel** - Use `@sveltejs/adapter-vercel`
- **AWS Amplify** - Configure accordingly

---

## 📦 Available Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start development server      |
| `npm run build`       | Build for production          |
| `npm run preview`     | Preview production build      |
| `npm run check`       | Check TypeScript and Svelte   |
| `npm run check:watch` | Watch mode for type checking  |
| `npm run format`      | Format code with Prettier     |
| `npm run lint`        | Lint with ESLint and Prettier |
| `npm run prepare`     | Prepare SvelteKit (auto-run)  |

---

## ✨ Features

### For Event Organizers

- Create and manage events
- Real-time event analytics
- Attendee management
- Ticket and pricing management
- Event promotion tools
- Post-event analytics and reports

### For Vendors & Exhibitors

- Booth creation and customization
- Product showcase
- Booking management
- Real-time bookings
- Analytics dashboard

### For Speakers

- Presentation management
- Schedule management
- Speaker profiles
- Interaction with attendees

### For Attendees

- Event discovery
- Event registration
- Real-time event information
- Community chat
- Personalized experience

### Platform Features

- **AI-Powered** - Smart recommendations and insights
- **Real-Time** - Live updates and notifications
- **Multi-Tenant** - Support for multiple organizations
- **Payment Integration** - Secure payment processing
- **Web3 Support** - NFT and blockchain integration
- **Analytics** - Comprehensive event analytics
- **Chat System** - Real-time communication
- **PWA Support** - Works offline and as standalone app
- **Dark Mode** - Theme toggle support
- **Responsive Design** - Mobile, tablet, and desktop support

---

## 🎨 Styling

### Tailwind CSS

This project uses **Tailwind CSS 4** for styling:

- Utility-first CSS framework
- Pre-configured with custom theme colors
- Extended with plugins:
  - `@tailwindcss/forms` - Form styling
  - `@tailwindcss/typography` - Rich text styling

### Applying Styles

```svelte
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click me
</button>
```

### Custom Styles

Add custom CSS in:

- `src/app.css` - Global styles
- Component `<style>` blocks - Component-scoped styles

### Theme Configuration

Edit `tailwind.config.ts` to customize:

- Colors
- Fonts
- Breakpoints
- Spacing
- etc.

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork the repository**

   ```bash
   git clone https://github.com/yourusername/Rondwell-Frontend.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Keep commits atomic and descriptive
   - Add/update tests as needed

4. **Format and lint your code**

   ```bash
   npm run format
   npm run lint
   ```

5. **Commit your changes**

   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Provide clear description of changes
   - Reference related issues
   - Include screenshots if UI changes

### Code Style Guidelines

- Use **TypeScript** for type safety
- Write **SFC (Single File Components)** in Svelte
- Use **Tailwind CSS** for styling
- Follow **Prettier** formatting
- Use descriptive variable and function names
- Keep functions small and focused

---

## 📄 License

This project is proprietary software owned by Rondwell. All rights reserved.
Live URL: https://rondwell.com

---

## 🔗 Related Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Svelte Documentation](https://svelte.dev/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

---

**Made with ❤️ by the Rondwell Team**

Last updated: February 2026
