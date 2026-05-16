# Drizzle Seed

> [!NOTE]
> `drizzle-seed` can only be used with `drizzle-orm@0.36.4` or higher. Versions lower than this may work at runtime but could have type issues and identity column issues, as this patch was introduced in `drizzle-orm@0.36.4`

## Documentation

The full API reference and package overview can be found in our [official documentation](https://orm.drizzle.team/docs/seed-overview)

## Overview

`drizzle-seed` is a TypeScript library that helps you generate deterministic, yet realistic,
fake data to populate your database. By leveraging a seedable pseudorandom number generator (pRNG),
it ensures that the data you generate is consistent and reproducible across different runs.
This is especially useful for testing, development, and debugging purposes.

#### What is Deterministic Data Generation?

Deterministic data generation means that the same input will always produce the same output.
In the context of `drizzle-seed`, when you initialize the library with the same seed number,
it will generate the same sequence of fake data every time. This allows for predictable and repeatable data sets.

#### Pseudorandom Number Generator (pRNG)

A pseudorandom number generator is an algorithm that produces a sequence of numbers
that approximates the properties of random numbers. However, because it's based on an initial value
called a seed, you can control its randomness. By using the same seed, the pRNG will produce the
same sequence of numbers, making your data generation process reproducible.

#### Benefits of Using a pRNG:

- Consistency: Ensures that your tests run on the same data every time.
- Debugging: Makes it easier to reproduce and fix bugs by providing a consistent data set.
- Collaboration: Team members can share seed numbers to work with the same data sets.

With drizzle-seed, you get the best of both worlds: the ability to generate realistic fake data and the control to reproduce it whenever needed.

## Supported Databases

`drizzle-seed` supports all databases that Drizzle ORM supports, including:

- **PostgreSQL** (using `pg`, `postgres`, `neon`, etc.)
- **MySQL** (using `mysql2`, `planetscale-serverless`, etc.)  
- **SQLite** (using `better-sqlite3`, `libsql`, etc.)
- **Cloudflare D1** (using `@cloudflare/d1` with Wrangler)

### Cloudflare D1 Support

`drizzle-seed` provides first-class support for Cloudflare D1 databases. You can use it seamlessly with your D1 databases in both local development and production environments:

```ts
import { drizzle } from 'drizzle-orm/d1';
import { seed } from 'drizzle-seed';
import * as schema from './schema';

// In your Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB, { schema });
    
    // Seed your D1 database
    await seed(db, schema, { count: 100 });
    
    return new Response('Database seeded!');
  },
};
```

For complete D1 integration examples, including Wrangler configuration, see our [Cloudflare D1 example](./examples/cloudflare-d1/README.md).

## Getting started

`npm install drizzle-seed`

You have to install `drizzle-orm` in order to use `drizzle-seed`.

`npm install drizzle-orm`

## Basic Usage

In this example we will create 10 users with random names and ids

```ts {12}
import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";

const users = pgTable("users", {
  id: integer().primaryKey(),
  name: text().notNull(),
});

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await seed(db, { users });
}

main();
```

## Options

**`count`**

By default, the `seed` function will create 10 entities.
However, if you need more for your tests, you can specify this in the seed options object

```ts
await seed(db, schema, { count: 1000 });
```

**`seed`**

If you need a seed to generate a different set of values for all subsequent runs, you can define a different number
in the `seed` option. Any new number will generate a unique set of values

```ts
await seed(db, schema, { seed: 12345 });
```

## Reset databases

With `drizzle-seed`, you can easily reset your database and seed it with new values, for example, in your test suites

```ts
// path to a file with schema you want to reset
import * as schema from "./schema.ts";
import { reset } from "drizzle-seed";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await reset(db, schema);
}

main();
```

More examples are available in our [official documentation](https://orm.drizzle.team/docs/seed-overview)