# Scaling Content Beyond 20 Posts

This document explores options for managing content as the number of posts grows beyond what's practical to embed in a single TypeScript file.

## Current Approach: Embedded Content

The current implementation embeds all content directly into `web/src/utils/posts-data.ts`:

```typescript
export const siteContent: SiteContent = {
  sections: [...],
  allItems: [
    {
      slug: "post-name",
      metadata: { title: "...", date: "...", ... },
      content: "... raw markdown ...",
      html: "... rendered HTML ..."
    },
    // ... more items
  ]
};
```

### Why This Works Now

- Simple build process
- No runtime dependencies
- All content available instantly
- No external API calls
- Works within Cloudflare Workers (no filesystem access)

### When It Becomes a Problem

| Posts | Est. File Size | Bundle Impact | Concern Level |
|-------|----------------|---------------|---------------|
| 10 | ~50-100 KB | Minimal | Low |
| 20 | ~100-200 KB | Noticeable | Medium |
| 50 | ~250-500 KB | Significant | High |
| 100+ | ~500 KB - 1 MB+ | Critical | Very High |

**Cloudflare Workers limits to be aware of:**
- **Worker size limit:** 10 MB (compressed), but 1 MB uncompressed is recommended
- **Memory limit:** 128 MB
- **CPU time:** 10-50ms (varies by plan)

---

## Option 1: Keep Embedded, Split by Section (Quick Win)

Instead of one massive file, generate separate files per section:

```
src/utils/content/
  ├── posts.ts           # Only posts content
  ├── technical-sessions.ts
  └── index.ts           # Re-exports + metadata only
```

### Implementation

```typescript
// build-posts.ts modifications
function generateSectionFiles(sections: Section[], outputDir: string): void {
    for (const section of sections) {
        const sectionFile = `
export const ${section.slug}Content = ${JSON.stringify(section.items, null, 2)};
`;
        writeFileSync(join(outputDir, `${section.slug}.ts`), sectionFile);
    }
    
    // Generate index with metadata only (for listing pages)
    const indexFile = `
export const sectionMetadata = ${JSON.stringify(
    sections.map(s => ({
        slug: s.slug,
        title: s.title,
        count: s.items.length,
        items: s.items.map(i => ({
            slug: i.slug,
            title: i.metadata.title,
            date: i.metadata.date,
            description: i.metadata.description,
        }))
    }))
)};
`;
    writeFileSync(join(outputDir, 'index.ts'), indexFile);
}
```

### Pros/Cons

| Pros | Cons |
|------|------|
| Minimal changes to current approach | Still grows linearly with content |
| Better code splitting | Doesn't fundamentally solve the problem |
| Lazy loading possible | All content still in bundle |

**Best for:** 20-50 posts, buying time before a larger migration

---

## Option 2: Cloudflare KV (Key-Value Store)

Store content in Cloudflare's globally distributed key-value store.

### Architecture

```
Build Time:
  Markdown files → build-posts.ts → Upload to KV

Runtime:
  Request → Worker → KV.get(slug) → Return content
```

### Implementation

**1. Setup KV namespace in `wrangler.toml`:**

```toml
[[kv_namespaces]]
binding = "CONTENT_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

**2. Build script uploads to KV:**

```typescript
// build-posts-kv.ts
import { writeFileSync } from 'fs';

interface KVUploadItem {
    key: string;
    value: string;
    metadata?: Record<string, unknown>;
}

function generateKVUploadFile(sections: Section[]): void {
    const uploads: KVUploadItem[] = [];
    
    // Upload individual posts
    for (const section of sections) {
        for (const item of section.items) {
            uploads.push({
                key: `post:${section.slug}:${item.slug}`,
                value: JSON.stringify({
                    content: item.content,
                    html: item.html,
                }),
                metadata: {
                    title: item.metadata.title,
                    date: item.metadata.date,
                    section: section.slug,
                },
            });
        }
    }
    
    // Upload section indexes (for listing pages)
    for (const section of sections) {
        uploads.push({
            key: `index:${section.slug}`,
            value: JSON.stringify(section.items.map(i => ({
                slug: i.slug,
                title: i.metadata.title,
                date: i.metadata.date,
                description: i.metadata.description,
            }))),
        });
    }
    
    // Write bulk upload file for wrangler
    writeFileSync('kv-upload.json', JSON.stringify(uploads, null, 2));
}

