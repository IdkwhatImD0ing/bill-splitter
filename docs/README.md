# Bill Splitter Documentation

Welcome to the Bill Splitter documentation. This guide provides comprehensive information about the application's architecture, features, pages, API routes, and setup instructions.

## Quick Start

1. [Environment Setup](./ENVIRONMENT.md) - Configure your development environment
2. [Architecture Overview](./ARCHITECTURE.md) - Understand the system design
3. [Features Guide](./FEATURES.md) - Learn about all available features

## Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | Tech stack, project structure, and data flow diagrams |
| [Pages](./PAGES.md) | Documentation for all application pages and routes |
| [API Routes](./API.md) | REST API endpoint documentation |
| [Server Actions](./SERVER-ACTIONS.md) | Next.js server actions reference |
| [Features](./FEATURES.md) | Comprehensive feature documentation |
| [Components](./COMPONENTS.md) | UI and feature component reference |
| [Database](./DATABASE.md) | Database schema and migrations |
| [Environment](./ENVIRONMENT.md) | Environment variables and setup guide |

## Project Overview

Bill Splitter is a web application designed to help users split bills and track who owes what. Key capabilities include:

- **Receipt Management**: Create, view, and manage receipts with optional images
- **Bill Splitting**: Add people and track individual amounts owed
- **AI Analysis**: Automatically calculate splits from receipt images or text descriptions
- **Public Sharing**: Generate shareable links for friends to view bills
- **Payment Tracking**: Mark items as paid to track payment status

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: JWT-based password authentication
- **AI**: OpenAI GPT-5.2 for receipt analysis

## Application Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Dashboard  │────▶│  Receipt    │
│   /login    │     │      /      │     │  /receipts/ │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Public Bill │◀────│   Share     │
                    │  /bill/[id] │     │   Button    │
                    └─────────────┘     └─────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Taxes

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

### Environment Variables

See [Environment Setup](./ENVIRONMENT.md) for detailed configuration instructions.

## Contributing

When contributing to this project, please:

1. Follow the existing code style and conventions
2. Update documentation for any new features
3. Test changes thoroughly before submitting

## Support

For questions or issues, please refer to the relevant documentation section or open an issue in the repository.

