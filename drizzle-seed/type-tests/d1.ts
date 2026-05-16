import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { seed, reset, getGeneratorsFunctions } from '../src/index.ts';

const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	content: text('content'),
	userId: integer('user_id').notNull().references(() => users.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

const schema = { users, posts };

// Mock D1 database for type testing
declare const db: DrizzleD1Database<typeof schema>;

// Test basic D1 seeding functionality
{
	await seed(db, schema);
	await seed(db, schema, { count: 10 });
	await seed(db, schema, { count: 10, seed: 123 });
	await seed(db, schema, { version: '1' });
	await seed(db, schema, { version: '2' });
}

// Test D1 seeding with refinements
{
	const funcs = getGeneratorsFunctions();
	
	await seed(db, schema, { count: 10 }).refine((funcs) => ({
		users: {
			count: 5,
			columns: {
				name: funcs.firstName(),
				email: funcs.email(),
			},
		},
		posts: {
			columns: {
				title: funcs.string(),
				content: funcs.loremIpsum({ sentencesCount: 3 }),
			},
			with: {
				users: 2,
			},
		},
	}));
}

// Test D1 database reset
{
	await reset(db, schema);
}

// Test relationship configuration with weighted distribution
{
	await seed(db, schema, { count: 10 }).refine((funcs) => ({
		posts: {
			with: {
				users: [
					{ weight: 0.5, count: 1 },
					{ weight: 0.3, count: 2 },
					{ weight: 0.2, count: 3 },
				],
			},
		},
	}));
}