// Then run: wrangler kv:bulk put --binding CONTENT_KV kv-upload.json
```

**3. Worker reads from KV:**

```typescript
// In your Hono route
import { Hono } from 'hono';

interface Env {
    CONTENT_KV: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/:section/:slug', async (c) => {
    const { section, slug } = c.req.param();
    
    // Get post content from KV
    const content = await c.env.CONTENT_KV.get(
        `post:${section}:${slug}`,
        { type: 'json' }
    );
    
    if (!content) {
        return c.notFound();
    }
    
    // Get metadata from KV metadata
    const { value, metadata } = await c.env.CONTENT_KV.getWithMetadata(
        `post:${section}:${slug}`,
        { type: 'json' }
    );
    
    return c.html(renderPost(value, metadata));
});

app.get('/:section', async (c) => {
    const { section } = c.req.param();
    
    // Get section index
    const index = await c.env.CONTENT_KV.get(
        `index:${section}`,
        { type: 'json' }
    );
    
    return c.html(renderSectionList(section, index));
});
```

### KV Pricing & Limits

| Aspect | Free Tier | Paid |
|--------|-----------|------|
| Storage | 1 GB | 10+ GB |
| Reads | 100,000/day | Unlimited (billed) |
| Writes | 1,000/day | Unlimited (billed) |
| Value size | 25 MB max | 25 MB max |
| Metadata | 1 KB per key | 1 KB per key |

### Pros/Cons

| Pros | Cons |
|------|------|
| Globally distributed, low latency | Eventually consistent (rare stale reads) |
| Scales to thousands of posts | Adds KV read latency (~10-50ms) |
| Worker bundle stays small | More complex build/deploy process |
| Metadata stored separately | Requires KV namespace management |
| Pay only for what you use | |

**Best for:** 50-500+ posts, read-heavy workloads

---

## Option 3: Cloudflare R2 (Object Storage)

Store content as objects in Cloudflare's S3-compatible storage.

### Architecture

```
Build Time:
  Markdown files → build-posts.ts → Upload to R2

Runtime:
  Request → Worker → R2.get(key) → Return content
```

### Implementation

**1. Setup R2 bucket in `wrangler.toml`:**

```toml
[[r2_buckets]]
binding = "CONTENT_BUCKET"
bucket_name = "mylifeindigital-content"
preview_bucket_name = "mylifeindigital-content-preview"
```

**2. Build script uploads to R2:**

```typescript
// build-posts-r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadToR2(sections: Section[]): Promise<void> {
    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
    
    for (const section of sections) {
        for (const item of section.items) {
            await client.send(new PutObjectCommand({
                Bucket: 'mylifeindigital-content',
                Key: `${section.slug}/${item.slug}.json`,
                Body: JSON.stringify(item),
                ContentType: 'application/json',
            }));
        }
        
        // Upload section index
        await client.send(new PutObjectCommand({
            Bucket: 'mylifeindigital-content',
            Key: `${section.slug}/_index.json`,
            Body: JSON.stringify(section.items.map(i => ({
                slug: i.slug,
                metadata: i.metadata,
            }))),
            ContentType: 'application/json',
        }));
    }
}
```

**3. Worker reads from R2:**

```typescript
interface Env {
    CONTENT_BUCKET: R2Bucket;
}

