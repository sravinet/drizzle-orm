# Drizzle Seed + Cloudflare D1 Example

This example demonstrates how to use `drizzle-seed` with Cloudflare D1 databases using Wrangler for migrations and deployments.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Authenticate with Cloudflare**
   ```bash
   wrangler auth
   ```

3. **Create D1 database**
   ```bash
   npm run db:create
   ```
   
   This will output a database ID that you need to update in `wrangler.toml`.

4. **Update configuration**
   - Update `wrangler.toml` with your actual database ID
   - Set up environment variables for production (optional)

5. **Generate and apply migrations**
   ```bash
   npm run db:generate
   npm run db:migrate:local  # For local development
   npm run db:migrate:prod   # For production
   ```

## Development

1. **Start local development server**
   ```bash
   npm run dev
   ```

2. **Available endpoints**
   - `GET /` - Landing page with links
   - `GET /seed` - Seed database with sample data (100 records)
   - `GET /seed-with-refinements` - Advanced seeding with custom generators
   - `GET /reset` - Clear all data from database
   - `GET /health` - Check database connection

3. **Test seeding locally**
   ```bash
   npm run seed:local
   ```

## Production Deployment

1. **Deploy to Cloudflare Workers**
   ```bash
   npm run deploy
   ```

2. **Apply migrations to production database**
   ```bash
   npm run db:migrate:prod
   ```

3. **Seed production database**
   ```bash
   npm run seed:prod
   ```

## Key Features Demonstrated

### Basic Seeding
```typescript
await seed(db, schema, { count: 100 });
```

### Advanced Seeding with Custom Data
```typescript
await seed(db, schema, { count: 50, seed: 12345 }).refine((funcs) => ({
  users: {
    count: 25,
    columns: {
      name: funcs.firstName(),
      email: funcs.email(),
      bio: funcs.loremIpsum({ sentencesCount: 2 }),
    },
  },
  posts: {
    columns: {
      title: funcs.valuesFromArray({
        values: ['Getting Started with D1', 'Cloudflare Workers Guide'],
      }),
      content: funcs.loremIpsum({ sentencesCount: 5 }),
      published: funcs.boolean(),
    },
    with: {
      users: [
        { weight: 0.6, count: 1 }, // 60% chance for 1 post per user
        { weight: 0.3, count: 2 }, // 30% chance for 2 posts per user
        { weight: 0.1, count: 3 }, // 10% chance for 3 posts per user
      ],
    },
  },
}));
```

### Relationship Management
The seeder automatically handles foreign key relationships between:
- Users → Posts
- Categories → Posts
- Users → Comments
- Posts → Comments

### Database Reset
```typescript
import { reset } from 'drizzle-seed';
await reset(db, schema);
```

## Wrangler Commands Reference

| Command | Description |
|---------|-------------|
| `wrangler d1 create <name>` | Create new D1 database |
| `wrangler d1 list` | List all D1 databases |
| `wrangler d1 migrations apply <db> --local` | Apply migrations locally |
| `wrangler d1 migrations apply <db>` | Apply migrations to production |
| `wrangler d1 execute <db> --local --file=./file.sql` | Execute SQL file locally |
| `wrangler d1 execute <db> --command="SELECT * FROM users;"` | Execute SQL command |

## Environment Variables

For production deployment, set these environment variables:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
CLOUDFLARE_API_TOKEN=your-api-token
```

## Best Practices

1. **Always test migrations locally first**
2. **Use seeds for development and staging, not production data**
3. **Set a consistent seed value for reproducible data**
4. **Use the reset function carefully in production**
5. **Consider implementing backup strategies for production databases**

## Troubleshooting

### Common Issues

1. **"Database not found" error**
   - Ensure database ID in `wrangler.toml` matches your actual D1 database
   - Verify you're authenticated with the correct Cloudflare account

2. **Migration failures**
   - Check that your schema is valid SQLite syntax
   - Ensure foreign key constraints are properly defined

3. **Seeding timeouts**
   - Reduce batch size for large datasets
   - Consider breaking large seeds into smaller chunks

4. **Permission errors**
   - Verify your API token has D1 permissions
   - Check account ID is correct

## Related Documentation

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Seed Documentation](https://orm.drizzle.team/docs/seed-database)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)