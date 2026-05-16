/**
 * Cloudflare D1 Seeding Example with Wrangler
 * 
 * This example shows how to use drizzle-seed with Cloudflare D1
 * in a production environment with wrangler migrations.
 * 
 * Setup:
 * 1. Create your D1 database: `wrangler d1 create my-db`
 * 2. Update wrangler.toml with your database binding
 * 3. Generate migrations: `drizzle-kit generate`
 * 4. Apply migrations: `wrangler d1 migrations apply my-db --local`
 * 5. Run this seeder: `wrangler dev --local-protocol=https`
 * 
 * For production:
 * 1. Apply migrations: `wrangler d1 migrations apply my-db`
 * 2. Deploy and run seeder in production environment
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle } from 'drizzle-orm/d1';
import { seed } from 'drizzle-seed';
import * as schema from './schema';

interface Env {
	// Define your D1 database binding
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Initialize Drizzle with D1
		const db: DrizzleD1Database<typeof schema> = drizzle(env.DB, { schema });

		if (url.pathname === '/seed') {
			try {
				// Seed with basic configuration
				await seed(db, schema, { count: 100 });

				return new Response('Database seeded successfully!', {
					headers: { 'Content-Type': 'text/plain' },
				});
			} catch (error) {
				console.error('Seeding failed:', error);
				return new Response(`Seeding failed: ${error}`, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' },
				});
			}
		}

		if (url.pathname === '/seed-with-refinements') {
			try {
				// Advanced seeding with custom data generators
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
								values: [
									'Getting Started with D1',
									'Cloudflare Workers Guide',
									'Building Serverless Apps',
									'Database Migrations with Drizzle',
									'TypeScript Best Practices',
								],
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
					categories: {
						count: 5,
						columns: {
							name: funcs.valuesFromArray({
								values: ['Tech', 'Tutorial', 'News', 'Review', 'Guide'],
								isUnique: true,
							}),
							description: funcs.loremIpsum({ sentencesCount: 1 }),
						},
					},
				}));

				return new Response('Database seeded with custom data!', {
					headers: { 'Content-Type': 'text/plain' },
				});
			} catch (error) {
				console.error('Advanced seeding failed:', error);
				return new Response(`Seeding failed: ${error}`, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' },
				});
			}
		}

		if (url.pathname === '/reset') {
			try {
				// Import reset function
				const { reset } = await import('drizzle-seed');
				await reset(db, schema);

				return new Response('Database reset successfully!', {
					headers: { 'Content-Type': 'text/plain' },
				});
			} catch (error) {
				console.error('Reset failed:', error);
				return new Response(`Reset failed: ${error}`, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' },
				});
			}
		}

		// Health check endpoint
		if (url.pathname === '/health') {
			try {
				// Test database connection
				await db.select().from(schema.users).limit(1);
				return new Response('Database connection healthy', {
					headers: { 'Content-Type': 'text/plain' },
				});
			} catch (error) {
				return new Response(`Database connection failed: ${error}`, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' },
				});
			}
		}

		return new Response(`
			<h1>Drizzle Seed + Cloudflare D1 Example</h1>
			<p>Available endpoints:</p>
			<ul>
				<li><a href="/seed">GET /seed</a> - Basic seeding (100 records)</li>
				<li><a href="/seed-with-refinements">GET /seed-with-refinements</a> - Advanced seeding with custom generators</li>
				<li><a href="/reset">GET /reset</a> - Reset database (clear all data)</li>
				<li><a href="/health">GET /health</a> - Database health check</li>
			</ul>
		`, {
			headers: { 'Content-Type': 'text/html' },
		});
	},
};