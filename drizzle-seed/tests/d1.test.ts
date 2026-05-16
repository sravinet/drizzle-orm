import { D1Database, D1DatabaseAPI } from '@miniflare/d1';
import { createSQLiteDB } from '@miniflare/shared';
import { sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle } from 'drizzle-orm/d1';
import { migrate } from 'drizzle-orm/d1/migrator';
import { beforeAll, beforeEach, expect, test } from 'vitest';
import { seed, reset } from '../dist/index.mjs';
import { d1Schema } from './d1Schema.ts';

const ENABLE_LOGGING = false;

let db: DrizzleD1Database;

beforeAll(async () => {
	const sqliteDb = await createSQLiteDB(':memory:');
	const d1db = new D1Database(new D1DatabaseAPI(sqliteDb));
	db = drizzle(d1db, { logger: ENABLE_LOGGING });

	// Create tables
	await db.run(sql.raw(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			created_at INTEGER
		)
	`));

	await db.run(sql.raw(`
		CREATE TABLE posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			content TEXT,
			user_id INTEGER NOT NULL,
			created_at INTEGER,
			FOREIGN KEY (user_id) REFERENCES users (id)
		)
	`));
});

beforeEach(async () => {
	await reset(db, d1Schema);
});

test('D1 seeding basic functionality', async () => {
	await seed(db, d1Schema, { count: 10 });

	const users = await db.select().from(d1Schema.users);
	const posts = await db.select().from(d1Schema.posts);

	expect(users.length).toBe(10);
	expect(posts.length).toBe(10);
	expect(users[0]?.id).toBeDefined();
	expect(users[0]?.name).toBeDefined();
	expect(posts[0]?.id).toBeDefined();
	expect(posts[0]?.userId).toBeDefined();
	expect(posts[0]?.title).toBeDefined();
});

test('D1 seeding with refinements', async () => {
	await seed(db, d1Schema, { count: 5 }).refine((funcs) => ({
		users: {
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
		},
	}));

	const users = await db.select().from(d1Schema.users);
	const posts = await db.select().from(d1Schema.posts);

	expect(users.length).toBe(5);
	expect(posts.length).toBe(5);
	expect(typeof users[0]?.name).toBe('string');
	expect(typeof users[0]?.email).toBe('string');
	expect(typeof posts[0]?.title).toBe('string');
	expect(typeof posts[0]?.content).toBe('string');
});

test('D1 seeding with relationships', async () => {
	await seed(db, d1Schema, { count: 3 }).refine((funcs) => ({
		users: {
			with: {
				posts: 2, // 2 posts per user
			},
		},
	}));

	const users = await db.select().from(d1Schema.users);
	const posts = await db.select().from(d1Schema.posts);

	expect(users.length).toBe(3);
	expect(posts.length).toBe(6); // 3 users * 2 posts per user

	// Verify relationships
	for (const post of posts) {
		const userExists = users.some(user => user.id === post.userId);
		expect(userExists).toBe(true);
	}
});

test('D1 reset functionality', async () => {
	// First seed some data
	await seed(db, d1Schema, { count: 5 });

	let users = await db.select().from(d1Schema.users);
	let posts = await db.select().from(d1Schema.posts);
	expect(users.length).toBe(5);
	expect(posts.length).toBe(5);

	// Reset the database
	await reset(db, d1Schema);

	users = await db.select().from(d1Schema.users);
	posts = await db.select().from(d1Schema.posts);
	expect(users.length).toBe(0);
	expect(posts.length).toBe(0);
});