app.get('/:section/:slug', async (c) => {
    const { section, slug } = c.req.param();
    
    const object = await c.env.CONTENT_BUCKET.get(`${section}/${slug}.json`);
    
    if (!object) {
        return c.notFound();
    }
    
    const content = await object.json();
    return c.html(renderPost(content));
});
```

### R2 Pricing & Limits

| Aspect | Free Tier | Paid |
|--------|-----------|------|
| Storage | 10 GB | $0.015/GB/month |
| Class A ops (write) | 1M/month | $4.50/million |
| Class B ops (read) | 10M/month | $0.36/million |
| Egress | Free | Free |
| Object size | 5 TB max | 5 TB max |

### Pros/Cons

| Pros | Cons |
|------|------|
| Very cheap storage | Slightly higher latency than KV |
| S3-compatible API | More complex than KV |
| Good for large content | No built-in metadata like KV |
| Unlimited object size | |

**Best for:** Very large content (images, files), 100+ posts

---

## Option 4: Cloudflare D1 (SQLite Database)

Store content in Cloudflare's serverless SQLite database.

### Architecture

```
Build Time:
  Markdown files → build-posts.ts → INSERT into D1

Runtime:
  Request → Worker → D1.query() → Return content
```

### Implementation

**1. Setup D1 in `wrangler.toml`:**

```toml
[[d1_databases]]
binding = "DB"
database_name = "mylifeindigital"
database_id = "your-database-id"
```

**2. Create schema:**

```sql
-- migrations/0001_create_tables.sql
CREATE TABLE sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    section_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date TEXT,
    author TEXT,
    description TEXT,
    tags TEXT, -- JSON array
    content TEXT NOT NULL,
    html TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id),
    UNIQUE(section_id, slug)
);

CREATE INDEX idx_posts_section ON posts(section_id);
CREATE INDEX idx_posts_date ON posts(date DESC);

-- Full-text search (optional)
CREATE VIRTUAL TABLE posts_fts USING fts5(
    title, 
    content,
    content='posts',
    content_rowid='id'
);
```

**3. Build script inserts to D1:**

```typescript
// build-posts-d1.ts
import { execSync } from 'child_process';

function generateD1Migrations(sections: Section[]): void {
    const statements: string[] = [];
    
    // Insert sections
    for (const section of sections) {
        statements.push(`
            INSERT OR REPLACE INTO sections (slug, title) 
            VALUES ('${section.slug}', '${escape(section.title)}');
        `);
    }
    
    // Insert posts
    for (const section of sections) {
        for (const item of section.items) {
            statements.push(`
                INSERT OR REPLACE INTO posts 
                (slug, section_id, title, date, author, description, tags, content, html)
                VALUES (
                    '${item.slug}',
                    (SELECT id FROM sections WHERE slug = '${section.slug}'),
                    '${escape(item.metadata.title)}',
                    '${item.metadata.date || ''}',
                    '${escape(item.metadata.author || '')}',
                    '${escape(item.metadata.description || '')}',
                    '${JSON.stringify(item.metadata.tags || [])}',
                    '${escape(item.content)}',
                    '${escape(item.html)}'
                );
            `);
        }
    }
    
    writeFileSync('migrations/seed.sql', statements.join('\n'));
}

