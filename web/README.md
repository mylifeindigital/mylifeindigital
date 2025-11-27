# Hono Markdown Blog

A simple blog application built with Hono, TypeScript, and Markdown. Posts are stored as markdown files and rendered server-side using JSX.

## Features

- Server-side rendering with Hono JSX
- Markdown post support with frontmatter
- Clean, responsive design
- Easy to add new posts (just add `.md` files)

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

### Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Run the compiled application:

```bash
npm start
```

## Adding Posts

1. Create a new `.md` file in the `/posts` directory
2. Add optional frontmatter at the top:

```markdown
---
title: "My Post Title"
date: "2024-01-15"
author: "Your Name"
---

# My Post Title

Your markdown content here...
```

3. The post will automatically appear on the home page
4. Access it at `/posts/your-filename` (without the `.md` extension)

## Project Structure

```
/web
  ├── src/
  │   ├── index.ts              # Main application entry point
  │   ├── routes/
  │   │   ├── index.tsx         # Home page route
  │   │   └── posts/
  │   │       └── [slug].tsx    # Individual post route
  │   ├── components/
  │   │   └── Layout.tsx        # Base layout component
  │   └── utils/
  │       └── markdown.ts       # Markdown parsing utilities
  ├── posts/                    # Markdown post files
  ├── package.json
  ├── tsconfig.json
  └── README.md
```

## Technologies

- **Hono**: Fast web framework
- **TypeScript**: Type-safe JavaScript
- **Marked**: Markdown parser
- **JSX**: Server-side rendering

## License

ISC