function escape(str: string): string {
    return str.replace(/'/g, "''");
}

// Run: wrangler d1 execute mylifeindigital --file=migrations/seed.sql
```

**4. Worker queries D1:**

```typescript
interface Env {
    DB: D1Database;
}

app.get('/:section/:slug', async (c) => {
    const { section, slug } = c.req.param();
    
    const result = await c.env.DB.prepare(`
        SELECT p.*, s.title as section_title
        FROM posts p
        JOIN sections s ON p.section_id = s.id
        WHERE s.slug = ? AND p.slug = ?
    `).bind(section, slug).first();
    
    if (!result) {
        return c.notFound();
    }
    
    return c.html(renderPost(result));
});

app.get('/:section', async (c) => {
    const { section } = c.req.param();
    
    const results = await c.env.DB.prepare(`
        SELECT p.slug, p.title, p.date, p.description
        FROM posts p
        JOIN sections s ON p.section_id = s.id
        WHERE s.slug = ?
        ORDER BY p.date DESC
    `).bind(section).all();
    
    return c.html(renderSectionList(section, results.results));
});

// Bonus: Full-text search
app.get('/search', async (c) => {
    const query = c.req.query('q');
    
    const results = await c.env.DB.prepare(`
        SELECT p.slug, p.title, snippet(posts_fts, 1, '<mark>', '</mark>', '...', 32) as excerpt
        FROM posts_fts
        JOIN posts p ON posts_fts.rowid = p.id
        WHERE posts_fts MATCH ?
        ORDER BY rank
        LIMIT 20
    `).bind(query).all();
    
    return c.json(results.results);
});
```

### D1 Pricing & Limits

| Aspect | Free Tier | Paid |
|--------|-----------|------|
| Storage | 5 GB | $0.75/GB/month |
| Rows read | 5M/day | $0.001/million |
| Rows written | 100K/day | $1.00/million |
| Database size | 2 GB max | 2 GB max |

### Pros/Cons

| Pros | Cons |
|------|------|
| Full SQL querying | More complex setup |
| Full-text search built-in | 2 GB database limit |
| Relational data model | Learning curve if unfamiliar with SQL |
| Good for complex queries | Slightly higher latency than KV |
| Filtering, sorting, pagination |

**Best for:** Complex querying needs, search functionality, 100-1000+ posts

---

## Option 5: Hybrid Approach (Recommended)

Combine embedded metadata with external content storage.

### Architecture

```
Bundle (small):
  - Section metadata
  - Post metadata (title, date, slug, description)
  - No full content or HTML

KV/R2/D1 (external):
  - Full markdown content
  - Rendered HTML
```

### Implementation

```typescript
// posts-data.ts (kept small)
export const siteMetadata = {
    sections: [
        {
            slug: 'posts',
            title: 'Posts',
            items: [
                { slug: 'my-post', title: 'My Post', date: '2026-01-01', description: '...' },
                // Metadata only, no content/html
            ]
        }
    ]
};

// Route handler
app.get('/:section/:slug', async (c) => {
    const { section, slug } = c.req.param();
    
    // Quick validation from embedded metadata
    const sectionData = siteMetadata.sections.find(s => s.slug === section);
    const postMeta = sectionData?.items.find(i => i.slug === slug);
    
    if (!postMeta) {
        return c.notFound();
    }
    
    // Fetch full content from KV
    const content = await c.env.CONTENT_KV.get(`${section}:${slug}`, { type: 'json' });
    
    return c.html(renderPost({ ...postMeta, ...content }));
});
```

### Pros/Cons

| Pros | Cons |
|------|------|
| Fast listing pages (no KV calls) | Two data sources to maintain |
| Small bundle size | Build process more complex |
| Full content only fetched when needed | |
| Best of both worlds | |

---

## Comparison Summary

| Approach | Complexity | Scalability | Latency | Cost | Best For |
|----------|------------|-------------|---------|------|----------|
| Embedded | Low | Poor (>50 posts) | Fastest | Free | <50 posts |
| Split Files | Low | Medium | Fast | Free | 20-50 posts |
| KV | Medium | Excellent | ~10-50ms | Low | 50-500 posts |
| R2 | Medium | Excellent | ~20-100ms | Very Low | Large files |
| D1 | High | Good | ~10-50ms | Low | Complex queries |
| Hybrid | Medium | Excellent | Fast | Low | 50+ posts |

---

## Recommendation Path

1. **Now (8 posts):** Keep current embedded approach
2. **At 20 posts:** Consider split files or start KV migration
3. **At 50 posts:** Migrate to KV or Hybrid
4. **At 100+ posts with search needs:** Consider D1

### Migration Checklist

When ready to migrate:

- [ ] Choose storage option based on needs
- [ ] Update `wrangler.toml` with bindings
- [ ] Modify build script to upload content
- [ ] Update route handlers to fetch from storage
- [ ] Add caching strategy (Cache API or cache headers)
- [ ] Test locally with `wrangler dev`
- [ ] Deploy and verify

---

## References

- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
