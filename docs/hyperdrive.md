---
title: Hyperdrive
description: Accelerate access to your existing databases from Cloudflare Workers with Hyperdrive's global connection pooling and query caching.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Hyperdrive

Turn your existing regional database into a globally distributed database.

 Available on Free and Paid plans 

Hyperdrive is a service that accelerates queries you make to existing databases, making it faster to access your data from across the globe from [Cloudflare Workers](https://developers.cloudflare.com/workers/), irrespective of your users' location.

Hyperdrive supports any Postgres or MySQL database, including those hosted on AWS, Google Cloud, Azure, Neon and PlanetScale. Hyperdrive also supports Postgres-compatible databases like CockroachDB and Timescale. You do not need to write new code or replace your favorite tools: Hyperdrive works with your existing code and tools you use.

Use Hyperdrive's connection string from your Cloudflare Workers application with your existing Postgres drivers and object-relational mapping (ORM) libraries:

* [ PostgreSQL ](#tab-panel-5842)
* [ MySQL ](#tab-panel-5843)

* [ index.ts ](#tab-panel-5838)
* [ wrangler.jsonc ](#tab-panel-5839)

TypeScript

```

import { Client } from "pg";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();

      // Sample SQL query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json(result.rows);

    } catch (e) {

      return Response.json({ error: e instanceof Error ? e.message : e }, { status: 500 });

    }

  },

} satisfies ExportedHandler<{ HYPERDRIVE: Hyperdrive }>;


```

```

  {

    "$schema": "node_modules/wrangler/config-schema.json",

    "name": "WORKER-NAME",

    "main": "src/index.ts",

    "compatibility_date": "2025-02-04",

    "compatibility_flags": [

      "nodejs_compat"

    ],

    "observability": {

      "enabled": true

    },

    "hyperdrive": [

      {

        "binding": "HYPERDRIVE",

        "id": "<YOUR_HYPERDRIVE_ID>",

        "localConnectionString": "<ENTER_LOCAL_CONNECTION_STRING_FOR_LOCAL_DEVELOPMENT_HERE>"

      }

    ]

  }


```

* [ index.ts ](#tab-panel-5840)
* [ wrangler.jsonc ](#tab-panel-5841)

TypeScript

```

import { createConnection } from 'mysql2/promise';


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const connection = await createConnection({

     host: env.HYPERDRIVE.host,

     user: env.HYPERDRIVE.user,

     password: env.HYPERDRIVE.password,

     database: env.HYPERDRIVE.database,

     port: env.HYPERDRIVE.port,


     // This is needed to use mysql2 with Workers

     // This configures mysql2 to use static parsing instead of eval() parsing (not available on Workers)

     disableEval: true

  });


  const [results, fields] = await connection.query('SHOW tables;');


  return new Response(JSON.stringify({ results, fields }), {

    headers: {

      'Content-Type': 'application/json',

      'Access-Control-Allow-Origin': '\*',

    },

  });

}} satisfies ExportedHandler<{ HYPERDRIVE: Hyperdrive }>;


```

```

  {

    "$schema": "node_modules/wrangler/config-schema.json",

    "name": "WORKER-NAME",

    "main": "src/index.ts",

    "compatibility_date": "2025-02-04",

    "compatibility_flags": [

      "nodejs_compat"

    ],

    "observability": {

      "enabled": true

    },

    "hyperdrive": [

      {

        "binding": "HYPERDRIVE",

        "id": "<YOUR_HYPERDRIVE_ID>",

        "localConnectionString": "<ENTER_LOCAL_CONNECTION_STRING_FOR_LOCAL_DEVELOPMENT_HERE>"

      }

    ]

  }


```

[ Get started ](https://developers.cloudflare.com/hyperdrive/get-started/) 

---

## Features

###  Connect your database 

Connect Hyperdrive to your existing database and deploy a [Worker](https://developers.cloudflare.com/workers/) that queries it.

[ Connect Hyperdrive to your database ](https://developers.cloudflare.com/hyperdrive/get-started/) 

###  PostgreSQL support 

Hyperdrive allows you to connect to any PostgreSQL or PostgreSQL-compatible database.

[ Connect Hyperdrive to your PostgreSQL database ](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/) 

###  MySQL support 

Hyperdrive allows you to connect to any MySQL database.

[ Connect Hyperdrive to your MySQL database ](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/) 

###  Query Caching 

Default-on caching for your most popular queries executed against your database.

[ Learn about Query Caching ](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/) 

---

## Related products

**[Workers](https://developers.cloudflare.com/workers/)** 

Build serverless applications and deploy instantly across the globe for exceptional performance, reliability, and scale.

**[Pages](https://developers.cloudflare.com/pages/)** 

Deploy dynamic front-end applications in record time.

---

## More resources

[Pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/) 

Learn about Hyperdrive's pricing.

[Limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) 

Learn about Hyperdrive limits.

[Storage options](https://developers.cloudflare.com/workers/platform/storage-options/) 

Learn more about the storage and database options you can build on with Workers.

[Developer Discord](https://discord.cloudflare.com) 

Connect with the Workers community on Discord to ask questions, show what you are building, and discuss the platform with other developers.

[@CloudflareDev](https://x.com/cloudflaredev) 

Follow @CloudflareDev on Twitter to learn about product announcements, and what is new in Cloudflare Developer Platform.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}}]}
```

---

---
title: Getting started
description: Create your first Hyperdrive configuration and connect a Cloudflare Worker to your database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Getting started

Hyperdrive accelerates access to your existing databases from Cloudflare Workers, making even single-region databases feel globally distributed.

By maintaining a connection pool to your database within Cloudflare's network, Hyperdrive reduces seven round-trips to your database before you can even send a query: the TCP handshake (1x), TLS negotiation (3x), and database authentication (3x).

Hyperdrive understands the difference between read and write queries to your database, and caches the most common read queries, improving performance and reducing load on your origin database.

This guide will instruct you through:

* Creating your first Hyperdrive configuration.
* Creating a [Cloudflare Worker](https://developers.cloudflare.com/workers/) and binding it to your Hyperdrive configuration.
* Establishing a database connection from your Worker to a public database.

Note

Hyperdrive currently works with PostgreSQL, MySQL and many compatible databases. This includes CockroachDB and Materialize (which are PostgreSQL-compatible), and PlanetScale.

Learn more about the [databases that Hyperdrive supports](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features).

## Prerequisites

Before you begin, ensure you have completed the following:

1. Sign up for a [Cloudflare account ↗](https://dash.cloudflare.com/sign-up/workers-and-pages) if you have not already.
2. Install [Node.js ↗](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). Use a Node version manager like [nvm ↗](https://github.com/nvm-sh/nvm) or [Volta ↗](https://volta.sh/) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) requires a Node version of `16.17.0` or later.
3. Have a publicly accessible PostgreSQL or MySQL (or compatible) database. _If your database is in a private network_, refer to [Connect to a private database using Workers VPC](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database-vpc/).

## 1\. Log in

Before creating your Hyperdrive binding, log in with your Cloudflare account by running:

Terminal window

```

npx wrangler login


```

You will be directed to a web page asking you to log in to the Cloudflare dashboard. After you have logged in, you will be asked if Wrangler can make changes to your Cloudflare account. Scroll down and select **Allow** to continue.

## 2\. Create a Worker

New to Workers?

Refer to [How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/) to learn about the Workers serverless execution model works. Go to the [Workers Get started guide](https://developers.cloudflare.com/workers/get-started/guide/) to set up your first Worker.

Create a new project named `hyperdrive-tutorial` by running:

 npm  yarn  pnpm 

```
npm create cloudflare@latest -- hyperdrive-tutorial
```

```
yarn create cloudflare hyperdrive-tutorial
```

```
pnpm create cloudflare@latest hyperdrive-tutorial
```

For setup, select the following options:

* For _What would you like to start with?_, choose `Hello World example`.
* For _Which template would you like to use?_, choose `Worker only`.
* For _Which language do you want to use?_, choose `TypeScript`.
* For _Do you want to use git for version control?_, choose `Yes`.
* For _Do you want to deploy your application?_, choose `No` (we will be making some changes before deploying).

This will create a new `hyperdrive-tutorial` directory. Your new `hyperdrive-tutorial` directory will include:

* A `"Hello World"` [Worker](https://developers.cloudflare.com/workers/get-started/guide/#3-write-code) at `src/index.ts`.
* A [wrangler.jsonc](https://developers.cloudflare.com/workers/wrangler/configuration/) configuration file. `wrangler.jsonc` is how your `hyperdrive-tutorial` Worker will connect to Hyperdrive.

### Enable Node.js compatibility

[Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) is required for database drivers, and needs to be configured for your Workers project.

To enable both built-in runtime APIs and polyfills for your Worker or Pages project, add the [nodejs\_compat](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) [compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) to your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/), and set your compatibility date to September 23rd, 2024 or later. This will enable [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) for your Workers project.

* [  wrangler.jsonc ](#tab-panel-6037)
* [  wrangler.toml ](#tab-panel-6038)

JSONC

```

{

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30"

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


```

## 3\. Connect Hyperdrive to a database

Hyperdrive works by connecting to your database, pooling database connections globally, and speeding up your database access through Cloudflare's network.

It will provide a secure connection string that is only accessible from your Worker which you can use to connect to your database through Hyperdrive. This means that you can use the Hyperdrive connection string with your existing drivers or ORM libraries without needing significant changes to your code.

To create your first Hyperdrive database configuration, change into the directory you just created for your Workers project:

Terminal window

```

cd hyperdrive-tutorial


```

To create your first Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`).
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres` or `mysql`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

* [ PostgreSQL ](#tab-panel-6031)
* [ MySQL ](#tab-panel-6032)

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can copy-and-paste directly into Hyperdrive.

To create a Hyperdrive connection, run the `wrangler` command, replacing the placeholder values passed to the `--connection-string` flag with the values of your existing database:

Terminal window

```

npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


```

```

mysql://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can copy-and-paste directly into Hyperdrive.

To create a Hyperdrive connection, run the `wrangler` command, replacing the placeholder values passed to the `--connection-string` flag with the values of your existing database:

Terminal window

```

npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


```

Manage caching

By default, Hyperdrive will cache query results. If you wish to disable caching, pass the flag `--caching-disabled`.

Alternatively, you can use the `--max-age` flag to specify the maximum duration (in seconds) for which items should persist in the cache, before they are evicted. Default value is 60 seconds.

Refer to [Hyperdrive Wrangler commands](https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/) for more information.

If successful, the command will output your new Hyperdrive configuration:

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<example id: 57b7076f58be42419276f058a8968187>"

    }

  ]

}


```

Copy the `id` field: you will use this in the next step to make Hyperdrive accessible from your Worker script.

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 4\. Bind your Worker to Hyperdrive

You must create a binding in your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) for your Worker to connect to your Hyperdrive configuration. [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) allow your Workers to access resources, like Hyperdrive, on the Cloudflare developer platform.

To bind your Hyperdrive configuration to your Worker, add the following to the end of your Wrangler file:

* [  wrangler.jsonc ](#tab-panel-6039)
* [  wrangler.toml ](#tab-panel-6040)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>" // the ID associated with the Hyperdrive you just created

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_DATABASE_ID>"


```

Specifically:

* The value (string) you set for the `binding` (binding name) will be used to reference this database in your Worker. In this tutorial, name your binding `HYPERDRIVE`.
* The binding must be [a valid JavaScript variable name ↗](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar%5Fand%5Ftypes#variables). For example, `binding = "hyperdrive"` or `binding = "productionDB"` would both be valid names for the binding.
* Your binding is available in your Worker at `env.<BINDING_NAME>`.

If you wish to use a local database during development, you can add a `localConnectionString` to your Hyperdrive configuration with the connection string of your database:

* [  wrangler.jsonc ](#tab-panel-6041)
* [  wrangler.toml ](#tab-panel-6042)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>", // the ID associated with the Hyperdrive you just created

      "localConnectionString": "<LOCAL_DATABASE_CONNECTION_URI>"

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_DATABASE_ID>"

localConnectionString = "<LOCAL_DATABASE_CONNECTION_URI>"


```

Note

Learn more about setting up [Hyperdrive for local development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/).

## 5\. Run a query against your database

Once you have created a Hyperdrive configuration and bound it to your Worker, you can run a query against your database.

### Install a database driver

* [ PostgreSQL ](#tab-panel-6035)
* [ MySQL ](#tab-panel-6036)

To connect to your database, you will need a database driver which allows you to authenticate and query your database. For this tutorial, you will use [node-postgres (pg) ↗](https://node-postgres.com/), one of the most widely used PostgreSQL drivers.

To install `pg`, ensure you are in the `hyperdrive-tutorial` directory. Open your terminal and run the following command:

 npm  yarn  pnpm  bun 

```
# This should install v8.13.0 or later
npm i pg
```

```
# This should install v8.13.0 or later
yarn add pg
```

```
# This should install v8.13.0 or later
pnpm add pg
```

```
# This should install v8.13.0 or later
bun add pg
```

If you are using TypeScript, you should also install the type definitions for `pg`:

 npm  yarn  pnpm  bun 

```
# This should install v8.13.0 or later
npm i -D @types/pg
```

```
# This should install v8.13.0 or later
yarn add -D @types/pg
```

```
# This should install v8.13.0 or later
pnpm add -D @types/pg
```

```
# This should install v8.13.0 or later
bun add -d @types/pg
```

With the driver installed, you can now create a Worker script that queries your database.

To connect to your database, you will need a database driver which allows you to authenticate and query your database. For this tutorial, you will use [mysql2 ↗](https://github.com/sidorares/node-mysql2), one of the most widely used MySQL drivers.

To install `mysql2`, ensure you are in the `hyperdrive-tutorial` directory. Open your terminal and run the following command:

 npm  yarn  pnpm  bun 

```
# This should install v3.13.0 or later
npm i mysql2
```

```
# This should install v3.13.0 or later
yarn add mysql2
```

```
# This should install v3.13.0 or later
pnpm add mysql2
```

```
# This should install v3.13.0 or later
bun add mysql2
```

With the driver installed, you can now create a Worker script that queries your database.

### Write a Worker

* [ PostgreSQL ](#tab-panel-6033)
* [ MySQL ](#tab-panel-6034)

After you have set up your database, you will run a SQL query from within your Worker.

Go to your `hyperdrive-tutorial` Worker and open the `index.ts` file.

The `index.ts` file is where you configure your Worker's interactions with Hyperdrive.

Populate your `index.ts` file with the following code:

TypeScript

```

// pg 8.13.0 or later is recommended

import { Client } from "pg";


export interface Env {

  // If you set another name in the Wrangler config file as the value for 'binding',

  // replace "HYPERDRIVE" with the variable name you defined.

  HYPERDRIVE: Hyperdrive;

}


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new client on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new client is fast.

    const sql = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await sql.connect();


      // Sample query

      const results = await sql.query(`SELECT * FROM pg_tables`);


      // Return result rows as JSON

      return Response.json(results.rows);

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Upon receiving a request, the code above does the following:

1. Creates a new database client configured to connect to your database via Hyperdrive, using the Hyperdrive connection string.
2. Initiates a query via `await sql.query()` that outputs all tables (user and system created) in the database (as an example query).
3. Returns the response as JSON to the client. Hyperdrive automatically cleans up the client connection when the request ends, and keeps the underlying database connection open in its pool for reuse.

After you have set up your database, you will run a SQL query from within your Worker.

Go to your `hyperdrive-tutorial` Worker and open the `index.ts` file.

The `index.ts` file is where you configure your Worker's interactions with Hyperdrive.

Populate your `index.ts` file with the following code:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export interface Env {

  // If you set another name in the Wrangler config file as the value for 'binding',

  // replace "HYPERDRIVE" with the variable name you defined.

  HYPERDRIVE: Hyperdrive;

}


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // The following line is needed for mysql2 compatibility with Workers

      // mysql2 uses eval() to optimize result parsing for rows with > 100 columns

      // Configure mysql2 to use static parsing instead of eval() parsing with disableEval

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return new Response(JSON.stringify({ results, fields }), {

        headers: {

          "Content-Type": "application/json",

          "Access-Control-Allow-Origin": "*",

        },

      });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Upon receiving a request, the code above does the following:

1. Creates a new database client configured to connect to your database via Hyperdrive, using the Hyperdrive connection string.
2. Initiates a query via `await connection.query` that outputs all tables (user and system created) in the database (as an example query).
3. Returns the response as JSON to the client. Hyperdrive automatically cleans up the client connection when the request ends, and keeps the underlying database connection open in its pool for reuse.

### Run in development mode (optional)

You can test your Worker locally before deploying by running `wrangler dev`. This runs your Worker code on your machine while connecting to your database.

The `localConnectionString` field works with both local and remote databases and allows you to connect directly to your database from your Worker project running locally. You must specify the SSL/TLS mode if required (`sslmode=require` for Postgres, `sslMode=REQUIRED` for MySQL).

To connect to a database during local development, configure `localConnectionString` in your `wrangler.jsonc`:

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "your-hyperdrive-id",

      "localConnectionString": "postgres://user:password@your-database-host:5432/database",

    },

  ],

}


```

Or set an environment variable:

Terminal window

```

export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://user:password@your-database-host:5432/database"


```

Then start local development:

Terminal window

```

npx wrangler dev


```

Note

When using `wrangler dev` with `localConnectionString` or `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`, Hyperdrive caching does not take effect locally.

Alternatively, you can run `wrangler dev --remote` to test against your deployed Hyperdrive configuration with caching enabled, but this runs your entire Worker in Cloudflare's network instead of locally.

Learn more about [local development with Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/local-development/).

## 6\. Deploy your Worker

You can now deploy your Worker to make your project accessible on the Internet. To deploy your Worker, run:

Terminal window

```

npx wrangler deploy

# Outputs: https://hyperdrive-tutorial.<YOUR_SUBDOMAIN>.workers.dev


```

You can now visit the URL for your newly created project to query your live database.

For example, if the URL of your new Worker is `hyperdrive-tutorial.<YOUR_SUBDOMAIN>.workers.dev`, accessing `https://hyperdrive-tutorial.<YOUR_SUBDOMAIN>.workers.dev/` will send a request to your Worker that queries your database directly.

By finishing this tutorial, you have created a Hyperdrive configuration, a Worker to access that database and deployed your project globally.

Reduce latency with Placement

If your Worker makes **multiple sequential queries** per request, use [Placement](https://developers.cloudflare.com/workers/configuration/placement/) to run your Worker close to your database. Each query adds round-trip latency: 20-30ms from a distant region, or 1-3ms when placed nearby. Multiple queries compound this difference.

If your Worker makes only one query per request, placement does not improve end-to-end latency. The total round-trip time is the same whether it happens near the user or near the database.

wrangler.jsonc

```

{

  "placement": {

    "region": "aws:us-east-1", // Match your database region, for example "gcp:us-east4" or "azure:eastus"

  },

}


```

## Next steps

* Learn more about [how Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* How to [configure query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/).
* [Troubleshooting common issues](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) when connecting a database to Hyperdrive.

If you have any feature requests or notice any bugs, share your feedback directly with the Cloudflare team by joining the [Cloudflare Developers community on Discord ↗](https://discord.cloudflare.com).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/get-started/","name":"Getting started"}}]}
```

---

---
title: Concepts
description: Core concepts and architecture behind Hyperdrive, including connection pooling and query caching.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Concepts

Learn about the core concepts and architecture behind Hyperdrive.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/concepts/","name":"Concepts"}}]}
```

---

---
title: Connection lifecycle
description: Understand how connections are managed between Workers, Hyperdrive, and your origin database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Connection lifecycle

Understanding how connections work between Workers, Hyperdrive, and your origin database is essential for building efficient applications with Hyperdrive.

By maintaining a connection pool to your database within Cloudflare's network, Hyperdrive reduces seven round-trips to your database before you can even send a query: the TCP handshake (1x), TLS negotiation (3x), and database authentication (3x).

## How connections are managed

When you use a database client in a Cloudflare Worker, the connection lifecycle works differently than in traditional server environments. Here's what happens:

![Hyperdrive connection](https://developers.cloudflare.com/_astro/hyperdrive-connection-lifecycle.B2jgT_oK_bR8HS.svg) 

Without Hyperdrive, every Worker invocation would need to establish a new connection directly to your origin database. This connection setup process requires multiple roundtrips across the Internet to complete the TCP handshake, TLS negotiation, and database authentication — that's 7x round trips and added latency before your query can even execute.

Hyperdrive solves this by splitting the connection setup into two parts: a fast edge connection and an optimized path to your database.

1. **Connection setup on the edge**: The database driver in your Worker code establishes a connection to the Hyperdrive instance. This happens at the edge, colocated with your Worker, making it extremely fast to create connections. This is why you use Hyperdrive's special connection string.
2. **Single roundtrip across regions**: Since authentication has already been completed at the edge, Hyperdrive only needs a single round trip across regions to your database, instead of the multiple roundtrips that would be incurred during connection setup.
3. **Get existing connection from pool**: Hyperdrive uses an existing connection from the pool that is colocated close to your database, minimizing latency.
4. **If no available connections, create new**: When needed, new connections are created from a region close to your database to reduce the latency of establishing new connections.
5. **Run query**: Your query is executed against the database and results are returned to your Worker through Hyperdrive.
6. **Connection teardown**: When your Worker finishes processing the request, the database client connection in your Worker is automatically garbage collected. However, Hyperdrive keeps the connection to your origin database open in the pool, ready to be reused by the next Worker invocation. This means subsequent requests will still perform the fast edge connection setup, but will reuse one of the existing connections from Hyperdrive's pool near your database.

Note

In a Cloudflare Worker, database client connections within the Worker are only kept alive for the duration of a single invocation. With Hyperdrive, creating a new client on each invocation is fast and recommended because Hyperdrive maintains the underlying database connections for you, pooled in an optimal location and shared across Workers to maximize scale.

## Cleaning up client connections

When your Worker finishes processing a request, the database client is automatically garbage collected and the edge connection to Hyperdrive is cleaned up. Hyperdrive keeps the underlying connection to your origin database open in its pool for reuse.

You do **not** need to call `client.end()`, `sql.end()`, `connection.end()` (or similar) to clean up database clients. Workers-to-Hyperdrive connections are automatically cleaned up when the request or invocation ends, including when a [Workflow](https://developers.cloudflare.com/workflows/) or [Queue consumer](https://developers.cloudflare.com/queues/) completes, or when a [Durable Object](https://developers.cloudflare.com/durable-objects/) hibernates or is evicted when idle.

TypeScript

```

import { Client } from "pg";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });

    await client.connect();


    const result = await client.query("SELECT * FROM pg_tables");


    // No need to call client.end() — Hyperdrive automatically cleans

    // up the client connection when the request ends. The underlying

    // pooled connection to your origin database remains open for reuse.

    return Response.json(result.rows);

  },

} satisfies ExportedHandler<Env>;


```

Create database clients inside your handlers

You should always create database clients inside your request handlers (`fetch`, `queue`, and similar), not in the global scope. Workers do not allow [I/O across requests](https://developers.cloudflare.com/workers/runtime-apis/bindings/#making-changes-to-bindings), and Hyperdrive's distributed connection pooling already solves for connection startup latency. Using a driver-level pool (such as `new Pool()` or `createPool()`) in the global script scope will leave you with stale connections that result in failed queries and hard errors.

Do not create database clients or connection pools in the global scope. Instead, create a new client inside each handler invocation — Hyperdrive's connection pool ensures this is fast:

* [  JavaScript ](#tab-panel-5844)
* [  TypeScript ](#tab-panel-5845)

index.js

```

import { Client } from "pg";


// 🔴 Bad: Client created in the global scope persists across requests.

// Workers do not allow I/O across request contexts, so this client

// becomes stale and subsequent queries will throw hard errors.

const globalClient = new Client({

  connectionString: env.HYPERDRIVE.connectionString,

});

await globalClient.connect();


export default {

  async fetch(request, env, ctx) {

    // ✅ Good: Client created inside the handler, scoped to this request.

    // Hyperdrive pools the underlying connection to your origin database,

    // so creating a new client per request is fast and reliable.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });

    await client.connect();


    const result = await client.query("SELECT * FROM pg_tables");

    return Response.json(result.rows);

  },

};


```

index.ts

```

import { Client } from "pg";


// 🔴 Bad: Client created in the global scope persists across requests.

// Workers do not allow I/O across request contexts, so this client

// becomes stale and subsequent queries will throw hard errors.

const globalClient = new Client({

  connectionString: env.HYPERDRIVE.connectionString,

});

await globalClient.connect();


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // ✅ Good: Client created inside the handler, scoped to this request.

    // Hyperdrive pools the underlying connection to your origin database,

    // so creating a new client per request is fast and reliable.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });

    await client.connect();


    const result = await client.query("SELECT * FROM pg_tables");

    return Response.json(result.rows);

  },

} satisfies ExportedHandler<Env>;


```

## Connection lifecycle considerations

### Durable Objects and persistent connections

Unlike regular Workers, [Durable Objects](https://developers.cloudflare.com/durable-objects/) can maintain state across multiple requests. If you keep a database client open in a Durable Object, the connection will remain allocated from Hyperdrive's connection pool. Long-lived Durable Objects can exhaust available connections if many objects keep connections open simultaneously.

Warning

Be careful when maintaining persistent database connections in Durable Objects. Each open connection consumes resources from Hyperdrive's connection pool, which could impact other parts of your application. Close connections when not actively in use, use connection timeouts, and limit the number of Durable Objects that maintain database connections.

### Long-running transactions

Hyperdrive operates in [transaction pooling mode](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/#pooling-mode), where a connection is held for the duration of a transaction. Long-running transactions that contain multiple queries can exhaust Hyperdrive's available connections more quickly because each transaction holds a connection from the pool until it completes.

Tip

Keep transactions as short as possible. Perform only the essential queries within a transaction, and avoid including non-database operations (like external API calls or complex computations) inside transaction blocks.

Refer to [Limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) to understand how many connections are available for your Hyperdrive configuration based on your Workers plan.

## Related resources

* [How Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/)
* [Connection pooling](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/)
* [Limits](https://developers.cloudflare.com/hyperdrive/platform/limits/)
* [Durable Objects](https://developers.cloudflare.com/durable-objects/)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/concepts/","name":"Concepts"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/concepts/connection-lifecycle/","name":"Connection lifecycle"}}]}
```

---

---
title: Connection pooling
description: Hyperdrive maintains a pool of database connections optimally placed to minimize latency for your applications.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Connection pooling

Hyperdrive maintains a pool of connections to your database. These are optimally placed to minimize the latency for your applications. You can configure the amount of connections your Hyperdrive configuration uses to connect to your origin database. This enables you to right-size your connection pool based on your database capacity and application requirements.

For instance, if your Worker makes many queries to your database (which cannot be resolved by Hyperdrive's caching), you may want to allow Hyperdrive to make more connections to your database. Conversely, if your Worker makes few queries that actually need to reach your database or if your database allows a small number of database connections, you can reduce the amount of connections Hyperdrive will make to your database.

All configurations have a minimum of 5 connections, and with a maximum depending on your Workers plan. Refer to the [limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) for details.

## How Hyperdrive pools database connections

Hyperdrive will automatically scale the amount of database connections held open by Hyperdrive depending on your traffic and the amount of load that is put on your database.

The `max_size` parameter acts as a soft limit - Hyperdrive may temporarily create additional connections during network issues or high traffic periods to ensure high availability and resiliency.

## Pooling mode

The Hyperdrive connection pooler operates in transaction mode, where the client that executes the query communicates through a single connection for the duration of a transaction. When that transaction has completed, the connection is returned to the pool.

Hyperdrive supports [SET statements ↗](https://www.postgresql.org/docs/current/sql-set.html) for the duration of a transaction or a query. For instance, if you manually create a transaction with `BEGIN`/`COMMIT`, `SET` statements within the transaction will take effect. Moreover, a query that includes a `SET` command (`SET X; SELECT foo FROM bar;`) will also apply the `SET` command. When a connection is returned to the pool, the connection is `RESET` such that the `SET` commands will not take effect on subsequent queries.

This implies that a single Worker invocation may obtain multiple connections to perform its database operations and may need to `SET` any configurations for every query or transaction. It is not recommended to wrap multiple database operations with a single transaction to maintain the `SET` state. Doing so will affect the performance and scaling of Hyperdrive, as the connection cannot be reused by other Worker isolates for the duration of the transaction.

Hyperdrive supports named prepared statements as implemented in the `postgres.js` and `node-postgres` drivers. Named prepared statements in other drivers may have worse performance or may not be supported.

## Best practices

You can configure connection counts using the Cloudflare dashboard or the Cloudflare API. Consider the following best practices to determine the right limit for your use-case:

* **Start conservatively**: Begin with a lower connection count and increase as needed based on your application's performance.
* **Monitor database metrics**: Watch your database's connection usage and performance metrics to optimize the connection count.
* **Consider database limits**: Ensure your configured connection count doesn't exceed your database's maximum connection limit.
* **Account for multiple configurations**: If you have multiple Hyperdrive configurations connecting to the same database, consider the total connection count across all configurations.

## Next steps

* Learn more about [How Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Review [Hyperdrive limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) for your Workers plan.
* Learn how to [Connect to PostgreSQL](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/) from Hyperdrive.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/concepts/","name":"Concepts"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/concepts/connection-pooling/","name":"Connection pooling"}}]}
```

---

---
title: How Hyperdrive works
description: Hyperdrive accelerates database queries through edge connection setup, connection pooling, and query caching.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# How Hyperdrive works

Connecting to traditional centralized databases from Cloudflare's global network which consists of over [300 data center locations ↗](https://www.cloudflare.com/network/) presents a few challenges as queries can originate from any of these locations.

If your database is centrally located, queries can take a long time to get to the database and back. Queries can take even longer in situations where you have to establish new connections from stateless environments like Workers, requiring multiple round trips for each Worker invocation.

Traditional databases usually handle a maximum number of connections. With any reasonably large amount of distributed traffic, it becomes easy to exhaust these connections.

Hyperdrive solves these challenges by managing the number of global connections to your origin database, selectively parsing and choosing which query response to cache while reducing loading on your database and accelerating your database queries.

## How Hyperdrive makes databases fast globally

Hyperdrive accelerates database queries by:

* Performing the connection setup for new database connections near your Workers
* Pooling existing connections near your database
* Caching query results

This ensures you have optimal performance when connecting to your database from Workers (whether your queries are cached or not).

![Hyperdrive connection](https://developers.cloudflare.com/_astro/hyperdrive-comparison.BMT25nFH_ZcBb7n.svg) 

### 1\. Edge connection setup

When a database driver connects to a database from a Cloudflare Worker **directly**, it will first go through the connection setup. This may require multiple round trips to the database in order to verify and establish a secure connection. This can incur additional network latency due to the distance between your Cloudflare Worker and your database.

**With Hyperdrive**, this connection setup occurs between your Cloudflare Worker and Hyperdrive on the edge, as close to your Worker as possible (see diagram, label _1\. Connection setup_). This incurs significantly less latency, since the connection setup is completed within the same location.

Learn more about how connections work between Workers and Hyperdrive in [Connection lifecycle](https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/).

### 2\. Connection Pooling

Hyperdrive creates a pool of connections to your database that can be reused as your application executes queries against your database.

The pool of database connections is placed in one or more regions closest to your origin database. This minimizes the latency incurred by roundtrips between your Cloudflare Workers and database to establish new connections. This also ensures that as little network latency is incurred for uncached queries.

If the connection pool has pre-existing connections, the connection pool will try and reuse that connection (see diagram, label _2\. Existing warm connection_). If the connection pool does not have pre-existing connections, it will establish a new connection to your database and use that to route your query. This aims at reusing and creating the least number of connections possible as required to operate your application.

Note

Hyperdrive automatically manages the connection pool properties for you, including limiting the total number of connections to your origin database. Refer to [Limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) to learn more.

Learn more about connection pooling behavior and configuration in [Connection pooling](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/).

Reduce latency with Placement

If your Worker makes **multiple sequential queries** per request, use [Placement](https://developers.cloudflare.com/workers/configuration/placement/) to run your Worker close to your database. Each query adds round-trip latency: 20-30ms from a distant region, or 1-3ms when placed nearby. Multiple queries compound this difference.

If your Worker makes only one query per request, placement does not improve end-to-end latency. The total round-trip time is the same whether it happens near the user or near the database.

wrangler.jsonc

```

{

  "placement": {

    "region": "aws:us-east-1", // Match your database region, for example "gcp:us-east4" or "azure:eastus"

  },

}


```

### 3\. Query Caching

Hyperdrive supports caching of non-mutating (read) queries to your database.

When queries are sent via Hyperdrive, Hyperdrive parses the query and determines whether the query is a mutating (write) or non-mutating (read) query.

For non-mutating queries, Hyperdrive will cache the response for the configured `max_age`, and whenever subsequent queries are made that match the original, Hyperdrive will return the cached response, bypassing the need to issue the query back to the origin database.

Caching reduces the burden on your origin database and accelerates the response times for your queries.

Learn more about query caching behavior and configuration in [Query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/).

## Pooling mode

The Hyperdrive connection pooler operates in transaction mode, where the client that executes the query communicates through a single connection for the duration of a transaction. When that transaction has completed, the connection is returned to the pool.

Hyperdrive supports [SET statements ↗](https://www.postgresql.org/docs/current/sql-set.html) for the duration of a transaction or a query. For instance, if you manually create a transaction with `BEGIN`/`COMMIT`, `SET` statements within the transaction will take effect. Moreover, a query that includes a `SET` command (`SET X; SELECT foo FROM bar;`) will also apply the `SET` command. When a connection is returned to the pool, the connection is `RESET` such that the `SET` commands will not take effect on subsequent queries.

This implies that a single Worker invocation may obtain multiple connections to perform its database operations and may need to `SET` any configurations for every query or transaction. It is not recommended to wrap multiple database operations with a single transaction to maintain the `SET` state. Doing so will affect the performance and scaling of Hyperdrive, as the connection cannot be reused by other Worker isolates for the duration of the transaction.

Hyperdrive supports named prepared statements as implemented in the `postgres.js` and `node-postgres` drivers. Named prepared statements in other drivers may have worse performance or may not be supported.

## Related resources

* [Connection lifecycle](https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/)
* [Query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/)
* [Connection pooling](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/concepts/","name":"Concepts"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/concepts/how-hyperdrive-works/","name":"How Hyperdrive works"}}]}
```

---

---
title: Query caching
description: Hyperdrive automatically caches read queries to reduce database load and improve performance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Query caching

Hyperdrive automatically caches all cacheable queries executed against your database when query caching is turned on, reducing the need to go back to your database (incurring latency and database load) for every query which can be especially useful for popular queries. Query caching is enabled by default.

## What does Hyperdrive cache?

Because Hyperdrive uses database protocols, it can differentiate between a mutating query (a query that writes to the database) and a non-mutating query (a read-only query), allowing Hyperdrive to safely cache read-only queries.

Besides determining the difference between a `SELECT` and an `INSERT`, Hyperdrive also parses the database wire-protocol and uses it to differentiate between a mutating or non-mutating query.

For example, a read query that populates the front page of a news site would be cached:

* [ PostgreSQL ](#tab-panel-5846)
* [ MySQL ](#tab-panel-5847)

```

-- Cacheable: uses a parameterized date value instead of CURRENT_DATE

SELECT * FROM articles WHERE DATE(published_time) = $1

ORDER BY published_time DESC LIMIT 50


```

```

-- Cacheable: uses a parameterized date value instead of CURDATE()

SELECT * FROM articles WHERE DATE(published_time) = ?

ORDER BY published_time DESC LIMIT 50


```

Mutating queries (including `INSERT`, `UPSERT`, or `CREATE TABLE`) and queries that use functions designated as [volatile ↗](https://www.postgresql.org/docs/current/xfunc-volatility.html) or [stable ↗](https://www.postgresql.org/docs/current/xfunc-volatility.html) by PostgreSQL are not cached:

* [ PostgreSQL ](#tab-panel-5848)
* [ MySQL ](#tab-panel-5849)

```

-- Not cached: mutating queries

INSERT INTO users(id, name, email) VALUES(555, 'Matt', 'hello@example.com');


-- Not cached: LASTVAL() is a volatile function

SELECT LASTVAL(), * FROM articles LIMIT 50;


-- Not cached: NOW() is a stable function

SELECT * FROM events WHERE created_at > NOW() - INTERVAL '1 hour';


```

```

-- Not cached: mutating queries

INSERT INTO users(id, name, email) VALUES(555, 'Thomas', 'hello@example.com');


-- Not cached: LAST_INSERT_ID() is a volatile function

SELECT LAST_INSERT_ID(), * FROM articles LIMIT 50;


-- Not cached: NOW() returns a non-deterministic value

SELECT * FROM events WHERE created_at > NOW() - INTERVAL 1 HOUR;


```

Common PostgreSQL functions that are **not cacheable** include:

| Function           | PostgreSQL volatility category | Cached |
| ------------------ | ------------------------------ | ------ |
| NOW()              | STABLE                         | No     |
| CURRENT\_TIMESTAMP | STABLE                         | No     |
| CURRENT\_DATE      | STABLE                         | No     |
| CURRENT\_TIME      | STABLE                         | No     |
| LOCALTIME          | STABLE                         | No     |
| LOCALTIMESTAMP     | STABLE                         | No     |
| TIMEOFDAY()        | VOLATILE                       | No     |
| RANDOM()           | VOLATILE                       | No     |
| LASTVAL()          | VOLATILE                       | No     |
| TXID\_CURRENT()    | STABLE                         | No     |

Only functions designated as `IMMUTABLE` by PostgreSQL (functions whose return value never changes for the same inputs) are compatible with Hyperdrive caching. If your query uses a `STABLE` or `VOLATILE` function, move the function call to your application code and pass the resulting value as a query parameter instead.

Function detection is text-based

Hyperdrive uses text-based pattern matching to detect uncacheable functions in your queries. This means that even references to function names inside SQL comments will cause the query to be marked as uncacheable.

For example, the following query would **not** be cached because `NOW()` appears in the comment:

```

-- We removed NOW() to keep this query cacheable

SELECT * FROM api_keys WHERE hash = $1 AND deleted = false;


```

Avoid referencing uncacheable function names anywhere in your query text, including comments.

## Default cache settings

The default caching behaviour for Hyperdrive is defined as below:

* `max_age` \= 60 seconds (1 minute)
* `stale_while_revalidate` \= 15 seconds

The `max_age` setting determines the maximum lifetime a query response will be served from cache. Cached responses may be evicted from the cache prior to this time if they are rarely used.

The `stale_while_revalidate` setting allows Hyperdrive to continue serving stale cache results for an additional period of time while it is revalidating the cache. In most cases, revalidation should happen rapidly.

You can set a maximum `max_age` of 1 hour.

## Disable caching

Disable caching on a per-Hyperdrive basis by using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI to set the `--caching-disabled` option to `true`.

For example:

Terminal window

```

# wrangler v3.11 and above required

npx wrangler hyperdrive update my-hyperdrive-id --origin-password my-db-password --caching-disabled true


```

You can also configure multiple Hyperdrive connections from a single application: one connection that enables caching for popular queries, and a second connection where you do not want to cache queries, but still benefit from Hyperdrive's latency benefits and connection pooling.

For example, using database drivers:

* [ PostgreSQL ](#tab-panel-5850)
* [ MySQL ](#tab-panel-5851)

index.ts

```

export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create clients inside your handler — not in global scope

    const client = postgres(env.HYPERDRIVE.connectionString);

    // ...

    const clientNoCache = postgres(env.HYPERDRIVE_CACHE_DISABLED.connectionString);

    // ...

  },

} satisfies ExportedHandler<Env>;


```

index.ts

```

export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create connections inside your handler — not in global scope

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,

    });

    // ...

    const connectionNoCache = await createConnection({

      host: env.HYPERDRIVE_CACHE_DISABLED.host,

      user: env.HYPERDRIVE_CACHE_DISABLED.user,

      password: env.HYPERDRIVE_CACHE_DISABLED.password,

      database: env.HYPERDRIVE_CACHE_DISABLED.database,

      port: env.HYPERDRIVE_CACHE_DISABLED.port,

    });

    // ...

  },

} satisfies ExportedHandler<Env>;


```

The Wrangler configuration remains the same both for PostgreSQL and MySQL.

* [  wrangler.jsonc ](#tab-panel-5852)
* [  wrangler.toml ](#tab-panel-5853)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_HYPERDRIVE_CACHE_ENABLED_CONFIGURATION_ID>",

    },

    {

      "binding": "HYPERDRIVE_CACHE_DISABLED",

      "id": "<YOUR_HYPERDRIVE_CACHE_DISABLED_CONFIGURATION_ID>",

    },

  ],

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_HYPERDRIVE_CACHE_ENABLED_CONFIGURATION_ID>"


[[hyperdrive]]

binding = "HYPERDRIVE_CACHE_DISABLED"

id = "<YOUR_HYPERDRIVE_CACHE_DISABLED_CONFIGURATION_ID>"


```

## Next steps

* For more information, refer to [How Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* To connect to PostgreSQL, refer to [Connect to PostgreSQL](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/).
* For troubleshooting guidance, refer to [Troubleshoot and debug](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/concepts/","name":"Concepts"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/concepts/query-caching/","name":"Query caching"}}]}
```

---

---
title: Tutorials
description: Step-by-step Hyperdrive tutorials for connecting Workers to databases.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Tutorials

View tutorials to help you get started with Hyperdrive.

| Name                                                                                                                                                                         | Last Updated     | Difficulty |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- |
| [Connect to a PostgreSQL database with Cloudflare Workers](https://developers.cloudflare.com/workers/tutorials/postgres/)                                                    | 10 months ago    | Beginner   |
| [Connect to a MySQL database with Cloudflare Workers](https://developers.cloudflare.com/workers/tutorials/mysql/)                                                            | about 1 year ago | Beginner   |
| [Create a serverless, globally distributed time-series API with Timescale](https://developers.cloudflare.com/hyperdrive/tutorials/serverless-timeseries-api-with-timescale/) | over 2 years ago | Beginner   |

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/tutorials/","name":"Tutorials"}}]}
```

---

---
title: Create a serverless, globally distributed time-series API with Timescale
description: In this tutorial, you will learn to build an API on Workers which will ingest and query time-series data stored in Timescale.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

### Tags

[ Postgres ](https://developers.cloudflare.com/search/?tags=Postgres)[ TypeScript ](https://developers.cloudflare.com/search/?tags=TypeScript)[ SQL ](https://developers.cloudflare.com/search/?tags=SQL) 

# Create a serverless, globally distributed time-series API with Timescale

**Last reviewed:**  over 2 years ago 

In this tutorial, you will learn to build an API on Workers which will ingest and query time-series data stored in [Timescale ↗](https://www.timescale.com/) (they make PostgreSQL faster in the cloud).

You will create and deploy a Worker function that exposes API routes for ingesting data, and use [Hyperdrive ↗](https://developers.cloudflare.com/hyperdrive/) to proxy your database connection from the edge and maintain a connection pool to prevent us having to make a new database connection on every request.

You will learn how to:

* Build and deploy a Cloudflare Worker.
* Use Worker secrets with the Wrangler CLI.
* Deploy a Timescale database service.
* Connect your Worker to your Timescale database service with Hyperdrive.
* Query your new API.

You can learn more about Timescale by reading their [documentation ↗](https://docs.timescale.com/getting-started/latest/services/).

---

## 1\. Create a Worker project

Run the following command to create a Worker project from the command line:

 npm  yarn  pnpm 

```
npm create cloudflare@latest -- timescale-api
```

```
yarn create cloudflare timescale-api
```

```
pnpm create cloudflare@latest timescale-api
```

For setup, select the following options:

* For _What would you like to start with?_, choose `Hello World example`.
* For _Which template would you like to use?_, choose `Worker only`.
* For _Which language do you want to use?_, choose `TypeScript`.
* For _Do you want to use git for version control?_, choose `Yes`.
* For _Do you want to deploy your application?_, choose `No` (we will be making some changes before deploying).

Make note of the URL that your application was deployed to. You will be using it when you configure your GitHub webhook.

Change into the directory you just created for your Worker project:

Terminal window

```

cd timescale-api


```

## 2\. Prepare your Timescale Service

Note

If you have not signed up for Timescale, go to the [signup page ↗](https://timescale.com/signup) where you can start a free 30 day trial with no credit card.

If you are creating a new service, go to the [Timescale Console ↗](https://console.cloud.timescale.com/) and follow these steps:

1. Select **Create Service** by selecting the black plus in the upper right.
2. Choose **Time Series** as the service type.
3. Choose your desired region and instance size. 1 CPU will be enough for this tutorial.
4. Set a service name to replace the randomly generated one.
5. Select **Create Service**.
6. On the right hand side, expand the **Connection Info** dialog and copy the **Service URL**.
7. Copy the password which is displayed. You will not be able to retrieve this again.
8. Select **I stored my password, go to service overview**.

If you are using a service you created previously, you can retrieve your service connection information in the [Timescale Console ↗](https://console.cloud.timescale.com/):

1. Select the service (database) you want Hyperdrive to connect to.
2. Expand **Connection info**.
3. Copy the **Service URL**. The Service URL is the connection string that Hyperdrive will use to connect. This string includes the database hostname, port number and database name.

Note

If you do not have your password stored, you will need to select **Forgot your password?** and set a new **SCRAM** password. Save this password, as Timescale will only display it once.

You should ensure that you do not break any existing clients if when you reset the password.

Insert your password into the **Service URL** as follows (leaving the portion after the @ untouched):

```

postgres://tsdbadmin:YOURPASSWORD@...


```

This will be referred to as **SERVICEURL** in the following sections.

## 3\. Create your Hypertable

Timescale allows you to convert regular PostgreSQL tables into [hypertables ↗](https://docs.timescale.com/use-timescale/latest/hypertables/), tables used to deal with time-series, events, or analytics data. Once you have made this change, Timescale will seamlessly manage the hypertable's partitioning, as well as allow you to apply other features like compression or continuous aggregates.

Connect to your Timescale database using the Service URL you copied in the last step (it has the password embedded).

If you are using the default PostgreSQL CLI tool [**psql** ↗](https://www.timescale.com/blog/how-to-install-psql-on-mac-ubuntu-debian-windows/) to connect, you would run psql like below (substituting your **Service URL** from the previous step). You could also connect using a graphical tool like [PgAdmin ↗](https://www.pgadmin.org/).

Terminal window

```

psql <SERVICEURL>


```

Once you are connected, create your table by pasting the following SQL:

```

CREATE TABLE readings(

  ts timestamptz DEFAULT now() NOT NULL,

  sensor UUID NOT NULL,

  metadata jsonb,

  value numeric NOT NULL

 );


SELECT create_hypertable('readings', 'ts');


```

Timescale will manage the rest for you as you ingest and query data.

## 4\. Create a database configuration

To create a new Hyperdrive instance you will need:

* Your **SERVICEURL** from [step 2](https://developers.cloudflare.com/hyperdrive/tutorials/serverless-timeseries-api-with-timescale/#2-prepare-your-timescale-service).
* A name for your Hyperdrive service. For this tutorial, you will use **hyperdrive**.

Hyperdrive uses the `create` command with the `--connection-string` argument to pass this information. Run it as follows:

Terminal window

```

npx wrangler hyperdrive create hyperdrive --connection-string="SERVICEURL"


```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

This command outputs your Hyperdrive ID. You can now bind your Hyperdrive configuration to your Worker in your Wrangler configuration by replacing the content with the following:

* [  wrangler.jsonc ](#tab-panel-6058)
* [  wrangler.toml ](#tab-panel-6059)

JSONC

```

{

  "$schema": "./node_modules/wrangler/config-schema.json",

  "name": "timescale-api",

  "main": "src/index.ts",

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "compatibility_flags": [

    "nodejs_compat"

  ],

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "your-id-here"

    }

  ]

}


```

TOML

```

"$schema" = "./node_modules/wrangler/config-schema.json"

name = "timescale-api"

main = "src/index.ts"

# Set this to today's date

compatibility_date = "2026-04-30"

compatibility_flags = [ "nodejs_compat" ]


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "your-id-here"


```

Install the Postgres driver into your Worker project:

 npm  yarn  pnpm  bun 

```
npm i pg
```

```
yarn add pg
```

```
pnpm add pg
```

```
bun add pg
```

Now copy the below Worker code, and replace the current code in `./src/index.ts`. The code below:

1. Uses Hyperdrive to connect to Timescale using the connection string generated from `env.HYPERDRIVE.connectionString` directly to the driver.
2. Creates a `POST` route which accepts an array of JSON readings to insert into Timescale in one transaction.
3. Creates a `GET` route which takes a `limit` parameter and returns the most recent readings. This could be adapted to filter by ID or by timestamp.

TypeScript

```

import { Client } from "pg";


export interface Env {

  HYPERDRIVE: Hyperdrive;

}


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new client on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });

    await client.connect();


    const url = new URL(request.url);

    // Create a route for inserting JSON as readings

    if (request.method === "POST" && url.pathname === "/readings") {

      // Parse the request's JSON payload

      const productData = await request.json();


      // Write the raw query. You are using jsonb_to_recordset to expand the JSON

      // to PG INSERT format to insert all items at once, and using coalesce to

      // insert with the current timestamp if no ts field exists

      const insertQuery = `

      INSERT INTO readings (ts, sensor, metadata, value)

      SELECT coalesce(ts, now()), sensor, metadata, value FROM jsonb_to_recordset($1::jsonb)

      AS t(ts timestamptz, sensor UUID, metadata jsonb, value numeric)

  `;


      const insertResult = await client.query(insertQuery, [

        JSON.stringify(productData),

      ]);


      // Collect the raw row count inserted to return

      const resp = new Response(JSON.stringify(insertResult.rowCount), {

        headers: { "Content-Type": "application/json" },

      });


      return resp;


      // Create a route for querying within a time-frame

    } else if (request.method === "GET" && url.pathname === "/readings") {

      const limit = url.searchParams.get("limit");


      // Query the readings table using the limit param passed

      const result = await client.query(

        "SELECT * FROM readings ORDER BY ts DESC LIMIT $1",

        [limit],

      );


      // Return the result as JSON

      const resp = new Response(JSON.stringify(result.rows), {

        headers: { "Content-Type": "application/json" },

      });


      return resp;

    }

  },

} satisfies ExportedHandler<Env>;


```

## 5\. Deploy your Worker

Run the following command to redeploy your Worker:

Terminal window

```

npx wrangler deploy


```

Your application is now live and accessible at `timescale-api.<YOUR_SUBDOMAIN>.workers.dev`. The exact URI will be shown in the output of the wrangler command you just ran.

After deploying, you can interact with your Timescale IoT readings database using your Cloudflare Worker. Connection from the edge will be faster because you are using Cloudflare Hyperdrive to connect from the edge.

You can now use your Cloudflare Worker to insert new rows into the `readings` table. To test this functionality, send a `POST` request to your Worker’s URL with the `/readings` path, along with a JSON payload containing the new product data:

```

[

  { "sensor": "6f3e43a4-d1c1-4cb6-b928-0ac0efaf84a5", "value": 0.3 },

  { "sensor": "d538f9fa-f6de-46e5-9fa2-d7ee9a0f0a68", "value": 10.8 },

  { "sensor": "5cb674a0-460d-4c80-8113-28927f658f5f", "value": 18.8 },

  { "sensor": "03307bae-d5b8-42ad-8f17-1c810e0fbe63", "value": 20.0 },

  { "sensor": "64494acc-4aa5-413c-bd09-2e5b3ece8ad7", "value": 13.1 },

  { "sensor": "0a361f03-d7ec-4e61-822f-2857b52b74b3", "value": 1.1 },

  { "sensor": "50f91cdc-fd19-40d2-b2b0-c90db3394981", "value": 10.3 }

]


```

This tutorial omits the `ts` (the timestamp) and `metadata` (the JSON blob) so they will be set to `now()` and `NULL` respectively.

Once you have sent the `POST` request you can also issue a `GET` request to your Worker’s URL with the `/readings` path. Set the `limit` parameter to control the amount of returned records.

If you have **curl** installed you can test with the following commands (replace `<YOUR_SUBDOMAIN>` with your subdomain from the deploy command above):

Ingest some data

```

curl --request POST --data @- 'https://timescale-api.<YOUR_SUBDOMAIN>.workers.dev/readings' <<EOF

[

  { "sensor": "6f3e43a4-d1c1-4cb6-b928-0ac0efaf84a5", "value":0.3},

  { "sensor": "d538f9fa-f6de-46e5-9fa2-d7ee9a0f0a68", "value":10.8},

  { "sensor": "5cb674a0-460d-4c80-8113-28927f658f5f", "value":18.8},

  { "sensor": "03307bae-d5b8-42ad-8f17-1c810e0fbe63", "value":20.0},

  { "sensor": "64494acc-4aa5-413c-bd09-2e5b3ece8ad7", "value":13.1},

  { "sensor": "0a361f03-d7ec-4e61-822f-2857b52b74b3", "value":1.1},

  { "sensor": "50f91cdc-fd19-40d2-b2b0-c90db3394981", "metadata": {"color": "blue" }, "value":10.3}

]

EOF


```

Query some data

```

curl "https://timescale-api.<YOUR_SUBDOMAIN>.workers.dev/readings?limit=10"


```

In this tutorial, you have learned how to create a working example to ingest and query readings from the edge with Timescale, Workers, Hyperdrive, and TypeScript.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Learn more about [Timescale ↗](https://timescale.com).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/tutorials/","name":"Tutorials"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/tutorials/serverless-timeseries-api-with-timescale/","name":"Create a serverless, globally distributed time-series API with Timescale"}}]}
```

---

---
title: Demos and architectures
description: Explore demo applications and reference architectures that use Hyperdrive.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Demos and architectures

Learn how you can use Hyperdrive within your existing application and architecture.

## Demos

Explore the following demo applications for Hyperdrive.

* [Hyperdrive demo: ↗](https://github.com/cloudflare/hyperdrive-demo) A Remix app that connects to a database behind Cloudflare's Hyperdrive, making regional databases feel like they're globally distributed.

## Reference architectures

Explore the following reference architectures that use Hyperdrive:

[Serverless global APIsAn example architecture of a serverless API on Cloudflare and aims to illustrate how different compute and data products could interact with each other.](https://developers.cloudflare.com/reference-architecture/diagrams/serverless/serverless-global-apis/)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/demos/","name":"Demos and architectures"}}]}
```

---

## List Hyperdrives

**get** `/accounts/{account_id}/hyperdrive/configs`

Returns a list of Hyperdrives.

### Path Parameters

- `account_id: string`

  Define configurations using a unique string identifier.

### Returns

- `errors: array of ResponseInfo`

  - `code: number`

  - `message: string`

  - `documentation_url: optional string`

  - `source: optional object { pointer }`

    - `pointer: optional string`

- `messages: array of ResponseInfo`

  - `code: number`

  - `message: string`

  - `documentation_url: optional string`

  - `source: optional object { pointer }`

- `result: array of Hyperdrive`

  - `id: string`

    Define configurations using a unique string identifier.

  - `name: string`

    The name of the Hyperdrive configuration. Used to identify the configuration in the Cloudflare dashboard and API.

  - `origin: object { database, host, password, 3 more }  or object { access_client_id, access_client_secret, database, 4 more }  or object { database, password, scheme, 2 more }`

    - `PublicDatabase object { database, host, password, 3 more }`

      - `database: string`

        Set the name of your origin database.

      - `host: string`

        Defines the host (hostname or IP) of your origin database.

      - `password: string`

        Set the password needed to access your origin database. The API never returns this write-only value.

      - `port: number`

        Defines the port of your origin database. Defaults to 5432 for PostgreSQL or 3306 for MySQL if not specified.

      - `scheme: "postgres" or "postgresql" or "mysql"`

        Specifies the URL scheme used to connect to your origin database.

        - `"postgres"`

        - `"postgresql"`

        - `"mysql"`

      - `user: string`

        Set the user of your origin database.

    - `AccessProtectedDatabaseBehindCloudflareTunnel object { access_client_id, access_client_secret, database, 4 more }`

      - `access_client_id: string`

        Defines the Client ID of the Access token to use when connecting to the origin database.

      - `access_client_secret: string`

        Defines the Client Secret of the Access Token to use when connecting to the origin database. The API never returns this write-only value.

      - `database: string`

        Set the name of your origin database.

      - `host: string`

        Defines the host (hostname or IP) of your origin database.

      - `password: string`

        Set the password needed to access your origin database. The API never returns this write-only value.

      - `scheme: "postgres" or "postgresql" or "mysql"`

        Specifies the URL scheme used to connect to your origin database.

        - `"postgres"`

        - `"postgresql"`

        - `"mysql"`

      - `user: string`

        Set the user of your origin database.

    - `DatabaseReachableThroughAWorkersVPC object { database, password, scheme, 2 more }`

      - `database: string`

        Set the name of your origin database.

      - `password: string`

        Set the password needed to access your origin database. The API never returns this write-only value.

      - `scheme: "postgres" or "postgresql" or "mysql"`

        Specifies the URL scheme used to connect to your origin database.

        - `"postgres"`

        - `"postgresql"`

        - `"mysql"`

      - `service_id: string`

        The identifier of the Workers VPC Service to connect through. Hyperdrive will egress through the specified VPC Service to reach the origin database.

      - `user: string`

        Set the user of your origin database.

  - `caching: optional object { disabled }  or object { disabled, max_age, stale_while_revalidate }`

    - `HyperdriveHyperdriveCachingCommon object { disabled }`

      - `disabled: optional boolean`

        Set to true to disable caching of SQL responses. Default is false.

    - `HyperdriveHyperdriveCachingEnabled object { disabled, max_age, stale_while_revalidate }`

      - `disabled: optional boolean`

        Set to true to disable caching of SQL responses. Default is false.

      - `max_age: optional number`

        Specify the maximum duration (in seconds) items should persist in the cache. Defaults to 60 seconds if not specified.

      - `stale_while_revalidate: optional number`

        Specify the number of seconds the cache may serve a stale response. Defaults to 15 seconds if not specified.

  - `created_on: optional string`

    Defines the creation time of the Hyperdrive configuration.

  - `modified_on: optional string`

    Defines the last modified time of the Hyperdrive configuration.

  - `mtls: optional object { ca_certificate_id, mtls_certificate_id, sslmode }`

    mTLS configuration for the origin connection. Cannot be used with VPC Service origins; TLS must be managed on the VPC Service.

    - `ca_certificate_id: optional string`

      Define CA certificate ID obtained after uploading CA cert.

    - `mtls_certificate_id: optional string`

      Define mTLS certificate ID obtained after uploading client cert.

    - `sslmode: optional string`

      Set SSL mode to 'require', 'verify-ca', or 'verify-full' to verify the CA.

  - `origin_connection_limit: optional number`

    The (soft) maximum number of connections the Hyperdrive is allowed to make to the origin database.

    Maximum allowed: 20 for free tier accounts, 100 for paid tier accounts.
    If not specified, defaults to 20 for free tier and 60 for paid tier.
    Contact Cloudflare if you need a higher limit.

- `success: true`

  Return the status of the API call success.

  - `true`

- `result_info: optional object { count, page, per_page, total_count }`

  - `count: optional number`

    Defines the total number of results for the requested service.

  - `page: optional number`

    Defines the current page within paginated list of results.

  - `per_page: optional number`

    Defines the number of results per page of results.

  - `total_count: optional number`

    Defines the total results available without any search parameters.

### Example

```http
curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/hyperdrive/configs \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

#### Response

```json
{
  "errors": [
    {
      "code": 1000,
      "message": "message",
      "documentation_url": "documentation_url",
      "source": {
        "pointer": "pointer"
      }
    }
  ],
  "messages": [
    {
      "code": 1000,
      "message": "message",
      "documentation_url": "documentation_url",
      "source": {
        "pointer": "pointer"
      }
    }
  ],
  "result": [
    {
      "id": "023e105f4ecef8ad9ca31a8372d0c353",
      "name": "example-hyperdrive",
      "origin": {
        "database": "postgres",
        "host": "database.example.com",
        "port": 5432,
        "scheme": "postgres",
        "user": "postgres"
      },
      "caching": {
        "disabled": true
      },
      "created_on": "2017-01-01T00:00:00Z",
      "modified_on": "2017-01-01T00:00:00Z",
      "mtls": {
        "ca_certificate_id": "00000000-0000-0000-0000-0000000000",
        "mtls_certificate_id": "00000000-0000-0000-0000-0000000000",
        "sslmode": "verify-full"
      },
      "origin_connection_limit": 60
    }
  ],
  "success": true,
  "result_info": {
    "count": 1,
    "page": 1,
    "per_page": 20,
    "total_count": 2000
  }
}
```

---

---
title: Connect to a private database using Tunnel
description: Securely connect Hyperdrive to private databases using Cloudflare Tunnel and Access.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Connect to a private database using Tunnel

Hyperdrive can securely connect to your private databases using [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) and [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).

Note

You can also connect Hyperdrive to a private database using [Workers VPC (Recommended)](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database-vpc/), which does not require configuring Access applications or service tokens.

## How it works

When your database is isolated within a private network (such as a [virtual private cloud ↗](https://www.cloudflare.com/learning/cloud/what-is-a-virtual-private-cloud) or an on-premise network), you must enable a secure connection from your network to Cloudflare.

* [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) is used to establish the secure tunnel connection.
* [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) is used to restrict access to your tunnel such that only specific Hyperdrive configurations can access it.

A request from the Cloudflare Worker to the origin database goes through Hyperdrive, Cloudflare Access, and the Cloudflare Tunnel established by `cloudflared`. `cloudflared` must be running in the private network in which your database is accessible.

The Cloudflare Tunnel will establish an outbound bidirectional connection from your private network to Cloudflare. Cloudflare Access will secure your Cloudflare Tunnel to be only accessible by your Hyperdrive configuration.

![A request from the Cloudflare Worker to the origin database goes through Hyperdrive, Cloudflare Access and the Cloudflare Tunnel established by cloudflared.](https://developers.cloudflare.com/_astro/hyperdrive-private-database-architecture.BrGTjEln_Z1b9CR9.webp) 

## Before you start

All of the tutorials assume you have already completed the [Get started guide](https://developers.cloudflare.com/workers/get-started/guide/), which gets you set up with a Cloudflare Workers account, [C3 ↗](https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare), and [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

Warning

If your organization also uses [Super Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/super-bot-fight-mode/), keep **Definitely Automated** set to **Allow**. Otherwise, tunnels might fail with a `websocket: bad handshake` error.

## Prerequisites

* A database in your private network, [configured to use TLS/SSL](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/).
* A hostname on your Cloudflare account, which will be used to route requests to your database.

## 1\. Create a tunnel in your private network

### 1.1\. Create a tunnel

First, create a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) in your private network to establish a secure connection between your network and Cloudflare. Your network must be configured such that the tunnel has permissions to egress to the Cloudflare network and access the database within your network.

1. Log in to the [Cloudflare dashboard ↗](https://dash.cloudflare.com/) and go to **Zero Trust** \> **Networks** \> **Connectors** \> **Cloudflare Tunnels**.
2. Select **Create a tunnel**.
3. Choose **Cloudflared** for the connector type and select **Next**.
4. Enter a name for your tunnel. We suggest choosing a name that reflects the type of resources you want to connect through this tunnel (for example, `enterprise-VPC-01`).
5. Select **Save tunnel**.
6. Next, you will need to install `cloudflared` and run it. To do so, check that the environment under **Choose an environment** reflects the operating system on your machine, then copy the command in the box below and paste it into a terminal window. Run the command.
7. Once the command has finished running, your connector will appear in Cloudflare One.  
![Connector appearing in the UI after cloudflared has run](https://developers.cloudflare.com/_astro/connector.BnVS4T_M_ZxLFu6.webp)
8. Select **Next**.

### 1.2\. Connect your database using a public hostname

Your tunnel must be configured to use a public hostname on Cloudflare so that Hyperdrive can route requests to it. If you don't have a hostname on Cloudflare yet, you will need to [register a new hostname](https://developers.cloudflare.com/registrar/get-started/register-domain/) or [add a zone](https://developers.cloudflare.com/dns/zone-setups/) to Cloudflare to proceed.

1. In the **Published application routes** tab, choose a **Domain** and specify any subdomain or path information. This will be used in your Hyperdrive configuration to route to this tunnel.
2. In the **Service** section, specify **Type** `TCP` and the URL and configured port of your database, such as `localhost:5432` or `my-database-host.database-provider.com:5432`. This address will be used by the tunnel to route requests to your database.
3. Select **Save tunnel**.

Note

If you are setting up the tunnel through the CLI instead ([locally-managed tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/)), you will have to complete these steps manually. Follow the Cloudflare Zero Trust documentation to [add a public hostname to your tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/) and [configure the public hostname to route to the address of your database](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/).

## 2\. Create and configure Hyperdrive to connect to the Cloudflare Tunnel

To restrict access to the Cloudflare Tunnel to Hyperdrive, a [Cloudflare Access application](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/) must be configured with a [Policy](https://developers.cloudflare.com/cloudflare-one/traffic-policies/) that requires requests to contain a valid [Service Auth token](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/#service-auth).

The Cloudflare dashboard can automatically create and configure the underlying [Cloudflare Access application](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/), [Service Auth token](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/#service-auth), and [Policy](https://developers.cloudflare.com/cloudflare-one/traffic-policies/) on your behalf. Alternatively, you can manually create the Access application and configure the Policies.

Automatic creation

### 2.1\. (Automatic) Create a Hyperdrive configuration in the Cloudflare dashboard

Create a Hyperdrive configuration in the Cloudflare dashboard to automatically configure Hyperdrive to connect to your Cloudflare Tunnel.

1. In the [Cloudflare dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive), navigate to **Storage & Databases > Hyperdrive** and click **Create configuration**.
2. Select **Private database**.
3. In the **Networking details** section, select the tunnel you are connecting to.
4. In the **Networking details** section, select the hostname associated to the tunnel. If there is no hostname for your database, return to step [1.2\. Connect your database using a public hostname](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/#12-connect-your-database-using-a-public-hostname).
5. In the **Access Service Authentication Token** section, select **Create new (automatic)**.
6. In the **Access Application** section, select **Create new (automatic)**.
7. In the **Database connection details** section, enter the database **name**, **user**, and **password**.

Manual creation

### 2.1\. (Manual) Create a service token

The service token will be used to restrict requests to the tunnel, and is needed for the next step.

1. In the [Cloudflare dashboard ↗](https://dash.cloudflare.com/), go to **Zero Trust** \> **Access controls** \> **Service credentials** \> **Service Tokens**.
2. Select **Create Service Token**.
3. Name the service token. The name allows you to easily identify events related to the token in the logs and to revoke the token individually.
4. Set a **Service Token Duration** of `Non-expiring`. This prevents the service token from expiring, ensuring it can be used throughout the life of the Hyperdrive configuration.
5. Select **Generate token**. You will see the generated Client ID and Client Secret for the service token, as well as their respective request headers.
6. Copy the Access Client ID and Access Client Secret. These will be used when creating the Hyperdrive configuration.  
Warning  
This is the only time Cloudflare Access will display the Client Secret. If you lose the Client Secret, you must regenerate the service token.

### 2.2\. (Manual) Create an Access application to secure the tunnel

[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) will be used to verify that requests to the tunnel originate from Hyperdrive using the service token created above.

1. In the [Cloudflare dashboard ↗](https://dash.cloudflare.com/), go to **Zero Trust** \> **Access controls** \> **Applications**.
2. Select **Add an application**.
3. Select **Self-hosted**.
4. Enter any name for the application.
5. In **Session Duration**, select `No duration, expires immediately`.
6. Select **Add public hostname**. and enter the subdomain and domain that was previously set for the tunnel application.
7. Select **Create new policy**.
8. Enter a **Policy name** and set the **Action** to _Service Auth_.
9. Create an **Include** rule. Specify a **Selector** of _Service Token_ and the **Value** of the service token you created in step [2\. Create a service token](#21-manual-create-a-service-token).
10. Save the policy.
11. Go back to the application configuration and add the newly created Access policy.
12. In **Login methods**, turn off _Accept all available identity providers_ and clear all identity providers.
13. Select **Next**.
14. In **Application Appearance**, turn off **Show application in App Launcher**.
15. Select **Next**.
16. Select **Next**.
17. Save the application.

### 2.3\. (Manual) Create a Hyperdrive configuration

To create a Hyperdrive configuration for your private database, you'll need to specify the Access application and Cloudflare Tunnel information upon creation.

* [ Wrangler ](#tab-panel-5854)
* [ Terraform ](#tab-panel-5855)

Terminal window

```

# wrangler v3.65 and above required

npx wrangler hyperdrive create <NAME-OF-HYPERDRIVE-CONFIGURATION-FOR-DB-VIA-TUNNEL> --host=<HOSTNAME-FOR-THE-TUNNEL> --user=<USERNAME-FOR-YOUR-DATABASE> --password=<PASSWORD-FOR-YOUR-DATABASE> --database=<DATABASE-TO-CONNECT-TO> --access-client-id=<YOUR-ACCESS-CLIENT-ID> --access-client-secret=<YOUR-SERVICE-TOKEN-CLIENT-SECRET>


```

```

resource "cloudflare_hyperdrive_config"  "<TERRAFORM_VARIABLE_NAME_FOR_CONFIGURATION>" {

  account_id = "<YOUR_ACCOUNT_ID>"

  name       = "<NAME_OF_HYPERDRIVE_CONFIGURATION>"

  origin     = {

    host     = "<HOSTNAME_OF_TUNNEL>"

    database = "<NAME_OF_DATABASE>"

    user     = "<NAME_OF_DATABASE_USER>"

    password = "<DATABASE_PASSWORD>"

    scheme   = "postgres"

    access_client_id     = "<ACCESS_CLIENT_ID>"

    access_client_secret = "<ACCESS_CLIENT_SECRET>"

  }

  caching = {

    disabled = false

  }

}


```

This will create a Hyperdrive configuration using the usual database information (database name, database host, database user, and database password).

In addition, it will also set the Access Client ID and the Access Client Secret of the Service Token. When Hyperdrive makes requests to the tunnel, requests will be intercepted by Access and validated using the credentials of the Service Token.

Note

When creating the Hyperdrive configuration for the private database, you must enter the `access-client-id` and the `access-client-secret`, and omit the `port`. Hyperdrive will route database messages to the public hostname of the tunnel, and the tunnel will rely on its service configuration (as configured in [1.2\. Connect your database using a public hostname](#12-connect-your-database-using-a-public-hostname)) to route requests to the database within your private network.

## 3\. Query your Hyperdrive configuration from a Worker (optional)

To test your Hyperdrive configuration to the database using Cloudflare Tunnel and Access, use the Hyperdrive configuration ID in your Worker and deploy it.

### 3.1\. Create a Hyperdrive binding

You must create a binding in your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) for your Worker to connect to your Hyperdrive configuration. [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) allow your Workers to access resources, like Hyperdrive, on the Cloudflare developer platform.

To bind your Hyperdrive configuration to your Worker, add the following to the end of your Wrangler file:

* [  wrangler.jsonc ](#tab-panel-5856)
* [  wrangler.toml ](#tab-panel-5857)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>" // the ID associated with the Hyperdrive you just created

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_DATABASE_ID>"


```

Specifically:

* The value (string) you set for the `binding` (binding name) will be used to reference this database in your Worker. In this tutorial, name your binding `HYPERDRIVE`.
* The binding must be [a valid JavaScript variable name ↗](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar%5Fand%5Ftypes#variables). For example, `binding = "hyperdrive"` or `binding = "productionDB"` would both be valid names for the binding.
* Your binding is available in your Worker at `env.<BINDING_NAME>`.

If you wish to use a local database during development, you can add a `localConnectionString` to your Hyperdrive configuration with the connection string of your database:

* [  wrangler.jsonc ](#tab-panel-5858)
* [  wrangler.toml ](#tab-panel-5859)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>", // the ID associated with the Hyperdrive you just created

      "localConnectionString": "<LOCAL_DATABASE_CONNECTION_URI>"

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_DATABASE_ID>"

localConnectionString = "<LOCAL_DATABASE_CONNECTION_URI>"


```

Note

Learn more about setting up [Hyperdrive for local development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/).

### 3.2\. Query your database

Validate that you can connect to your database from Workers and make queries.

* [ PostgreSQL ](#tab-panel-5864)
* [ MySQL ](#tab-panel-5865)

Use [node-postgres ↗](https://node-postgres.com/) (`pg`) to send a test query to validate that the connection has been successful.

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5860)
* [  wrangler.toml ](#tab-panel-5861)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

Now, deploy your Worker:

Terminal window

```

npx wrangler deploy


```

If you successfully receive the list of `pg_tables` from your database when you access your deployed Worker, your Hyperdrive has now been configured to securely connect to a private database using [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) and [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).

Use [mysql2 ↗](https://github.com/sidorares/node-mysql2) to send a test query to validate that the connection has been successful.

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5862)
* [  wrangler.toml ](#tab-panel-5863)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

Now, deploy your Worker:

Terminal window

```

npx wrangler deploy


```

If you successfully receive the list of tables from your database when you access your deployed Worker, your Hyperdrive has now been configured to securely connect to a private database using [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) and [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).

## Troubleshooting

If you encounter issues when setting up your Hyperdrive configuration with tunnels to a private database, consider these common solutions, in addition to [general troubleshooting steps](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) for Hyperdrive:

* Ensure your database is configured to use TLS (SSL). Hyperdrive requires TLS (SSL) to connect.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/connect-to-private-database/","name":"Connect to a private database using Tunnel"}}]}
```

---

---
title: Connect to a private database using Workers VPC (Recommended)
description: Workers VPC provides a way to connect Hyperdrive to a private database without configuring Cloudflare Access applications or service tokens. Instead, you create a TCP VPC Service that points to your database and pass its service ID to Hyperdrive.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Connect to a private database using Workers VPC (Recommended)

[Workers VPC](https://developers.cloudflare.com/workers-vpc/) provides a way to connect Hyperdrive to a private database without configuring Cloudflare Access applications or service tokens. Instead, you create a TCP [VPC Service](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/) that points to your database and pass its service ID to Hyperdrive.

For the Tunnel and Access approach, refer to [Connect to a private database using Tunnel](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

## How it works

When your database is isolated within a private network (such as a [virtual private cloud ↗](https://www.cloudflare.com/learning/cloud/what-is-a-virtual-private-cloud) or an on-premise network), you must enable a secure connection from your network to Cloudflare.

* [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) is used to establish a secure outbound connection from your private network to Cloudflare.
* A [VPC Service](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/) is used to route traffic from your Worker through the tunnel to your database, without requiring Cloudflare Access applications or service tokens.

A request from the Cloudflare Worker to the origin database goes through Hyperdrive, the VPC Service, and the Cloudflare Tunnel established by `cloudflared`. `cloudflared` must be running in the private network in which your database is accessible.

flowchart LR
    A[Cloudflare Worker] --> B[Hyperdrive] --> C[VPC Service] --> D[Cloudflare Tunnel] --> E[Private Database]

## Before you start

All of the tutorials assume you have already completed the [Get started guide](https://developers.cloudflare.com/workers/get-started/guide/), which gets you set up with a Cloudflare Workers account, [C3 ↗](https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare), and [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

## Prerequisites

* A database in your private network, [configured to use TLS/SSL](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/#supported-tls-ssl-modes).
* A [Cloudflare Tunnel](https://developers.cloudflare.com/workers-vpc/configuration/tunnel/) running in a network that can reach your database.
* The **Connectivity Directory Admin** role on your Cloudflare account to create VPC Services.

## 1\. Set up a Cloudflare Tunnel

If you do not already have a tunnel running in the same network as your database, create one.

1. Go to the [Workers VPC dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/vpc/tunnels) and select the **Tunnels** tab.
2. Select **Create** to create a tunnel.
3. Enter a name for your tunnel and select **Save tunnel**.
4. Choose your operating system and architecture. The dashboard will provide installation instructions.
5. Follow the provided commands to download, install, and run `cloudflared` with your unique token.

The tunnel must be able to reach your database host and port from within the private network.

For full tunnel documentation, refer to [Cloudflare Tunnel for Workers VPC](https://developers.cloudflare.com/workers-vpc/configuration/tunnel/).

## 2\. Create a TCP VPC Service

Create a VPC Service of type `tcp` that points to your database. Set the `--app-protocol` flag to `postgresql` or `mysql` so that Hyperdrive can optimize connections.

* [ PostgreSQL ](#tab-panel-5866)
* [ MySQL ](#tab-panel-5867)

Terminal window

```

npx wrangler vpc service create my-postgres-db \

  --type tcp \

  --tcp-port 5432 \

  --app-protocol postgresql \

  --tunnel-id <YOUR_TUNNEL_ID> \

  --ipv4 <YOUR_DATABASE_IP>


```

Terminal window

```

npx wrangler vpc service create my-mysql-db \

  --type tcp \

  --tcp-port 3306 \

  --app-protocol mysql \

  --tunnel-id <YOUR_TUNNEL_ID> \

  --ipv4 <YOUR_DATABASE_IP>


```

Replace:

* `<YOUR_TUNNEL_ID>` with the tunnel ID from step 1.
* `<YOUR_DATABASE_IP>` with the private IP address of your database (for example, `10.0.0.5`). You can also use `--hostname` with a DNS name instead of `--ipv4`.

The command will return a service ID. Save this value for the next step.

You can also create a TCP VPC Service from the [Workers VPC dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/vpc). Refer to [VPC Services](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/) for all configuration options.

### TLS certificate verification

Unlike Hyperdrive, which does not verify the origin server certificate by default, Workers VPC defaults to `verify_full` — it verifies both the certificate chain and the hostname. If your database uses a self-signed certificate or a certificate from a private certificate authority (CA), the TLS handshake will fail unless you adjust the verification mode.

For databases with self-signed certificates, add `--cert-verification-mode` when creating the VPC Service:

* `verify_ca` — Verifies the certificate chain but skips hostname verification. Use this when your database has a certificate signed by a CA you control but the hostname does not match the certificate.
* `disabled` — Skips certificate verification entirely. Use this only for development or testing.

For example, to create a VPC Service for a PostgreSQL database with a self-signed certificate:

Terminal window

```

npx wrangler vpc service create my-postgres-db \

  --type tcp \

  --tcp-port 5432 \

  --app-protocol postgresql \

  --tunnel-id <YOUR_TUNNEL_ID> \

  --ipv4 <YOUR_DATABASE_IP> \

  --cert-verification-mode verify_ca


```

To update an existing VPC Service, use `wrangler vpc service update` with the same flag.

Note

Workers VPC trusts publicly trusted certificates and [Cloudflare Origin CA certificates](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/). Uploading a custom CA certificate to Workers VPC is not supported yet. If your database uses a certificate signed by a private CA, set `--cert-verification-mode` to `verify_ca` or `disabled` until custom CA support is available.

For the full list of verification modes, refer to [TLS certificate verification mode](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/#tls-certificate-verification-mode).

## 3\. Create a Hyperdrive configuration

Use the `--service-id` flag to point Hyperdrive at the VPC Service you created. When you use `--service-id`, you do not provide `--origin-host`, `--origin-port`, or `--connection-string`. Hyperdrive routes traffic through the VPC Service instead.

* [ PostgreSQL ](#tab-panel-5868)
* [ MySQL ](#tab-panel-5869)

Terminal window

```

npx wrangler hyperdrive create <YOUR_CONFIG_NAME> \

  --service-id <YOUR_VPC_SERVICE_ID> \

  --database <DATABASE_NAME> \

  --user <DATABASE_USER> \

  --password <DATABASE_PASSWORD> \

  --scheme postgresql


```

Terminal window

```

npx wrangler hyperdrive create <YOUR_CONFIG_NAME> \

  --service-id <YOUR_VPC_SERVICE_ID> \

  --database <DATABASE_NAME> \

  --user <DATABASE_USER> \

  --password <DATABASE_PASSWORD> \

  --scheme mysql


```

Replace:

* `<YOUR_VPC_SERVICE_ID>` with the service ID from step 2.
* `<DATABASE_NAME>` with the name of your database.
* `<DATABASE_USER>` and `<DATABASE_PASSWORD>` with your database credentials.

If successful, the command will output a Hyperdrive configuration with an `id` field. Copy this ID for the next step.

Note

The `--service-id` flag conflicts with `--origin-host`, `--origin-port`, `--connection-string`, `--access-client-id`, and `--access-client-secret`. You cannot combine these options. To update an existing Hyperdrive configuration to use a VPC Service, run `wrangler hyperdrive update` with the `--service-id` flag.

## 4\. Bind Hyperdrive to a Worker

You must create a binding in your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) for your Worker to connect to your Hyperdrive configuration. [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) allow your Workers to access resources, like Hyperdrive, on the Cloudflare developer platform.

To bind your Hyperdrive configuration to your Worker, add the following to the end of your Wrangler file:

* [  wrangler.jsonc ](#tab-panel-5870)
* [  wrangler.toml ](#tab-panel-5871)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>" // the ID associated with the Hyperdrive you just created

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_DATABASE_ID>"


```

Specifically:

* The value (string) you set for the `binding` (binding name) will be used to reference this database in your Worker. In this tutorial, name your binding `HYPERDRIVE`.
* The binding must be [a valid JavaScript variable name ↗](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar%5Fand%5Ftypes#variables). For example, `binding = "hyperdrive"` or `binding = "productionDB"` would both be valid names for the binding.
* Your binding is available in your Worker at `env.<BINDING_NAME>`.

If you wish to use a local database during development, you can add a `localConnectionString` to your Hyperdrive configuration with the connection string of your database:

* [  wrangler.jsonc ](#tab-panel-5872)
* [  wrangler.toml ](#tab-panel-5873)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>", // the ID associated with the Hyperdrive you just created

      "localConnectionString": "<LOCAL_DATABASE_CONNECTION_URI>"

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<YOUR_DATABASE_ID>"

localConnectionString = "<LOCAL_DATABASE_CONNECTION_URI>"


```

Note

Learn more about setting up [Hyperdrive for local development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/).

## 5\. Query the database

* [ PostgreSQL ](#tab-panel-5878)
* [ MySQL ](#tab-panel-5879)

Use [node-postgres ↗](https://node-postgres.com/) (`pg`) to send a test query.

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5874)
* [  wrangler.toml ](#tab-panel-5875)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

Deploy your Worker:

Terminal window

```

npx wrangler deploy


```

If you receive a list of `pg_tables` from your database when you access your deployed Worker, Hyperdrive is connected to your private database through Workers VPC.

Use [mysql2 ↗](https://github.com/sidorares/node-mysql2) to send a test query.

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5876)
* [  wrangler.toml ](#tab-panel-5877)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

Deploy your Worker:

Terminal window

```

npx wrangler deploy


```

If you receive a list of tables from your database when you access your deployed Worker, Hyperdrive is connected to your private database through Workers VPC.

## Next steps

* Learn more about [how Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Configure [query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/) for Hyperdrive.
* Review [VPC Service configuration options](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/) including TLS certificate verification.
* Set up [high availability tunnels](https://developers.cloudflare.com/workers-vpc/configuration/tunnel/hardware-requirements/) for production workloads.
* [Troubleshoot common issues](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) when connecting a database to Hyperdrive.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/connect-to-private-database-vpc/","name":"Connect to a private database using Workers VPC (Recommended)"}}]}
```

---

---
title: Firewall and networking configuration
description: Configure firewall rules and networking to allow Hyperdrive to connect to your database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Firewall and networking configuration

Hyperdrive uses the [Cloudflare IP address ranges ↗](https://www.cloudflare.com/ips/) to connect to your database. If you decide to restrict the IP addresses that can access your database with firewall rules, the IP address ranges listed in this reference need to be allow-listed in your database's firewall and networking configurations.

You can connect to your database from Hyperdrive using any of the 3 following networking configurations:

1. Configure your database to allow inbound connectivity from the public Internet (all IP address ranges).
2. Configure your database to allow inbound connectivity from the public Internet, with only the IP address ranges used by Hyperdrive allow-listed in an IP access control list (ACL).
3. Configure your database to allow inbound connectivity from a private network, and run a Cloudflare Tunnel instance in your private network to enable Hyperdrive to connect from the Cloudflare network to your private network. Refer to [documentation on connecting to a private database using Tunnel](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/firewall-and-networking-configuration/","name":"Firewall and networking configuration"}}]}
```

---

---
title: Local development
description: Develop and test Hyperdrive-connected Workers locally using Wrangler.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Local development

Hyperdrive can be used when developing and testing your Workers locally. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), the command-line interface for Workers, provides two options for local development:

* **`wrangler dev`** (default): Runs your Worker code locally on your machine. You configure a `localConnectionString` to connect directly to a database (either local or remote). Hyperdrive query caching does not take effect in this mode.
* **`wrangler dev --remote`**: Runs your Worker on Cloudflare's using your deployed Hyperdrive configuration. This is useful for testing with Hyperdrive's connection pooling and query caching enabled.

## Use `wrangler dev`

By default, `wrangler dev` runs your Worker code locally on your machine. To connect to a database during local development, configure a `localConnectionString` that points directly to your database.

The `localConnectionString` works with both local and remote databases:

* **Local databases**: Connect to a database instance running on your machine (for example, `postgres://user:password@localhost:5432/database`)
* **Remote databases**: Connect directly to remote databases over TLS (for example, `postgres://user:password@remote-host.example.com:5432/database?sslmode=require` or `mysql://user:password@remote-host.example.com:3306/database?sslMode=required`). You must specify the SSL/TLS mode if required.

Note

When using `localConnectionString`, Hyperdrive's connection pooling and query caching do not take effect. Your Worker connects directly to the database without going through Hyperdrive.

### Configure with environment variable

The recommended approach is to use an environment variable to avoid committing credentials to source control:

Terminal window

```

# Your configured Hyperdrive binding is "HYPERDRIVE"

export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://user:password@your-database-host:5432/database"

npx wrangler dev


```

The environment variable format is `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING_NAME>`, where `<BINDING_NAME>` is the name of the binding assigned to your Hyperdrive in your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/).

To unset an environment variable: `unset CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING_NAME>`

For example, to set the connection string for a local database:

Terminal window

```

export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://user:password@localhost:5432/databasename"

npx wrangler dev


```

### Configure in Wrangler configuration file

Alternatively, you can set `localConnectionString` in your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

* [  wrangler.jsonc ](#tab-panel-5880)
* [  wrangler.toml ](#tab-panel-5881)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "c020574a-5623-407b-be0c-cd192bab9545",

      "localConnectionString": "postgres://user:password@localhost:5432/databasename"

    }

  ]

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "c020574a-5623-407b-be0c-cd192bab9545"

localConnectionString = "postgres://user:password@localhost:5432/databasename"


```

If both an environment variable and `localConnectionString` in the Wrangler configuration file are set, the environment variable takes precedence.

## Use `wrangler dev --remote`

When you run `wrangler dev --remote`, your Worker runs in Cloudflare's network and uses your deployed Hyperdrive configuration. This means:

* Your Worker code executes in Cloudflare's production environment, not locally
* Hyperdrive's connection pooling and query caching are active
* You connect to the database configured in your Hyperdrive configuration (created with `wrangler hyperdrive create`)
* Changes made during the session interact with remote resources

This mode is useful for testing how your Worker behaves with Hyperdrive's features enabled before deploying.

Configure your Hyperdrive binding in `wrangler.jsonc`:

* [  wrangler.jsonc ](#tab-panel-5882)
* [  wrangler.toml ](#tab-panel-5883)

JSONC

```

{

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "your-hyperdrive-id",

    },

  ],

}


```

TOML

```

[[hyperdrive]]

binding = "HYPERDRIVE"

id = "your-hyperdrive-id"


```

To start a remote development session:

Terminal window

```

npx wrangler dev --remote


```

Note

The `localConnectionString` field is not used with `wrangler dev --remote`. Instead, your Worker connects to the database configured in your deployed Hyperdrive configuration.

Warning

Use `wrangler dev --remote` with caution. Since your Worker runs in Cloudflare's production environment, any database writes or side effects will affect your production data.

Refer to the [wrangler dev documentation](https://developers.cloudflare.com/workers/wrangler/commands/general/#dev) to learn more about how to configure a local development session.

## Related resources

* Use [wrangler dev](https://developers.cloudflare.com/workers/wrangler/commands/general/#dev) to run your Worker and Hyperdrive locally and debug issues before deploying.
* Learn [how Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Understand how to [configure query caching in Hyperdrive](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/local-development/","name":"Local development"}}]}
```

---

---
title: Rotating database credentials
description: Update or rotate database credentials for an existing Hyperdrive configuration.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Rotating database credentials

You can change the connection information and credentials of your Hyperdrive configuration in one of two ways:

1. Create a new Hyperdrive configuration with the new connection information, and update your Worker to use the new Hyperdrive configuration.
2. Update the existing Hyperdrive configuration with the new connection information and credentials.

## Use a new Hyperdrive configuration

Creating a new Hyperdrive configuration to update your database credentials allows you to keep your existing Hyperdrive configuration unchanged, gradually migrate your Worker to the new Hyperdrive configuration, and easily roll back to the previous configuration if needed.

To create a Hyperdrive configuration that connects to an existing PostgreSQL or MySQL database, use the [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI or the [Cloudflare dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive).

Terminal window

```

# wrangler v3.11 and above required

npx wrangler hyperdrive create my-updated-hyperdrive --connection-string="<YOUR_CONNECTION_STRING>"


```

The command above will output the ID of your Hyperdrive. Set this ID in the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) for your Workers project:

* [  wrangler.jsonc ](#tab-panel-5884)
* [  wrangler.toml ](#tab-panel-5885)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

To update your Worker to use the new Hyperdrive configuration, redeploy your Worker or use [gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/).

## Update the existing Hyperdrive configuration

You can update the configuration of an existing Hyperdrive configuration using the [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

Terminal window

```

# wrangler v3.11 and above required

npx wrangler hyperdrive update <HYPERDRIVE_CONFIG_ID> --origin-host <YOUR_ORIGIN_HOST> --origin-password <YOUR_ORIGIN_PASSWORD> --origin-user <YOUR_ORIGIN_USERNAME> --database <YOUR_DATABASE> --origin-port <YOUR_ORIGIN_PORT>


```

Note

Updating the settings of an existing Hyperdrive configuration does not purge Hyperdrive's cache and does not tear down the existing database connection pool. New connections will be established using the new connection information.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/rotate-credentials/","name":"Rotating database credentials"}}]}
```

---

---
title: SSL/TLS certificates
description: Configure SSL/TLS server and client certificates for secure Hyperdrive database connections.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# SSL/TLS certificates

Hyperdrive provides additional ways to secure connectivity to your database. Hyperdrive supports:

1. **Server certificates** for TLS (SSL) modes such as `verify-ca`/`VERIFY_CA` and `verify-full`/`VERIFY_IDENTITY` for increased security. When configured, Hyperdrive will verify that the certificates have been signed by the expected certificate authority (CA) to avoid man-in-the-middle attacks.
2. **Client certificates** for Hyperdrive to authenticate itself to your database with credentials beyond username/password. To properly use client certificates, your database must be configured to verify the client certificates provided by a client, such as Hyperdrive, to allow access to the database.

Hyperdrive can be configured to use only server certificates, only client certificates, or both depending on your security requirements and database configurations.

## Server certificates (TLS/SSL modes)

Hyperdrive supports common encryption TLS/SSL modes to connect to your database. The mode names differ between PostgreSQL and MySQL:

| PostgreSQL        | MySQL              | Description                                                                                                                                                                                                        |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| require (default) | REQUIRED (default) | TLS is required for encrypted connectivity and server certificates are validated (based on WebPKI).                                                                                                                |
| verify-ca         | VERIFY\_CA         | Hyperdrive will verify that the database server is trustworthy by verifying that the certificates of the server have been signed by the expected root certificate authority or intermediate certificate authority. |
| verify-full       | VERIFY\_IDENTITY   | In addition to verify-ca/VERIFY\_CA checks, Hyperdrive requires the database hostname to match a Subject Alternative Name (SAN) or Common Name (CN) on the certificate.                                            |

By default, all Hyperdrive configurations are encrypted with SSL/TLS (`require`/`REQUIRED`). This requires your database to be configured to accept encrypted connections (with SSL/TLS).

You can configure Hyperdrive to use `verify-ca`/`VERIFY_CA` and `verify-full`/`VERIFY_IDENTITY` for a more stringent security configuration, which provide additional verification checks of the server's certificates. This helps guard against man-in-the-middle attacks.

To configure Hyperdrive to verify the certificates of the server, you must provide Hyperdrive with the certificate of the root certificate authority (CA) or an intermediate certificate which has been used to sign the certificate of your database.

### Step 1: Upload the root certificate authority (CA) certificate

Using Wrangler, you can upload your root certificate authority (CA) certificate:

Terminal window

```

# requires Wrangler 4.9.0 or greater

npx wrangler cert upload certificate-authority --ca-cert \<ROUTE_TO_CA_PEM_FILE\>.pem --name \<CUSTOM_NAME_FOR_CA_CERT\>


---


Uploading CA Certificate tmp-cert...

Success! Uploaded CA Certificate <CUSTOM_NAME_FOR_CA_CERT>

ID: <YOUR_ID_FOR_THE_CA_CERTIFICATE>

...


```

Note

You must use the CA certificate bundle that is for your specific region. You cannot use a CA certificate bundle that contains more than one CA certificate, such as a global bundle of CA certificates containing each region's certificate.

### Step 2: Create your Hyperdrive configuration using the CA certificate and the SSL mode

Once your CA certificate has been created, you can create a Hyperdrive configuration with the newly created certificates using either the dashboard or Wrangler. You must also specify the SSL mode to use (`verify-ca`/`verify-full` for PostgreSQL or `VERIFY_CA`/`VERIFY_IDENTITY` for MySQL).

* [ Wrangler ](#tab-panel-5886)
* [ Dashboard ](#tab-panel-5887)

Using Wrangler, enter the following command in your terminal to create a Hyperdrive configuration with the CA certificate and SSL mode:

Terminal window

```

# PostgreSQL with verify-full

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name" --ca-certificate-id <YOUR_CA_CERT_ID> --sslmode verify-full


# MySQL with VERIFY_IDENTITY

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name" --ca-certificate-id <YOUR_CA_CERT_ID> --sslmode VERIFY_IDENTITY


```

From the dashboard, follow these steps to create a Hyperdrive configuration with server certificates:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create configuration**.
3. Select **Server certificates**.
4. Specify a SSL mode of **Verify CA** or **Verify full**.
5. Select the SSL certificate of the certificate authority (CA) of your database that you have previously uploaded with Wrangler.

When creating the Hyperdrive configuration, Hyperdrive will attempt to connect to the database with the provided credentials. If the command provides successful results, you have properly configured your Hyperdrive configuration to verify the certificates provided by your database server.

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## Client certificates

Your database can be configured to verify a certificate provided by the client (in this case, Hyperdrive). This serves as an additional factor to authenticate clients (in addition to the username and password). Refer to the [PostgreSQL ↗](https://www.postgresql.org/docs/current/libpq-ssl.html#LIBPQ-SSL-CLIENTCERT) or [MySQL ↗](https://dev.mysql.com/doc/refman/8.0/en/using-encrypted-connections.html) documentation for more details.

For the database server to be able to verify the client certificates, Hyperdrive must be configured to provide a certificate file (`client-cert.pem`) and a private key with which the certificate was generated (`private-key.pem`).

### Step 1: Upload your client certificates (mTLS certificates)

Upload your client certificates to be used by Hyperdrive using Wrangler:

Terminal window

```

# requires Wrangler 4.9.0 or greater

npx wrangler cert upload mtls-certificate --cert client-cert.pem --key client-key.pem --name <CUSTOM_NAME_FOR_CLIENT_CERTIFICATE>


---


Uploading client certificate <CUSTOM_NAME_FOR_CLIENT_CERTIFICATE>...

Success! Uploaded client certificate <CUSTOM_NAME_FOR_CLIENT_CERTIFICATE>

ID: <YOUR_ID_FOR_THE_CLIENT_CERTIFICATE_PAIR>

...


```

### Step 2: Create a Hyperdrive configuration

You can now create a Hyperdrive configuration using the newly created client certificate bundle using the dashboard or Wrangler.

* [ Wrangler ](#tab-panel-5888)
* [ Dashboard ](#tab-panel-5889)

Using Wrangler, enter the following command in your terminal to create a Hyperdrive configuration with the client certificate pair:

Terminal window

```

# PostgreSQL

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name" --mtls-certificate-id <YOUR_CLIENT_CERT_PAIR_ID>


# MySQL

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name" --mtls-certificate-id <YOUR_CLIENT_CERT_PAIR_ID>


```

From the dashboard, follow these steps to create a Hyperdrive configuration with server certificates:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create configuration**.
3. Select **Client certificates**.
4. Select the SSL client certificate and private key pair for Hyperdrive to use during the connection setup with your database server.

When Hyperdrive connects to your database, it will provide a client certificate signed with the private key to the database server. This allows the database server to confirm that the client, in this case Hyperdrive, has both the private key and the client certificate. By using client certificates, you can add an additional authentication layer for your database to ensure that only Hyperdrive can connect to it.

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/","name":"SSL/TLS certificates"}}]}
```

---

---
title: Tune connection pooling
description: Configure the maximum number of database connections in your Hyperdrive connection pool.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Tune connection pooling

Hyperdrive maintains a pool of connections to your database that are shared across Worker invocations. You can configure the maximum number of these connections based on your database capacity and application requirements.

Note

Hyperdrive does not have a limit on the number of concurrent _client_ connections made from your Workers to Hyperdrive.

Hyperdrive does have a limit of _origin_ connections that can be made from Hyperdrive to your database. These are shared across Workers, with each Worker using one of these connections over the course of a database transaction. Refer to [transaction pooling mode](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/#pooling-mode) for more information.

## Configure connection pool size

You can configure the connection pool size using the Cloudflare dashboard, the Wrangler CLI, or the Cloudflare API.

* [ Dashboard ](#tab-panel-5890)
* [ Wrangler ](#tab-panel-5891)
* [ API ](#tab-panel-5892)

To configure connection pool size via the dashboard:

1. Log in to the [Cloudflare dashboard ↗](https://dash.cloudflare.com) and select your account.
2. Go to **Storage & databases** \> **Hyperdrive**.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
3. Select your Hyperdrive configuration.
4. Select **Settings**.
5. In the **Origin connection limit** section, adjust the **Maximum connections** value.
6. Select **Save**.

Use the [wrangler hyperdrive update](https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/#hyperdrive-update) command with the `--origin-connection-limit` flag:

Terminal window

```

npx wrangler hyperdrive update <HYPERDRIVE_ID> --origin-connection-limit=<MAX_CONNECTIONS>


```

Use the [Hyperdrive REST API](https://developers.cloudflare.com/api/resources/hyperdrive/subresources/configs/methods/update/) to update your configuration:

Terminal window

```

curl --request PATCH \

  --url https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/hyperdrive/configs/<HYPERDRIVE_ID> \

  --header 'Content-Type: application/json' \

  --header 'Authorization: Bearer <API_TOKEN>' \

  --data '{

    "origin_connection_limit": <MAX_CONNECTIONS>

  }'


```

All Hyperdrive configurations have a minimum of 5 connections. The maximum connection count depends on your [Workers plan](https://developers.cloudflare.com/hyperdrive/platform/limits/).

Note

The Hyperdrive connection pool limit is a "soft limit". This means that it is possible for Hyperdrive to make more connections to your database than this limit in the event of network failure to ensure high availability. We recommend that you set the Hyperdrive connection limit to be lower than the limit of your origin database to account for occasions where Hyperdrive needs to create more connections for resiliency.

Note

You can request adjustments to Hyperdrive's origin connection limits. To request an increase, submit a [Limit Increase Request ↗](https://forms.gle/ukpeZVLWLnKeixDu7) and Cloudflare will contact you with next steps. Cloudflare also regularly monitors the Hyperdrive channel in [Cloudflare's Discord community ↗](https://discord.cloudflare.com/) and can answer questions regarding limits and requests.

## Best practices

* **Start conservatively**: Begin with a lower connection count and gradually increase it based on your application's performance.
* **Monitor database metrics**: Watch your database's connection usage and performance metrics to optimize the connection count.
* **Consider database limits**: Ensure your configured connection count does not exceed your database's maximum connection limit.
* **Account for multiple configurations**: If you have multiple Hyperdrive configurations connecting to the same database, consider the total connection count across all configurations.

## Related resources

* [Connection pooling concepts](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/)
* [Connection lifecycle](https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/)
* [Metrics and analytics](https://developers.cloudflare.com/hyperdrive/observability/metrics/)
* [Hyperdrive limits](https://developers.cloudflare.com/hyperdrive/platform/limits/)
* [Query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/configuration/","name":"Configuration"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/configuration/tune-connection-pool/","name":"Tune connection pooling"}}]}
```

---

---
title: Connect to MySQL
description: Use Hyperdrive to connect to MySQL and MySQL-compatible databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Connect to MySQL

**Last reviewed:**  about 1 year ago 

Hyperdrive supports MySQL and MySQL-compatible databases, [popular drivers](#supported-drivers), and Object Relational Mapper (ORM) libraries that use those drivers.

## Create a Hyperdrive

Note

New to Hyperdrive? Refer to the [Get started guide](https://developers.cloudflare.com/hyperdrive/get-started/) to learn how to set up your first Hyperdrive.

To create a Hyperdrive that connects to an existing MySQL database, use the [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI or the [Cloudflare dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive).

When using Wrangler, replace the placeholder value provided to `--connection-string` with the connection string for your database:

Terminal window

```

# wrangler v3.11 and above required

npx wrangler hyperdrive create my-first-hyperdrive --connection-string="mysql://user:password@database.host.example.com:3306/databasenamehere"


```

The command above will output the ID of your Hyperdrive, which you will need to set in the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) for your Workers project:

* [  wrangler.jsonc ](#tab-panel-5893)
* [  wrangler.toml ](#tab-panel-5894)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

This will allow Hyperdrive to generate a dynamic connection string within your Worker that you can pass to your existing database driver. Refer to [Driver examples](#driver-examples) to learn how to set up a database driver with Hyperdrive.

Refer to the [Examples documentation](https://developers.cloudflare.com/hyperdrive/examples/) for step-by-step guides on how to set up Hyperdrive with several popular database providers.

## Supported drivers

Hyperdrive uses Workers [TCP socket support](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/#connect) to support TCP connections to databases. The following table lists the supported database drivers and the minimum version that works with Hyperdrive:

| Driver                   | Documentation                                                      | Minimum Version Required | Notes                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mysql2 (**recommended**) | [mysql2 documentation ↗](https://github.com/sidorares/node-mysql2) | mysql2@3.13.0            | Supported in both Workers & Pages. Using the Promise API is recommended.                                                                                                                                                           |
| mysql                    | [mysql documentation ↗](https://github.com/mysqljs/mysql)          | mysql@2.18.0             | Requires compatibility\_flags = \["nodejs\_compat"\] and compatibility\_date = "2024-09-23" \- refer to [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs). Requires wrangler 3.78.7 or later. |
| Drizzle                  | [Drizzle documentation ↗](https://orm.drizzle.team/)               | Requires mysql2@3.13.0   |                                                                                                                                                                                                                                    |
| Kysely                   | [Kysely documentation ↗](https://kysely.dev/)                      | Requires mysql2@3.13.0   |                                                                                                                                                                                                                                    |

^ _The marked libraries can use either mysql or mysql2 as a dependency._

Other drivers and ORMs not listed may also be supported: this list is not exhaustive.

### Database drivers and Node.js compatibility

[Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) is required for database drivers, including mysql and mysql2, and needs to be configured for your Workers project.

To enable both built-in runtime APIs and polyfills for your Worker or Pages project, add the [nodejs\_compat](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) [compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) to your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/), and set your compatibility date to September 23rd, 2024 or later. This will enable [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) for your Workers project.

* [  wrangler.jsonc ](#tab-panel-5895)
* [  wrangler.toml ](#tab-panel-5896)

JSONC

```

{

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30"

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


```

## Supported TLS (SSL) modes

Hyperdrive supports the following MySQL TLS/SSL connection modes when connecting to your origin database:

| Mode             | Supported         | Details                                                                                                                                                       |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DISABLED         | No                | Hyperdrive does not support insecure plain text connections.                                                                                                  |
| PREFERRED        | No (use REQUIRED) | Hyperdrive will always use TLS.                                                                                                                               |
| REQUIRED         | Yes (default)     | TLS is required, and server certificates are validated (based on WebPKI).                                                                                     |
| VERIFY\_CA       | Yes               | Verifies the server's TLS certificate is signed by a root CA on the client.                                                                                   |
| VERIFY\_IDENTITY | Yes               | In addition to VERIFY\_CA checks, Hyperdrive requires the database hostname to match a Subject Alternative Name (SAN) or Common Name (CN) on the certificate. |

Refer to [SSL/TLS certificates](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/) documentation for details on how to configure `VERIFY_CA` or `VERIFY_IDENTITY` TLS (SSL) modes for Hyperdrive.

## Driver examples

The following examples show you how to:

1. Create a database client with a database driver.
2. Pass the Hyperdrive connection string and connect to the database.
3. Query your database via Hyperdrive.

### `mysql2`

The following Workers code shows you how to use [mysql2 ↗](https://github.com/sidorares/node-mysql2) with Hyperdrive using the Promise API.

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5897)
* [  wrangler.toml ](#tab-panel-5898)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

### `mysql`

The following Workers code shows you how to use [mysql ↗](https://github.com/mysqljs/mysql) with Hyperdrive.

Install the [mysql ↗](https://github.com/mysqljs/mysql) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql
```

```
yarn add mysql
```

```
pnpm add mysql
```

```
bun add mysql
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5899)
* [  wrangler.toml ](#tab-panel-5900)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new connection and pass the Hyperdrive parameters:

TypeScript

```

import { createConnection } from "mysql";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    const result = await new Promise<any>((resolve) => {

      // Create a connection using the mysql driver with the Hyperdrive credentials (only accessible from your Worker).

      const connection = createConnection({

        host: env.HYPERDRIVE.host,

        user: env.HYPERDRIVE.user,

        password: env.HYPERDRIVE.password,

        database: env.HYPERDRIVE.database,

        port: env.HYPERDRIVE.port,

      });


      connection.connect((error: { message: string }) => {

        if (error) {

          throw new Error(error.message);

        }


        // Sample query

        connection.query("SHOW tables;", [], (error, rows, fields) => {

          resolve({ fields, rows });

        });

      });

    });


    // Return result  as JSON

    return new Response(JSON.stringify(result), {

      headers: {

        "Content-Type": "application/json",

      },

    });

  },

} satisfies ExportedHandler<Env>;


```

## Identify connections from Hyperdrive

To identify active connections to your MySQL database server from Hyperdrive:

* Hyperdrive's connections to your database will show up with `Cloudflare Hyperdrive` in the `PROGRAM_NAME` column in the `performance_schema.threads` table.
* Run `SELECT DISTINCT USER, HOST, PROGRAM_NAME FROM performance_schema.threads WHERE PROGRAM_NAME = 'Cloudflare Hyperdrive'` to show whether Hyperdrive is currently holding a connection (or connections) open to your database.

## Next steps

* Refer to the list of [supported database integrations](https://developers.cloudflare.com/workers/databases/connecting-to-databases/) to understand other ways to connect to existing databases.
* Learn more about how to use the [Socket API](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets) in a Worker.
* Understand the [protocols supported by Workers](https://developers.cloudflare.com/workers/reference/protocols/).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}}]}
```

---

---
title: AWS RDS and Aurora
description: Connect Hyperdrive to an AWS RDS database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# AWS RDS and Aurora

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to an AWS RDS or AWS Aurora MySQL database instance.

This example shows you how to connect Hyperdrive to an Amazon Relational Database Service (Amazon RDS) or Amazon Aurora MySQL database instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access.

Note

To allow Hyperdrive to connect to your database, you must allow Cloudflare IPs to be able to access your database. You can either allow-list all IP address ranges (0.0.0.0 - 255.255.255.255) or restrict your IP access control list to the [IP ranges used by Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

Alternatively, you can connect to your databases over in your private network using [Cloudflare Tunnels](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

### AWS Console

When creating or modifying an instance in the AWS console:

1. Configure a **database cluster** and other settings you wish to customize.
2. Under **Settings** \> **Credential settings**, note down the **Master username** and **Master password** (Aurora only).
3. Under the **Connectivity** header, ensure **Public access** is set to **Yes**.
4. Select an **Existing VPC security group** that allows public Internet access from `0.0.0.0/0` to the port your database instance is configured to listen on (default: `3306` for MySQL instances).
5. Select **Create database**.

Warning

You must ensure that the [VPC security group ↗](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html) associated with your database allows public IPv4 access to your database port.

Refer to AWS' [database server rules ↗](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html#sg-rules-db-server) for details on how to configure rules specific to your RDS database.

### Retrieve the database endpoint (Aurora)

To retrieve the database endpoint (hostname) for Hyperdrive to connect to:

1. Go to **Databases** view under **RDS** in the AWS console.
2. Select the database you want Hyperdrive to connect to.
3. Under the **Endpoints** header, note down the **Endpoint name** with the type `Writer` and the **Port**.

### Retrieve the database endpoint (RDS MySQL)

For regular RDS instances (non-Aurora), you will need to fetch the endpoint and port of the database:

1. Go to **Databases** view under **RDS** in the AWS console.
2. Select the database you want Hyperdrive to connect to.
3. Under the **Connectivity & security** header, note down the **Endpoint** and the **Port**.

The endpoint will resemble `YOUR_DATABASE_NAME.cpuo5rlli58m.AWS_REGION.rds.amazonaws.com`, and the port will default to `3306`.

Support for MySQL-compatible providers

Support for AWS Aurora MySQL databases is coming soon. Join our early preview support by reaching out to us in the [Hyperdrive Discord channel ↗](https://discord.cloudflare.com/).

## 2\. Create your user

Once your database is created, you will need to create a user for Hyperdrive to connect as. Although you can use the **Master username** configured during initial database creation, best practice is to create a less privileged user.

To create a new user, log in to the database and use the `CREATE USER` command:

Terminal window

```

# Log in to the database

mysql -h ENDPOINT_NAME -P PORT -u MASTER_USERNAME -p database_name


```

Run the following SQL statements:

```

-- Create a role for Hyperdrive

CREATE ROLE hyperdrive;


-- Allow Hyperdrive to connect

GRANT USAGE ON mysql_db.* TO hyperdrive;


-- Grant database privileges to the hyperdrive role

GRANT ALL PRIVILEGES ON mysql_db.* to hyperdrive;


-- Create a specific user for Hyperdrive to log in as

CREATE USER 'hyperdrive_user'@'%' IDENTIFIED WITH caching_sha2_password BY 'sufficientlyRandomPassword';


-- Grant this new user the hyperdrive role privileges

GRANT hyperdrive to 'hyperdrive_user'@'%';


```

Refer to AWS' [documentation on user roles in MySQL ↗](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.MySQL.CommonDBATasks.privilege-model.html) for more details.

With a database user, password, database endpoint (hostname and port), and database name, you can now set up Hyperdrive.

## 3\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `mysql`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

mysql://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can copy-and-paste directly into Hyperdrive.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/), open your terminal and run the following command.

* Replace <NAME\_OF\_HYPERDRIVE\_CONFIG> with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or,
* Replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:

Terminal window

```

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

* [  wrangler.jsonc ](#tab-panel-5901)
* [  wrangler.toml ](#tab-panel-5902)

JSONC

```

{

  "$schema": "./node_modules/wrangler/config-schema.json",

  "name": "hyperdrive-example",

  "main": "src/index.ts",

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"

    }

  ]

}


```

TOML

```

"$schema" = "./node_modules/wrangler/config-schema.json"

name = "hyperdrive-example"

main = "src/index.ts"

# Set this to today's date

compatibility_date = "2026-04-30"

compatibility_flags = [ "nodejs_compat" ]


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"


```

## 3\. Use Hyperdrive from your Worker

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5903)
* [  wrangler.toml ](#tab-panel-5904)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/aws-rds-aurora/","name":"AWS RDS and Aurora"}}]}
```

---

---
title: Azure Database
description: Connect Hyperdrive to a Azure Database for MySQL instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Azure Database

**Last reviewed:**  over 1 year ago 

Connect Hyperdrive to an Azure Database for MySQL instance.

This example shows you how to connect Hyperdrive to an Azure Database for MySQL instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid credentials and network access.

Note

To allow Hyperdrive to connect to your database, you must allow Cloudflare IPs to be able to access your database. You can either allow-list all IP address ranges (0.0.0.0 - 255.255.255.255) or restrict your IP access control list to the [IP ranges used by Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

Alternatively, you can connect to your databases over in your private network using [Cloudflare Tunnels](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

### Azure Portal

#### Public access networking

To connect to your Azure Database for MySQL instance using public Internet connectivity:

1. In the [Azure Portal ↗](https://portal.azure.com/), select the instance you want Hyperdrive to connect to.
2. Expand **Settings** \> **Networking** \> ensure **Public access** is enabled > in **Firewall rules** add `0.0.0.0` as **Start IP address** and `255.255.255.255` as **End IP address**.
3. Select **Save** to persist your changes.
4. Select **Overview** from the sidebar and note down the **Server name** of your instance.

With the username, password, server name, and database name (default: `mysql`), you can now create a Hyperdrive database configuration.

#### Private access networking

To connect to a private Azure Database for MySQL instance, refer to [Connect to a private database using Tunnel](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `mysql`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

mysql://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can copy-and-paste directly into Hyperdrive.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/), open your terminal and run the following command.

* Replace <NAME\_OF\_HYPERDRIVE\_CONFIG> with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or,
* Replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:

Terminal window

```

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

* [  wrangler.jsonc ](#tab-panel-5905)
* [  wrangler.toml ](#tab-panel-5906)

JSONC

```

{

  "$schema": "./node_modules/wrangler/config-schema.json",

  "name": "hyperdrive-example",

  "main": "src/index.ts",

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"

    }

  ]

}


```

TOML

```

"$schema" = "./node_modules/wrangler/config-schema.json"

name = "hyperdrive-example"

main = "src/index.ts"

# Set this to today's date

compatibility_date = "2026-04-30"

compatibility_flags = [ "nodejs_compat" ]


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"


```

## 3\. Use Hyperdrive from your Worker

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5907)
* [  wrangler.toml ](#tab-panel-5908)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/azure/","name":"Azure Database"}}]}
```

---

---
title: Google Cloud SQL
description: Connect Hyperdrive to a Google Cloud SQL database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Google Cloud SQL

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a Google Cloud SQL database instance.

This example shows you how to connect Hyperdrive to a Google Cloud SQL MySQL database instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access.

Note

To allow Hyperdrive to connect to your database, you must allow Cloudflare IPs to be able to access your database. You can either allow-list all IP address ranges (0.0.0.0 - 255.255.255.255) or restrict your IP access control list to the [IP ranges used by Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

Alternatively, you can connect to your databases over in your private network using [Cloudflare Tunnels](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

### Cloud Console

When creating the instance or when editing an existing instance in the [Google Cloud Console ↗](https://console.cloud.google.com/sql/instances):

To allow Hyperdrive to reach your instance:

1. In the [Cloud Console ↗](https://console.cloud.google.com/sql/instances), select the instance you want Hyperdrive to connect to.
2. Expand **Connections** \> **Networking** \> ensure **Public IP** is enabled > **Add a Network** and input `0.0.0.0/0`.
3. Select **Done** \> **Save** to persist your changes.
4. Select **Overview** from the sidebar and note down the **Public IP address** of your instance.

To create a user for Hyperdrive to connect as:

1. Select **Users** in the sidebar.
2. Select **Add User Account** \> select **Built-in authentication**.
3. Provide a name (for example, `hyperdrive-user`), then select **Generate** to generate a password.
4. Copy this password to your clipboard before selecting **Add** to create the user.

With the username, password, public IP address and (optional) database name (default: `mysql`), you can now create a Hyperdrive database configuration.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `mysql`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

mysql://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can copy-and-paste directly into Hyperdrive.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/), open your terminal and run the following command.

* Replace <NAME\_OF\_HYPERDRIVE\_CONFIG> with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or,
* Replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:

Terminal window

```

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

* [  wrangler.jsonc ](#tab-panel-5909)
* [  wrangler.toml ](#tab-panel-5910)

JSONC

```

{

  "$schema": "./node_modules/wrangler/config-schema.json",

  "name": "hyperdrive-example",

  "main": "src/index.ts",

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"

    }

  ]

}


```

TOML

```

"$schema" = "./node_modules/wrangler/config-schema.json"

name = "hyperdrive-example"

main = "src/index.ts"

# Set this to today's date

compatibility_date = "2026-04-30"

compatibility_flags = [ "nodejs_compat" ]


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"


```

## 3\. Use Hyperdrive from your Worker

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5911)
* [  wrangler.toml ](#tab-panel-5912)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/google-cloud-sql/","name":"Google Cloud SQL"}}]}
```

---

---
title: PlanetScale
description: Connect Hyperdrive to a PlanetScale MySQL database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# PlanetScale

**Last reviewed:**  about 1 year ago 

Connect Hyperdrive to a PlanetScale MySQL database.

This example shows you how to connect Hyperdrive to a [PlanetScale ↗](https://planetscale.com/) MySQL database.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing PlanetScale MySQL-compatible database by creating a new user and fetching your database connection string.

### PlanetScale Dashboard

1. Go to the [**PlanetScale dashboard** ↗](https://app.planetscale.com/) and select the database you wish to connect to.
2. Click **Connect**. Enter `hyperdrive-user` as the password name (or your preferred name) and configure the permissions as desired. Select **Create password**. Note the username and password as they will not be displayed again.
3. Select **Other** as your language or framework. Note down the database host, database name, database username, and password. You will need these to create a database configuration in Hyperdrive.

With the host, database name, username and password, you can now create a Hyperdrive database configuration.

Note

To reduce latency, use a [Placement Hint](https://developers.cloudflare.com/workers/configuration/placement/#configure-explicit-placement-hints) to run your Worker close to your PlanetScale database. This is especially useful when a single request makes multiple queries.

wrangler.jsonc

```

{

  "placement": {

    // Match to your PlanetScale region, for example "gcp:us-east4" or "aws:us-east-1"

    "region": "gcp:us-east4",

  },

}


```

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `mysql`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

mysql://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can copy-and-paste directly into Hyperdrive.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/), open your terminal and run the following command.

* Replace <NAME\_OF\_HYPERDRIVE\_CONFIG> with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or,
* Replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:

Terminal window

```

npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="mysql://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

* [  wrangler.jsonc ](#tab-panel-5913)
* [  wrangler.toml ](#tab-panel-5914)

JSONC

```

{

  "$schema": "./node_modules/wrangler/config-schema.json",

  "name": "hyperdrive-example",

  "main": "src/index.ts",

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"

    }

  ]

}


```

TOML

```

"$schema" = "./node_modules/wrangler/config-schema.json"

name = "hyperdrive-example"

main = "src/index.ts"

# Set this to today's date

compatibility_date = "2026-04-30"

compatibility_flags = [ "nodejs_compat" ]


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"


```

## 3\. Use Hyperdrive from your Worker

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5915)
* [  wrangler.toml ](#tab-panel-5916)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

Note

When connecting to a PlanetScale database with Hyperdrive, you should use a driver like [node-postgres (pg)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) or [Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/) to connect directly to the underlying database instead of the [PlanetScale serverless driver ↗](https://planetscale.com/docs/tutorials/planetscale-serverless-driver). Hyperdrive is optimized for database access for Workers and will perform global connection pooling and fast query routing by connecting directly to your database.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-database-providers/planetscale/","name":"PlanetScale"}}]}
```

---

---
title: Drizzle ORM
description: Use Drizzle ORM with Hyperdrive to query MySQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Drizzle ORM

**Last reviewed:**  12 months ago 

[Drizzle ORM ↗](https://orm.drizzle.team/) is a lightweight TypeScript ORM with a focus on type safety. This example demonstrates how to use Drizzle ORM with MySQL via Cloudflare Hyperdrive in a Workers application.

## Prerequisites

* A Cloudflare account with Workers access
* A MySQL database
* A [Hyperdrive configuration to your MySQL database](https://developers.cloudflare.com/hyperdrive/get-started/#3-connect-hyperdrive-to-a-database)

## 1\. Install Drizzle

Install the Drizzle ORM and its dependencies such as the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

Terminal window

```

# mysql2 v3.13.0 or later is required

npm i drizzle-orm mysql2 dotenv

npm i -D drizzle-kit tsx @types/node


```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5917)
* [  wrangler.toml ](#tab-panel-5918)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

## 2\. Configure Drizzle

### 2.1\. Define a schema

With Drizzle ORM, we define the schema in TypeScript rather than writing raw SQL.

1. Create a folder `/db/` in `/src/`.
2. Create a `schema.ts` file.
3. In `schema.ts`, define a `users` table as shown below.  
src/db/schema.ts  
```  
// src/schema.ts  
import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";  
export const users = mysqlTable("users", {  
  id: int("id").primaryKey().autoincrement(),  
  name: varchar("name", { length: 255 }).notNull(),  
  email: varchar("email", { length: 255 }).notNull().unique(),  
  createdAt: timestamp("created_at").defaultNow(),  
});  
```

### 2.2\. Connect Drizzle ORM to the database with Hyperdrive

Use your the credentials of your Hyperdrive configuration for your database when using the Drizzle ORM.

Populate your `index.ts` file as shown below.

src/index.ts

```

// src/index.ts


import { drizzle } from "drizzle-orm/mysql2";

import { createConnection } from "mysql2/promise";

import { users } from "./db/schema";


export interface Env {

  HYPERDRIVE: Hyperdrive;

  }


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a connection using the mysql2 driver with the Hyperdrive credentials (only accessible from your Worker).

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    // Create the Drizzle client with the mysql2 driver connection

    const db = drizzle(connection);


    // Sample query to get all users

    const allUsers = await db.select().from(users);


    return Response.json(allUsers);

  },

} satisfies ExportedHandler<Env>;


```

### 2.3\. Configure Drizzle-Kit for migrations (optional)

Note

You need to set up the tables in your database so that Drizzle ORM can make queries that work.

If you have already set it up (for example, if another user has applied the schema to your database), or if you are starting to use Drizzle ORM and the schema matches what already exists in your database, then you do not need to run the migration.

You can generate and run SQL migrations on your database based on your schema using Drizzle Kit CLI. Refer to [Drizzle ORM docs ↗](https://orm.drizzle.team/docs/get-started/mysql-new) for additional guidance.

1. Create a `.env` file in the root folder of your project, and add your database connection string. The Drizzle Kit CLI will use this connection string to create and apply the migrations.  
.env  
```  
# .env  
# Replace with your direct database connection string  
DATABASE_URL='mysql://user:password@db-host.cloud/database-name'  
```
2. Create a `drizzle.config.ts` file in the root folder of your project to configure Drizzle Kit and add the following content:  
drizzle.config.ts  
```  
import 'dotenv/config';  
import { defineConfig } from 'drizzle-kit';  
export default defineConfig({  
out: './drizzle',  
schema: './src/db/schema.ts',  
dialect: 'mysql',  
dbCredentials: {  
url: process.env.DATABASE_URL!,  
  },  
});  
```
3. Generate the migration file for your database according to your schema files and apply the migrations to your database.  
Terminal window  
```  
npx drizzle-kit generate  
```  
```  
No config path provided, using default 'drizzle.config.ts'  
Reading config file 'drizzle.config.ts'  
Reading schema files:  
/src/db/schema.ts  
1 tables  
users 4 columns 0 indexes 0 fks  
[✓] Your SQL migration file ➜ drizzle/0000_daffy_rhodey.sql 🚀  
```  
Terminal window  
```  
npx drizzle-kit migrate  
```  
```  
No config path provided, using default 'drizzle.config.ts'  
Reading config file 'drizzle.config.ts'  
```

## 3\. Deploy your Worker

Deploy your Worker.

Terminal window

```

npx wrangler deploy


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/drizzle-orm/","name":"Drizzle ORM"}}]}
```

---

---
title: mysql
description: Use the mysql driver with Hyperdrive to query MySQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# mysql

**Last reviewed:**  12 months ago 

The [mysql ↗](https://github.com/mysqljs/mysql) package is a MySQL driver for Node.js. This example demonstrates how to use it with Cloudflare Workers and Hyperdrive.

Install the [mysql ↗](https://github.com/mysqljs/mysql) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql
```

```
yarn add mysql
```

```
pnpm add mysql
```

```
bun add mysql
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5919)
* [  wrangler.toml ](#tab-panel-5920)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new connection and pass the Hyperdrive parameters:

TypeScript

```

import { createConnection } from "mysql";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    const result = await new Promise<any>((resolve) => {

      // Create a connection using the mysql driver with the Hyperdrive credentials (only accessible from your Worker).

      const connection = createConnection({

        host: env.HYPERDRIVE.host,

        user: env.HYPERDRIVE.user,

        password: env.HYPERDRIVE.password,

        database: env.HYPERDRIVE.database,

        port: env.HYPERDRIVE.port,

      });


      connection.connect((error: { message: string }) => {

        if (error) {

          throw new Error(error.message);

        }


        // Sample query

        connection.query("SHOW tables;", [], (error, rows, fields) => {

          resolve({ fields, rows });

        });

      });

    });


    // Return result  as JSON

    return new Response(JSON.stringify(result), {

      headers: {

        "Content-Type": "application/json",

      },

    });

  },

} satisfies ExportedHandler<Env>;


```

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/mysql/","name":"mysql"}}]}
```

---

---
title: mysql2
description: Use the mysql2 driver with Hyperdrive to query MySQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# mysql2

**Last reviewed:**  12 months ago 

The [mysql2 ↗](https://github.com/sidorares/node-mysql2) package is a modern MySQL driver for Node.js with better performance and built-in Promise support. This example demonstrates how to use it with Cloudflare Workers and Hyperdrive.

Install the [mysql2 ↗](https://github.com/sidorares/node-mysql2) driver:

 npm  yarn  pnpm  bun 

```
npm i mysql2@>3.13.0
```

```
yarn add mysql2@>3.13.0
```

```
pnpm add mysql2@>3.13.0
```

```
bun add mysql2@>3.13.0
```

Note

`mysql2` v3.13.0 or later is required

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5921)
* [  wrangler.toml ](#tab-panel-5922)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `connection` instance and pass the Hyperdrive parameters:

TypeScript

```

// mysql2 v3.13.0 or later is required

import { createConnection } from "mysql2/promise";


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new connection on each request. Hyperdrive maintains the underlying

    // database connection pool, so creating a new connection is fast.

    const connection = await createConnection({

      host: env.HYPERDRIVE.host,

      user: env.HYPERDRIVE.user,

      password: env.HYPERDRIVE.password,

      database: env.HYPERDRIVE.database,

      port: env.HYPERDRIVE.port,


      // Required to enable mysql2 compatibility for Workers

      disableEval: true,

    });


    try {

      // Sample query

      const [results, fields] = await connection.query("SHOW tables;");


      // Return result rows as JSON

      return Response.json({ results, fields });

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }

  },

} satisfies ExportedHandler<Env>;


```

Note

The minimum version of `mysql2` required for Hyperdrive is `3.13.0`.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/","name":"Connect to MySQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/mysql2/","name":"mysql2"}}]}
```

---

---
title: Connect to PostgreSQL
description: Use Hyperdrive to connect to PostgreSQL and PostgreSQL-compatible databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Connect to PostgreSQL

Hyperdrive supports PostgreSQL and PostgreSQL-compatible databases, [popular drivers](#supported-drivers) and Object Relational Mapper (ORM) libraries that use those drivers.

## Create a Hyperdrive

Note

New to Hyperdrive? Refer to the [Get started guide](https://developers.cloudflare.com/hyperdrive/get-started/) to learn how to set up your first Hyperdrive.

To create a Hyperdrive that connects to an existing PostgreSQL database, use the [wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI or the [Cloudflare dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive).

When using wrangler, replace the placeholder value provided to `--connection-string` with the connection string for your database:

Terminal window

```

# wrangler v3.11 and above required

npx wrangler hyperdrive create my-first-hyperdrive --connection-string="postgres://user:password@database.host.example.com:5432/databasenamehere"


```

The command above will output the ID of your Hyperdrive, which you will need to set in the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/) for your Workers project:

* [  wrangler.jsonc ](#tab-panel-5925)
* [  wrangler.toml ](#tab-panel-5926)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

This will allow Hyperdrive to generate a dynamic connection string within your Worker that you can pass to your existing database driver. Refer to [Driver examples](#driver-examples) to learn how to set up a database driver with Hyperdrive.

Refer to the [Examples documentation](https://developers.cloudflare.com/hyperdrive/examples/) for step-by-step guides on how to set up Hyperdrive with several popular database providers.

## Supported drivers

Hyperdrive uses Workers [TCP socket support](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/#connect) to support TCP connections to databases. The following table lists the supported database drivers and the minimum version that works with Hyperdrive:

| Driver                                                       | Documentation                                                              | Minimum Version Required | Notes                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| node-postgres - pg (recommended)                             | [node-postgres - pg documentation ↗](https://node-postgres.com/)           | pg@8.13.0                | 8.11.4 introduced a bug with URL parsing and will not work. 8.11.5 fixes this. Requires compatibility\_flags = \["nodejs\_compat"\] and compatibility\_date = "2024-09-23" \- refer to [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs). Requires wrangler 3.78.7 or later. |
| Postgres.js                                                  | [Postgres.js documentation ↗](https://github.com/porsager/postgres)        | postgres@3.4.4           | Supported in both Workers & Pages.                                                                                                                                                                                                                                                                                |
| Drizzle                                                      | [Drizzle documentation ↗](https://orm.drizzle.team/)                       | 0.26.2^                  |                                                                                                                                                                                                                                                                                                                   |
| Kysely                                                       | [Kysely documentation ↗](https://kysely.dev/)                              | 0.26.3^                  |                                                                                                                                                                                                                                                                                                                   |
| [rust-postgres ↗](https://github.com/sfackler/rust-postgres) | [rust-postgres documentation ↗](https://docs.rs/postgres/latest/postgres/) | v0.19.8                  | Use the [query\_typed ↗](https://docs.rs/postgres/latest/postgres/struct.Client.html#method.query%5Ftyped) method for best performance.                                                                                                                                                                           |

^ _The marked libraries use `node-postgres` as a dependency._

Other drivers and ORMs not listed may also be supported: this list is not exhaustive.

Recommended driver

[Node-postgres ↗](https://node-postgres.com/) (`pg`) is the recommended driver for connecting to your Postgres database from JavaScript or TypeScript Workers. It has the best compatibility with Hyperdrive's caching and is commonly available with popular ORM libraries. [Postgres.js ↗](https://github.com/porsager/postgres) is also supported.

### Database drivers and Node.js compatibility

[Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) is required for database drivers, including Postgres.js, and needs to be configured for your Workers project.

To enable both built-in runtime APIs and polyfills for your Worker or Pages project, add the [nodejs\_compat](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) [compatibility flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) to your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/), and set your compatibility date to September 23rd, 2024 or later. This will enable [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) for your Workers project.

* [  wrangler.jsonc ](#tab-panel-5923)
* [  wrangler.toml ](#tab-panel-5924)

JSONC

```

{

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30"

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


```

## Driver examples

The following examples show you how to:

1. Create a database client with a database driver.
2. Pass the Hyperdrive connection string and connect to the database.
3. Query your database via Hyperdrive.

### node-postgres / pg

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5927)
* [  wrangler.toml ](#tab-panel-5928)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

### Postgres.js

Install [Postgres.js ↗](https://github.com/porsager/postgres):

 npm  yarn  pnpm  bun 

```
npm i postgres@>3.4.5
```

```
yarn add postgres@>3.4.5
```

```
pnpm add postgres@>3.4.5
```

```
bun add postgres@>3.4.5
```

Note

The minimum version of `postgres-js` required for Hyperdrive is `3.4.5`.

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5929)
* [  wrangler.toml ](#tab-panel-5930)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a Worker that connects to your PostgreSQL database via Hyperdrive:

TypeScript

```

// filepath: src/index.ts

import postgres from "postgres";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a database client that connects to your database via Hyperdrive.

    // Hyperdrive maintains the underlying database connection pool,

    // so creating a new client on each request is fast and recommended.

    const sql = postgres(env.HYPERDRIVE.connectionString, {

      // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections

      max: 5,

      // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)

      fetch_types: false,


      // This is set to true by default, but certain query generators such as Kysely or queries using sql.unsafe() will set this to false. Hyperdrive will not cache prepared statements when this option is set to false and will require additional round-trips.

      prepare: true,

    });


    try {

      // A very simple test query

      const result = await sql`select * from pg_tables`;


      // Return result rows as JSON

      return Response.json({ success: true, result: result });

    } catch (e: any) {

      console.error("Database error:", e.message);


      return Response.error();

    }

  },

} satisfies ExportedHandler<Env>;


```

## Identify connections from Hyperdrive

To identify active connections to your Postgres database server from Hyperdrive:

* Hyperdrive's connections to your database will show up with `Cloudflare Hyperdrive` as the `application_name` in the `pg_stat_activity` table.
* Run `SELECT DISTINCT usename, application_name FROM pg_stat_activity WHERE application_name = 'Cloudflare Hyperdrive'` to show whether Hyperdrive is currently holding a connection (or connections) open to your database.

## Next steps

* Refer to the list of [supported database integrations](https://developers.cloudflare.com/workers/databases/connecting-to-databases/) to understand other ways to connect to existing databases.
* Learn more about how to use the [Socket API](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets) in a Worker.
* Understand the [protocols supported by Workers](https://developers.cloudflare.com/workers/reference/protocols/).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}}]}
```

---

---
title: AWS RDS and Aurora
description: Connect Hyperdrive to an AWS RDS or Aurora Postgres database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# AWS RDS and Aurora

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to an AWS RDS or Aurora Postgres database instance.

This example shows you how to connect Hyperdrive to an Amazon Relational Database Service (Amazon RDS) Postgres or Amazon Aurora database instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access.

Note

To allow Hyperdrive to connect to your database, you must allow Cloudflare IPs to be able to access your database. You can either allow-list all IP address ranges (0.0.0.0 - 255.255.255.255) or restrict your IP access control list to the [IP ranges used by Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

Alternatively, you can connect to your databases over in your private network using [Cloudflare Tunnels](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

### AWS Console

When creating or modifying an instance in the AWS console:

1. Configure a **DB cluster identifier** and other settings you wish to customize.
2. Under **Settings** \> **Credential settings**, note down the **Master username** and **Master password** (Aurora only).
3. Under the **Connectivity** header, ensure **Public access** is set to **Yes**.
4. Select an **Existing VPC security group** that allows public Internet access from `0.0.0.0/0` to the port your database instance is configured to listen on (default: `5432` for PostgreSQL instances).
5. Select **Create database**.

Warning

You must ensure that the [VPC security group ↗](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html) associated with your database allows public IPv4 access to your database port.

Refer to AWS' [database server rules ↗](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html#sg-rules-db-server) for details on how to configure rules specific to your RDS or Aurora database.

### Retrieve the database endpoint (Aurora)

To retrieve the database endpoint (hostname) for Hyperdrive to connect to:

1. Go to **Databases** view under **RDS** in the AWS console.
2. Select the database you want Hyperdrive to connect to.
3. Under the **Endpoints** header, note down the **Endpoint name** with the type `Writer` and the **Port**.

### Retrieve the database endpoint (RDS PostgreSQL)

For regular RDS instances (non-Aurora), you will need to fetch the endpoint and port of the database:

1. Go to **Databases** view under **RDS** in the AWS console.
2. Select the database you want Hyperdrive to connect to.
3. Under the **Connectivity & security** header, note down the **Endpoint** and the **Port**.

The endpoint will resemble `YOUR_DATABASE_NAME.cpuo5rlli58m.AWS_REGION.rds.amazonaws.com` and the port will default to `5432`.

## 2\. Create your user

Once your database is created, you will need to create a user for Hyperdrive to connect as. Although you can use the **Master username** configured during initial database creation, best practice is to create a less privileged user.

To create a new user, log in to the database and use the `CREATE ROLE` command:

Terminal window

```

# Log in to the database

psql postgresql://MASTER_USERNAME:MASTER_PASSWORD@ENDPOINT_NAME:PORT/database_name


```

Run the following SQL statements:

```

-- Create a role for Hyperdrive

CREATE ROLE hyperdrive;


-- Allow Hyperdrive to connect

GRANT CONNECT ON DATABASE postgres TO hyperdrive;


-- Grant database privileges to the hyperdrive role

GRANT ALL PRIVILEGES ON DATABASE postgres to hyperdrive;


-- Create a specific user for Hyperdrive to log in as

CREATE ROLE hyperdrive_user LOGIN PASSWORD 'sufficientlyRandomPassword';


-- Grant this new user the hyperdrive role privileges

GRANT hyperdrive to hyperdrive_user;


```

Refer to AWS' [documentation on user roles in PostgreSQL ↗](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.PostgreSQL.CommonDBATasks.Roles.html) for more details.

With a database user, password, database endpoint (hostname and port) and database name (default: `postgres`), you can now set up Hyperdrive.

## 3\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5933)
* [ Wrangler CLI ](#tab-panel-5934)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5931)  
   * [  wrangler.toml ](#tab-panel-5932)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5935)
* [  wrangler.toml ](#tab-panel-5936)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/aws-rds-aurora/","name":"AWS RDS and Aurora"}}]}
```

---

---
title: Azure Database
description: Connect Hyperdrive to a Azure Database for PostgreSQL instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Azure Database

**Last reviewed:**  over 1 year ago 

Connect Hyperdrive to an Azure Database for PostgreSQL instance.

This example shows you how to connect Hyperdrive to an Azure Database for PostgreSQL instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid credentials and network access.

Note

To allow Hyperdrive to connect to your database, you must allow Cloudflare IPs to be able to access your database. You can either allow-list all IP address ranges (0.0.0.0 - 255.255.255.255) or restrict your IP access control list to the [IP ranges used by Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

Alternatively, you can connect to your databases over in your private network using [Cloudflare Tunnels](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

### Azure Portal

#### Public access networking

To connect to your Azure Database for PostgreSQL instance using public Internet connectivity:

1. In the [Azure Portal ↗](https://portal.azure.com/), select the instance you want Hyperdrive to connect to.
2. Expand **Settings** \> **Networking** \> ensure **Public access** is enabled > in **Firewall rules** add `0.0.0.0` as **Start IP address** and `255.255.255.255` as **End IP address**.
3. Select **Save** to persist your changes.
4. Select **Overview** from the sidebar and note down the **Server name** of your instance.

With the username, password, server name, and database name (default: `postgres`), you can now create a Hyperdrive database configuration.

#### Private access networking

To connect to a private Azure Database for PostgreSQL instance, refer to [Connect to a private database using Tunnel](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5939)
* [ Wrangler CLI ](#tab-panel-5940)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5937)  
   * [  wrangler.toml ](#tab-panel-5938)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5941)
* [  wrangler.toml ](#tab-panel-5942)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/azure/","name":"Azure Database"}}]}
```

---

---
title: CockroachDB
description: Connect Hyperdrive to a CockroachDB database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# CockroachDB

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a CockroachDB database.

This example shows you how to connect Hyperdrive to a [CockroachDB ↗](https://www.cockroachlabs.com/) database cluster. CockroachDB is a PostgreSQL-compatible distributed SQL database with strong consistency guarantees.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access.

### CockroachDB Console

The steps below assume you have an [existing CockroachDB Cloud account ↗](https://www.cockroachlabs.com/docs/cockroachcloud/quickstart) and database cluster created.

To create and/or fetch your database credentials:

1. Go to the [CockroachDB Cloud console ↗](https://cockroachlabs.cloud/clusters) and select the cluster you want Hyperdrive to connect to.
2. Select **SQL Users** from the sidebar on the left, and select **Add User**.
3. Enter a username (for example, \`hyperdrive-user), and select **Generate & Save Password**.
4. Note down the username and copy the password to a temporary location.

To retrieve your database connection details:

1. Go to the [CockroachDB Cloud console ↗](https://cockroachlabs.cloud/clusters) and select the cluster you want Hyperdrive to connect to.
2. Select **Connect** in the top right.
3. Choose the user you created, for example,`hyperdrive-user`.
4. Select the database, for example `defaultdb`.
5. Select **General connection string** as the option.
6. In the text box below, select **Copy** to copy the connection string.

By default, the CockroachDB cloud enables connections from the public Internet (`0.0.0.0/0`). If you have changed these settings on an existing cluster, you will need to allow connections from the public Internet for Hyperdrive to connect.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5945)
* [ Wrangler CLI ](#tab-panel-5946)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5943)  
   * [  wrangler.toml ](#tab-panel-5944)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5947)
* [  wrangler.toml ](#tab-panel-5948)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/cockroachdb/","name":"CockroachDB"}}]}
```

---

---
title: Digital Ocean
description: Connect Hyperdrive to a Digital Ocean Postgres database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Digital Ocean

**Last reviewed:**  about 1 year ago 

Connect Hyperdrive to a Digital Ocean Postgres database instance.

This example shows you how to connect Hyperdrive to a Digital Ocean database instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access.

### DigitalOcean Dashboard

1. Go to the DigitalOcean dashboard and select the database you wish to connect to. 2\. Go to the **Overview** tab. 3\. Under the **Connection Details**panel, select **Public network**. 4\. On the dropdown menu, select **Connection string** \> **show-password**. 5\. Copy the connection string.

With the connection string, you can now create a Hyperdrive database configuration.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5951)
* [ Wrangler CLI ](#tab-panel-5952)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5949)  
   * [  wrangler.toml ](#tab-panel-5950)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5953)
* [  wrangler.toml ](#tab-panel-5954)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

Note

If you see a DNS-related error, it is possible that the DNS for your vendor's database has not yet been propagated. Try waiting 10 minutes before retrying the operation. Refer to [DigitalOcean support page ↗](https://docs.digitalocean.com/support/why-does-my-domain-fail-to-resolve/) for more information.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/digital-ocean/","name":"Digital Ocean"}}]}
```

---

---
title: Fly
description: Connect Hyperdrive to a Fly Postgres database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Fly

**Last reviewed:**  about 1 year ago 

Connect Hyperdrive to a Fly Postgres database instance.

This example shows you how to connect Hyperdrive to a Fly Postgres database instance.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing Fly database by:

1. Allocating a public IP address to your Fly database instance
2. Configuring an external service
3. Deploying the configuration
4. Obtain the connection string, which is used to connect the database to Hyperdrive.
1. Run the following command to [allocate a public IP address ↗](https://fly.io/docs/postgres/connecting/connecting-external/#allocate-an-ip-address).  
```  
fly ips allocate-v6 --app <pg-app-name>  
```  
Note  
Cloudflare recommends using IPv6, but some Internet service providers may not support IPv6\. In this case, [you can allocate an IPv4 address ↗](https://fly.io/docs/postgres/connecting/connecting-with-flyctl/).
2. [Configure an external service ↗](https://fly.io/docs/postgres/connecting/connecting-external/#configure-an-external-service) by modifying the contents of your `fly.toml` file. Run the following command to download the `fly.toml` file.  
```  
fly config save --app <pg-app-name>  
```  
Then, replace the `services` and `services.ports` section of the file with the following `toml` snippet:  
TOML  
```  
[[services]]  
  internal_port = 5432 # Postgres instance  
  protocol = "tcp"  
[[services.ports]]  
  handlers = ["pg_tls"]  
  port = 5432  
```
3. [Deploy the new configuration ↗](https://fly.io/docs/postgres/connecting/connecting-external/#deploy-with-the-new-configuration).
4. [Obtain the connection string ↗](https://fly.io/docs/postgres/connecting/connecting-external/#adapting-the-connection-string), which is in the form of:  
```  
postgres://{username}:{password}@{public-hostname}:{port}/{database}?options  
```

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5957)
* [ Wrangler CLI ](#tab-panel-5958)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5955)  
   * [  wrangler.toml ](#tab-panel-5956)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5959)
* [  wrangler.toml ](#tab-panel-5960)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/fly/","name":"Fly"}}]}
```

---

---
title: Google Cloud SQL
description: Connect Hyperdrive to a Google Cloud SQL for Postgres database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Google Cloud SQL

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a Google Cloud SQL for Postgres database instance.

This example shows you how to connect Hyperdrive to a Google Cloud SQL Postgres database instance.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access.

Note

To allow Hyperdrive to connect to your database, you must allow Cloudflare IPs to be able to access your database. You can either allow-list all IP address ranges (0.0.0.0 - 255.255.255.255) or restrict your IP access control list to the [IP ranges used by Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

Alternatively, you can connect to your databases over in your private network using [Cloudflare Tunnels](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

### Cloud Console

When creating the instance or when editing an existing instance in the [Google Cloud Console ↗](https://console.cloud.google.com/sql/instances):

To allow Hyperdrive to reach your instance:

1. In the [Cloud Console ↗](https://console.cloud.google.com/sql/instances), select the instance you want Hyperdrive to connect to.
2. Expand **Connections** \> **Networking** \> ensure **Public IP** is enabled > **Add a Network** and input `0.0.0.0/0`.
3. Select **Done** \> **Save** to persist your changes.
4. Select **Overview** from the sidebar and note down the **Public IP address** of your instance.

To create a user for Hyperdrive to connect as:

1. Select **Users** in the sidebar.
2. Select **Add User Account** \> select **Built-in authentication**.
3. Provide a name (for example, `hyperdrive-user`) > select **Generate** to generate a password.
4. Copy this password to your clipboard before selecting **Add** to create the user.

With the username, password, public IP address and (optional) database name (default: `postgres`), you can now create a Hyperdrive database configuration.

### gcloud CLI

The [gcloud CLI ↗](https://cloud.google.com/sdk/docs/install) allows you to create a new user and enable Hyperdrive to connect to your database.

Use `gcloud sql` to create a new user (for example, `hyperdrive-user`) with a strong password:

Terminal window

```

gcloud sql users create hyperdrive-user --instance=YOUR_INSTANCE_NAME --password=SUFFICIENTLY_LONG_PASSWORD


```

Run the following command to enable [Internet access ↗](https://cloud.google.com/sql/docs/postgres/configure-ip) to your database instance:

Terminal window

```

# If you have any existing authorized networks, ensure you provide those as a comma separated list.

# The gcloud CLI will replace any existing authorized networks with the list you provide here.

gcloud sql instances patch YOUR_INSTANCE_NAME --authorized-networks="0.0.0.0/0"


```

Refer to [Google Cloud's documentation ↗](https://cloud.google.com/sql/docs/postgres/create-manage-users) for additional configuration options.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5963)
* [ Wrangler CLI ](#tab-panel-5964)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5961)  
   * [  wrangler.toml ](#tab-panel-5962)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5965)
* [  wrangler.toml ](#tab-panel-5966)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/google-cloud-sql/","name":"Google Cloud SQL"}}]}
```

---

---
title: Materialize
description: Connect Hyperdrive to a Materialize streaming database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Materialize

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a Materialize streaming database.

This example shows you how to connect Hyperdrive to a [Materialize ↗](https://materialize.com/) database. Materialize is a Postgres-compatible streaming database that can automatically compute real-time results against your streaming data sources.

## 1\. Allow Hyperdrive access

To allow Hyperdrive to connect to your database, you will need to ensure that Hyperdrive has valid user credentials and network access to your database.

### Materialize Console

Note

Read the Materialize [Quickstart guide ↗](https://materialize.com/docs/get-started/quickstart/) to set up your first database. The steps below assume you have an existing Materialize database ready to go.

You will need to create a new application user and password for Hyperdrive to connect with:

1. Log in to the [Materialize Console ↗](https://console.materialize.com/).
2. Under the **App Passwords** section, select **Manage app passwords**.
3. Select **New app password** and enter a name, for example, `hyperdrive-user`.
4. Select **Create Password**.
5. Copy the provided password: it will only be shown once.

To retrieve the hostname and database name of your Materialize configuration:

1. Select **Connect** in the sidebar of the Materialize Console.
2. Select **External tools**.
3. Copy the **Host**, **Port** and **Database** settings.

With the username, app password, hostname, port and database name, you can now connect Hyperdrive to your Materialize database.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5969)
* [ Wrangler CLI ](#tab-panel-5970)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5967)  
   * [  wrangler.toml ](#tab-panel-5968)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5971)
* [  wrangler.toml ](#tab-panel-5972)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/materialize/","name":"Materialize"}}]}
```

---

---
title: Neon
description: Connect Hyperdrive to a Neon Postgres database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Neon

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a Neon Postgres database.

This example shows you how to connect Hyperdrive to a [Neon ↗](https://neon.tech/) Postgres database.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing Neon database by creating a new user and fetching your database connection string.

### Neon Dashboard

1. Go to the [**Neon dashboard** ↗](https://console.neon.tech/app/projects) and select the project (database) you wish to connect to.
2. Select **Roles** from the sidebar and select **New Role**. Enter `hyperdrive-user` as the name (or your preferred name) and **copy the password**. Note that the password will not be displayed again: you will have to reset it if you do not save it somewhere.
3. Select **Dashboard** from the sidebar > go to the **Connection Details** pane > ensure you have selected the **branch**, **database** and **role** (for example,`hyperdrive-user`) that Hyperdrive will connect through.
4. Select the `psql` and **uncheck the connection pooling** checkbox. Note down the connection string (starting with `postgres://hyperdrive-user@...`) from the text box.

With both the connection string and the password, you can now create a Hyperdrive database configuration.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5975)
* [ Wrangler CLI ](#tab-panel-5976)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5973)  
   * [  wrangler.toml ](#tab-panel-5974)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5977)
* [  wrangler.toml ](#tab-panel-5978)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

Note

When connecting to a Neon database with Hyperdrive, you should use a driver like [node-postgres (pg)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) or [Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/) to connect directly to the underlying database instead of the [Neon serverless driver ↗](https://neon.tech/docs/serverless/serverless-driver). Hyperdrive is optimized for database access for Workers and will perform global connection pooling and fast query routing by connecting directly to your database.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/","name":"Neon"}}]}
```

---

---
title: Nile
description: Connect Hyperdrive to a Nile Postgres database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Nile

**Last reviewed:**  over 1 year ago 

Connect Hyperdrive to a Nile Postgres database instance.

This example shows you how to connect Hyperdrive to a [Nile ↗](https://thenile.dev) PostgreSQL database instance.

Nile is PostgreSQL re-engineered for multi-tenant applications. Nile's virtual tenant databases provide you with isolation, placement, insight, and other features for your tenant's data and embedding. Refer to [Nile documentation ↗](https://www.thenile.dev/docs/getting-started/whatisnile) to learn more.

## 1\. Allow Hyperdrive access

You can connect Cloudflare Hyperdrive to any Nile database in your workspace using its connection string - either with a new set of credentials, or using an existing set.

### Nile console

To get a connection string from Nile console:

1. Log in to [Nile console ↗](https://console.thenile.dev), then select a database.
2. On the left hand menu, click **Settings** (the bottom-most icon) and then select **Connection**.
3. Select the PostgreSQL logo to show the connection string.
4. Select "Generate credentials" to generate new credentials.
5. Copy the connection string (without the "psql" part).

You will have obtained a connection string similar to the following:

```

    postgres://0191c898-...:4d7d8b45-...@eu-central-1.db.thenile.dev:5432/my_database


```

With the connection string, you can now create a Hyperdrive database configuration.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5981)
* [ Wrangler CLI ](#tab-panel-5982)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5979)  
   * [  wrangler.toml ](#tab-panel-5980)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5983)
* [  wrangler.toml ](#tab-panel-5984)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/nile/","name":"Nile"}}]}
```

---

---
title: pgEdge Cloud
description: Connect Hyperdrive to a pgEdge Postgres database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# pgEdge Cloud

**Last reviewed:**  over 1 year ago 

Connect Hyperdrive to a pgEdge Postgres database.

This example shows you how to connect Hyperdrive to a [pgEdge ↗](https://pgedge.com/) Postgres database. pgEdge Cloud provides easy deployment of fully-managed, fully-distributed, and secure Postgres.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing pgEdge database with the default user and password provided by pgEdge.

### pgEdge dashboard

To retrieve your connection string from the pgEdge dashboard:

1. Go to the [**pgEdge dashboard** ↗](https://app.pgedge.com) and select the database you wish to connect to.
2. From the **Connect to your database** section, note down the connection string (starting with `postgres://app@...`) from the **Connection String** text box.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5987)
* [ Wrangler CLI ](#tab-panel-5988)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5985)  
   * [  wrangler.toml ](#tab-panel-5986)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5989)
* [  wrangler.toml ](#tab-panel-5990)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/pgedge/","name":"pgEdge Cloud"}}]}
```

---

---
title: PlanetScale
description: Connect Hyperdrive to a PlanetScale PostgreSQL database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# PlanetScale

**Last reviewed:**  8 months ago 

Connect Hyperdrive to a PlanetScale PostgreSQL database.

This example shows you how to connect Hyperdrive to a [PlanetScale ↗](https://planetscale.com/) PostgreSQL database.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing PlanetScale PostgreSQL database by creating a new role (optional) and retrieving a connection string to your database.

### PlanetScale Dashboard

1. Go to the [**PlanetScale dashboard** ↗](https://app.planetscale.com/) and select the database you wish to connect to.
2. Click **Connect**.
3. Create a new role for your Hyperdrive configuration (recommended):  
   1. Ensure the minimum required permissions for Hyperdrive to read and write data to your tables:  
         * **pg\_read\_all\_data**: Read data from all tables, views, and sequences  
         * **pg\_write\_all\_data**: Write data to all tables, views, and sequences  
   2. Click **Create role**.
4. Note the user, the password, the database host, and the database name (or `postgres` as the default database). You will need these to create a database configuration in Hyperdrive.

With the host, database name, username and password, you can now create a Hyperdrive database configuration.

Note

To reduce latency, use a [Placement Hint](https://developers.cloudflare.com/workers/configuration/placement/#configure-explicit-placement-hints) to run your Worker close to your PlanetScale database. This is especially useful when a single request makes multiple queries.

wrangler.jsonc

```

{

  "placement": {

    // Match to your PlanetScale region, for example "gcp:us-east4" or "aws:us-east-1"

    "region": "gcp:us-east4",

  },

}


```

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-5993)
* [ Wrangler CLI ](#tab-panel-5994)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5991)  
   * [  wrangler.toml ](#tab-panel-5992)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-5995)
* [  wrangler.toml ](#tab-panel-5996)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

Note

When connecting to a PlanetScale PostgreSQL database with Hyperdrive, you should use a driver like [node-postgres (pg)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) or [Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/) to connect directly to the underlying database instead of the [PlanetScale serverless driver ↗](https://planetscale.com/docs/tutorials/planetscale-serverless-driver). Hyperdrive is optimized for database access for Workers and will perform global connection pooling and fast query routing by connecting directly to your database.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/planetscale-postgres/","name":"PlanetScale"}}]}
```

---

---
title: Prisma Postgres
description: Connect Hyperdrive to a Prisma Postgres database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Prisma Postgres

**Last reviewed:**  8 months ago 

Connect Hyperdrive to a Prisma Postgres database.

This example shows you how to connect Hyperdrive to a [Prisma Postgres ↗](https://www.prisma.io/postgres) database.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing Prisma Postgres database by using your existing database connection string.

### Prisma Data Platform

1. Go to the [**Prisma Data Platform Console** ↗](https://console.prisma.io/) and select the project (database) you wish to connect to.
2. Select **Connect to your database** \> **Any client**.
3. Select **Generate database credentials**. Copy the connection string for your Prisma Postgres database.
4. Edit the connection string to make it compatible with Hyperdrive.
* Add the database name after the port. You may remove any query parameters, such as `?sslmode=require`.
* The final string will look like:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Note

An alternative to the Prisma Data Platform is to use the [create-db ↗](https://www.npmjs.com/package/create-db) package. This package will generate a quick temporary Prisma Postgres database for you to use.

Terminal window

```

npx create-db@latest


```

With this connection string, you can now create a Hyperdrive database configuration.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-6001)
* [ Wrangler CLI ](#tab-panel-6002)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-5999)  
   * [  wrangler.toml ](#tab-panel-6000)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6003)
* [  wrangler.toml ](#tab-panel-6004)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## 4\. Configure Hyperdrive maximum connections

Prisma Postgres has limits on the number of direct connections that can be made to the database using Hyperdrive. Refer to [Prisma Postgres limits ↗](https://www.prisma.io/docs/postgres/database/direct-connections?utm%5Fsource=website&utm%5Fmedium=postgres-page#connection-limit).

Note

There are two limits to consider here.

* Origin database's connection limit, set by the origin database provider. This is the maximum number of direct database connections that can be made to the origin database.
* Hyperdrive's origin connection limit, set by Hyperdrive. This is the maximum number of database connections that Hyperdrive can make to your origin database (in this case, Prisma Postgres).

Hyperdrive's origin connection limit should be lower than the Prisma Postgres connection limit, since Hyperdrive's origin connection limit is a soft limit, and Hyperdrive may create more connections if there are network disruptions that prevent existing connections from being used.

* [ Dashboard ](#tab-panel-5997)
* [ Wrangler CLI ](#tab-panel-5998)

1. From the [Cloudflare Hyperdrive dashboard ↗](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive), select your newly created Hyperdrive configuration.
2. Go to **Settings**.
3. In **Origin connection limit**, select **Edit Settings**, and set your maximum connections to a number that is lower than your Prisma connection limit.

1. Edit your existing Hyperdrive configuration with the `--origin-connection-limit` parameter:  
Terminal window  
```  
npx wrangler hyperdrive update <HYPERDRIVE_ID> --origin-connection-limit=10  
```  
Replace `<HYPERDRIVE_ID>` with your Hyperdrive configuration ID and set the connection limit to a number that is less than your Prisma connection limit.
2. Verify the configuration change:  
Terminal window  
```  
npx wrangler hyperdrive get <HYPERDRIVE_ID>  
```

Note

When connecting to a Prisma Postgres database with Hyperdrive, you should use a driver like [node-postgres (pg)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) or [Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/) to connect directly to the underlying PostgreSQL database, instead of the Prisma Accelerate extension. Hyperdrive is optimized for database access for Workers, and connects directly to your database to perform global connection pooling and fast query routing.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/prisma-postgres/","name":"Prisma Postgres"}}]}
```

---

---
title: Supabase
description: Connect Hyperdrive to a Supabase Postgres database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Supabase

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a Supabase Postgres database.

This example shows you how to connect Hyperdrive to a [Supabase ↗](https://supabase.com/) Postgres database.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing Supabase database as the Postgres user which is set up during project creation. Alternatively, to create a new user for Hyperdrive, run these commands in the [SQL Editor ↗](https://supabase.com/dashboard/project/%5F/sql/new).

```

CREATE ROLE hyperdrive_user LOGIN PASSWORD 'sufficientlyRandomPassword';


-- Here, you are granting it the postgres role. In practice, you want to create a role with lesser privileges.

GRANT postgres to hyperdrive_user;


```

The database endpoint can be found in the [database settings page ↗](https://supabase.com/dashboard/project/%5F/settings/database).

With a database user, password, database endpoint (hostname and port) and database name (default: postgres), you can now set up Hyperdrive.

Note

When connecting to Supabase from Hyperdrive, you should use the **Direct connection** connection string rather than the pooled connection strings. Hyperdrive will perform pooling of connections to ensure optimal access from Workers.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-6007)
* [ Wrangler CLI ](#tab-panel-6008)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-6005)  
   * [  wrangler.toml ](#tab-panel-6006)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6009)
* [  wrangler.toml ](#tab-panel-6010)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

Note

When connecting to a Supabase database with Hyperdrive, you should use a driver like [node-postgres (pg)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) or [Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/) to connect directly to the underlying database instead of the [Supabase JavaScript client ↗](https://github.com/supabase/supabase-js). Hyperdrive is optimized for database access for Workers and will perform global connection pooling and fast query routing by connecting directly to your database.

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/","name":"Supabase"}}]}
```

---

---
title: Timescale
description: Connect Hyperdrive to a Timescale time-series database.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Timescale

**Last reviewed:**  over 2 years ago 

Connect Hyperdrive to a Timescale time-series database.

This example shows you how to connect Hyperdrive to a [Timescale ↗](https://www.timescale.com/) time-series database. Timescale is built on PostgreSQL, and includes powerful time-series, event and analytics features.

You can learn more about Timescale by referring to their [Timescale services documentation ↗](https://docs.timescale.com/getting-started/latest/services/).

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing Timescale database by creating a new user and fetching your database connection string.

### Timescale Dashboard

Note

Similar to most services, Timescale requires you to reset the password associated with your database user if you do not have it stored securely. You should ensure that you do not break any existing clients if when you reset the password.

To retrieve your credentials and database endpoint in the [Timescale Console ↗](https://console.cloud.timescale.com/):

1. Select the service (database) you want Hyperdrive to connect to.
2. Expand **Connection info**.
3. Copy the **Service URL**. The Service URL is the connection string that Hyperdrive will use to connect. This string includes the database hostname, port number and database name.

If you do not have your password stored, you will need to select **Forgot your password?** and set a new **SCRAM** password. Save this password, as Timescale will only display it once.

You will end up with a connection string resembling the below:

```

postgres://tsdbadmin:YOUR_PASSWORD_HERE@pn79dztyy0.xzhhbfensb.tsdb.cloud.timescale.com:31358/tsdb


```

With the connection string, you can now create a Hyperdrive database configuration.

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-6013)
* [ Wrangler CLI ](#tab-panel-6014)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-6011)  
   * [  wrangler.toml ](#tab-panel-6012)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6015)
* [  wrangler.toml ](#tab-panel-6016)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/timescale/","name":"Timescale"}}]}
```

---

---
title: Xata
description: Connect Hyperdrive to a Xata database instance.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Xata

**Last reviewed:**  over 1 year ago 

Connect Hyperdrive to a Xata database instance.

This example shows you how to connect Hyperdrive to a Xata PostgreSQL database instance.

## 1\. Allow Hyperdrive access

You can connect Hyperdrive to any existing Xata PostgreSQL database with the connection string provided by Xata.

### Xata dashboard

To retrieve your connection string from the Xata dashboard:

1. Go to the [**Xata dashboard** ↗](https://xata.io/).
2. Select the database you want to connect to.
3. Copy the `PostgreSQL` connection string.

Refer to the full [Xata documentation ↗](https://xata.io/documentation).

## 2\. Create a database configuration

To configure Hyperdrive, you will need:

* The IP address (or hostname) and port of your database.
* The database username (for example, `hyperdrive-demo`) you configured in a previous step.
* The password associated with that username.
* The name of the database you want Hyperdrive to connect to. For example, `postgres`.

Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

```

postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name


```

Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

* [ Dashboard ](#tab-panel-6019)
* [ Wrangler CLI ](#tab-panel-6020)

To create a Hyperdrive configuration with the Cloudflare dashboard:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select **Create Configuration**.
3. Fill out the form, including the connection string.
4. Select **Create**.

To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

1. Open your terminal and run the following command. Replace `<NAME_OF_HYPERDRIVE_CONFIG>` with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:  
Terminal window  
```  
npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"  
```
2. This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):  
   * [  wrangler.jsonc ](#tab-panel-6017)  
   * [  wrangler.toml ](#tab-panel-6018)  
JSONC  
```  
{  
  "$schema": "./node_modules/wrangler/config-schema.json",  
  "name": "hyperdrive-example",  
  "main": "src/index.ts",  
  // Set this to today's date  
  "compatibility_date": "2026-04-30",  
  "compatibility_flags": [  
    "nodejs_compat"  
  ],  
  // Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.  
  "hyperdrive": [  
    {  
      "binding": "HYPERDRIVE",  
      "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
    }  
  ]  
}  
```  
TOML  
```  
"$schema" = "./node_modules/wrangler/config-schema.json"  
name = "hyperdrive-example"  
main = "src/index.ts"  
# Set this to today's date  
compatibility_date = "2026-04-30"  
compatibility_flags = [ "nodejs_compat" ]  
[[hyperdrive]]  
binding = "HYPERDRIVE"  
id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"  
```

Note

Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

## 3\. Use Hyperdrive from your Worker

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6021)
* [  wrangler.toml ](#tab-panel-6022)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/","name":"Database Providers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-database-providers/xata/","name":"Xata"}}]}
```

---

---
title: Drizzle ORM
description: Use Drizzle ORM with Hyperdrive to query PostgreSQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Drizzle ORM

**Last reviewed:**  12 months ago 

[Drizzle ORM ↗](https://orm.drizzle.team/) is a lightweight TypeScript ORM with a focus on type safety. This example demonstrates how to use Drizzle ORM with PostgreSQL via Cloudflare Hyperdrive in a Workers application.

## Prerequisites

* A Cloudflare account with Workers access
* A PostgreSQL database
* A [Hyperdrive configuration to your PostgreSQL database](https://developers.cloudflare.com/hyperdrive/get-started/#3-connect-hyperdrive-to-a-database)

## 1\. Install Drizzle

Install the Drizzle ORM and its dependencies such as the [node-postgres ↗](https://node-postgres.com/) (`pg`) driver:

Terminal window

```

npm i drizzle-orm pg dotenv

npm i -D drizzle-kit tsx @types/pg @types/node


```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6023)
* [  wrangler.toml ](#tab-panel-6024)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

## 2\. Configure Drizzle

### 2.1\. Define a schema

With Drizzle ORM, we define the schema in TypeScript rather than writing raw SQL.

1. Create a folder `/db/` in `/src/`.
2. Create a `schema.ts` file.
3. In `schema.ts`, define a `users` table as shown below.  
src/db/schema.ts  
```  
// src/db/schema.ts  
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";  
export const users = pgTable("users", {  
  id: serial("id").primaryKey(),  
  name: varchar("name", { length: 255 }).notNull(),  
  email: varchar("email", { length: 255 }).notNull().unique(),  
  createdAt: timestamp("created_at").defaultNow(),  
});  
```

### 2.2\. Connect Drizzle ORM to the database with Hyperdrive

Use your Hyperdrive configuration for your database when using the Drizzle ORM.

Populate your `index.ts` file as shown below.

src/index.ts

```

// src/index.ts

import { Client } from "pg";

import { drizzle } from "drizzle-orm/node-postgres";

import { users } from "./db/schema";


export interface Env {

  HYPERDRIVE: Hyperdrive;

}


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create a new client instance for each request.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    // Connect to the database

    await client.connect();


    // Create the Drizzle client with the node-postgres connection

    const db = drizzle(client);


    // Sample query to get all users

    const allUsers = await db.select().from(users);


    return Response.json(allUsers);

  },

} satisfies ExportedHandler<Env>;


```

Note

You may use [node-postgres ↗](https://orm.drizzle.team/docs/get-started-postgresql#node-postgres) or [Postgres.js ↗](https://orm.drizzle.team/docs/get-started-postgresql#postgresjs)when using Drizzle ORM. Both are supported and compatible.

### 2.3\. Configure Drizzle-Kit for migrations (optional)

Note

You need to set up the tables in your database so that Drizzle ORM can make queries that work.

If you have already set it up (for example, if another user has applied the schema to your database), or if you are starting to use Drizzle ORM and the schema matches what already exists in your database, then you do not need to run the migration.

You can generate and run SQL migrations on your database based on your schema using Drizzle Kit CLI. Refer to [Drizzle ORM docs ↗](https://orm.drizzle.team/docs/get-started/postgresql-new) for additional guidance.

1. Create a `.env` file the root folder of your project, and add your database connection string. The Drizzle Kit CLI will use this connection string to create and apply the migrations.  
.env  
```  
# .env  
# Replace with your direct database connection string  
DATABASE_URL='postgres://user:password@db-host.cloud/database-name'  
```
2. Create a `drizzle.config.ts` file in the root folder of your project to configure Drizzle Kit and add the following content:  
drizzle.config.ts  
```  
// drizzle.config.ts  
import "dotenv/config";  
import { defineConfig } from "drizzle-kit";  
export default defineConfig({  
  out: "./drizzle",  
  schema: "./src/db/schema.ts",  
  dialect: "postgresql",  
  dbCredentials: {  
    url: process.env.DATABASE_URL!,  
  },  
});  
```
3. Generate the migration file for your database according to your schema files and apply the migrations to your database.  
Run the following two commands:  
Terminal window  
```  
npx drizzle-kit generate  
```  
```  
No config path provided, using default 'drizzle.config.ts'  
Reading config file 'drizzle.config.ts'  
1 tables  
users 4 columns 0 indexes 0 fks  
[✓] Your SQL migration file ➜ drizzle/0000_mysterious_queen_noir.sql 🚀  
```  
Terminal window  
```  
npx drizzle-kit migrate  
```  
```  
No config path provided, using default 'drizzle.config.ts'  
Reading config file 'drizzle.config.ts'  
Using 'postgres' driver for database querying  
```

## 3\. Deploy your Worker

Deploy your Worker.

Terminal window

```

npx wrangler deploy


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/","name":"Drizzle ORM"}}]}
```

---

---
title: node-postgres (pg)
description: Use node-postgres (pg) with Hyperdrive to query PostgreSQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# node-postgres (pg)

**Last reviewed:**  12 months ago 

[node-postgres ↗](https://node-postgres.com/) (pg) is a widely-used PostgreSQL driver for Node.js applications. This example demonstrates how to use node-postgres with Cloudflare Hyperdrive in a Workers application.

Recommended driver

[Node-postgres ↗](https://node-postgres.com/) (`pg`) is the recommended driver for connecting to your Postgres database from JavaScript or TypeScript Workers. It has the best compatibility with Hyperdrive's caching and is commonly available with popular ORM libraries. [Postgres.js ↗](https://github.com/porsager/postgres) is also supported.

Install the `node-postgres` driver:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.16.3
```

```
yarn add pg@>8.16.3
```

```
pnpm add pg@>8.16.3
```

```
bun add pg@>8.16.3
```

Note

The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6025)
* [  wrangler.toml ](#tab-panel-6026)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a new `Client` instance and pass the Hyperdrive `connectionString`:

TypeScript

```

// filepath: src/index.ts

import { Client } from "pg";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a new client instance for each request. Hyperdrive maintains the

    // underlying database connection pool, so creating a new client is fast.

    const client = new Client({

      connectionString: env.HYPERDRIVE.connectionString,

    });


    try {

      // Connect to the database

      await client.connect();


      // Perform a simple query

      const result = await client.query("SELECT * FROM pg_tables");


      return Response.json({

        success: true,

        result: result.rows,

      });

    } catch (error: any) {

      console.error("Database error:", error.message);


      return new Response("Internal error occurred", { status: 500 });

    }

  },

};


```

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/","name":"node-postgres (pg)"}}]}
```

---

---
title: Postgres.js
description: Use Postgres.js with Hyperdrive to query PostgreSQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Postgres.js

**Last reviewed:**  12 months ago 

[Postgres.js ↗](https://github.com/porsager/postgres) is a modern, fully-featured PostgreSQL driver for Node.js. This example demonstrates how to use Postgres.js with Cloudflare Hyperdrive in a Workers application.

Recommended driver

[Node-postgres ↗](https://node-postgres.com/) (`pg`) is the recommended driver for connecting to your Postgres database from JavaScript or TypeScript Workers. It has the best compatibility with Hyperdrive's caching and is commonly available with popular ORM libraries. [Postgres.js ↗](https://github.com/porsager/postgres) is also supported.

Install [Postgres.js ↗](https://github.com/porsager/postgres):

 npm  yarn  pnpm  bun 

```
npm i postgres@>3.4.5
```

```
yarn add postgres@>3.4.5
```

```
pnpm add postgres@>3.4.5
```

```
bun add postgres@>3.4.5
```

Note

The minimum version of `postgres-js` required for Hyperdrive is `3.4.5`.

Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

* [  wrangler.jsonc ](#tab-panel-6027)
* [  wrangler.toml ](#tab-panel-6028)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

Create a Worker that connects to your PostgreSQL database via Hyperdrive:

TypeScript

```

// filepath: src/index.ts

import postgres from "postgres";


export default {

  async fetch(

    request: Request,

    env: Env,

    ctx: ExecutionContext,

  ): Promise<Response> {

    // Create a database client that connects to your database via Hyperdrive.

    // Hyperdrive maintains the underlying database connection pool,

    // so creating a new client on each request is fast and recommended.

    const sql = postgres(env.HYPERDRIVE.connectionString, {

      // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections

      max: 5,

      // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)

      fetch_types: false,


      // This is set to true by default, but certain query generators such as Kysely or queries using sql.unsafe() will set this to false. Hyperdrive will not cache prepared statements when this option is set to false and will require additional round-trips.

      prepare: true,

    });


    try {

      // A very simple test query

      const result = await sql`select * from pg_tables`;


      // Return result rows as JSON

      return Response.json({ success: true, result: result });

    } catch (e: any) {

      console.error("Database error:", e.message);


      return Response.error();

    }

  },

} satisfies ExportedHandler<Env>;


```

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/","name":"Postgres.js"}}]}
```

---

---
title: Prisma ORM
description: Use Prisma ORM with Hyperdrive to query PostgreSQL databases from Cloudflare Workers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Prisma ORM

**Last reviewed:**  8 months ago 

[Prisma ORM ↗](https://www.prisma.io/docs) is a Node.js and TypeScript ORM with a focus on type safety and developer experience. This example demonstrates how to use Prisma ORM with PostgreSQL via Cloudflare Hyperdrive in a Workers application.

## Prerequisites

* A Cloudflare account with Workers access
* A PostgreSQL database (such as [Prisma Postgres ↗](https://www.prisma.io/postgres))
* A [Hyperdrive configuration to your PostgreSQL database](https://developers.cloudflare.com/hyperdrive/get-started/#3-connect-hyperdrive-to-a-database)
* An existing [Worker project](https://developers.cloudflare.com/workers/get-started/guide/)

## 1\. Install Prisma ORM

Install Prisma CLI as a dev dependency:

 npm  yarn  pnpm  bun 

```
npm i -D prisma
```

```
yarn add -D prisma
```

```
pnpm add -D prisma
```

```
bun add -d prisma
```

Install the `pg` driver and Prisma driver adapter for use with Hyperdrive:

 npm  yarn  pnpm  bun 

```
npm i pg@>8.13.0 @prisma/adapter-pg
```

```
yarn add pg@>8.13.0 @prisma/adapter-pg
```

```
pnpm add pg@>8.13.0 @prisma/adapter-pg
```

```
bun add pg@>8.13.0 @prisma/adapter-pg
```

If using TypeScript, install the types package:

 npm  yarn  pnpm  bun 

```
npm i -D @types/pg
```

```
yarn add -D @types/pg
```

```
pnpm add -D @types/pg
```

```
bun add -d @types/pg
```

Add the required Node.js compatibility flags and Hyperdrive binding to your Wrangler configuration file:

* [  wrangler.jsonc ](#tab-panel-6029)
* [  wrangler.toml ](#tab-panel-6030)

JSONC

```

{

  // required for database drivers to function

  "compatibility_flags": [

    "nodejs_compat"

  ],

  // Set this to today's date

  "compatibility_date": "2026-04-30",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<your-hyperdrive-id-here>"

    }

  ]

}


```

TOML

```

compatibility_flags = [ "nodejs_compat" ]

# Set this to today's date

compatibility_date = "2026-04-30"


[[hyperdrive]]

binding = "HYPERDRIVE"

id = "<your-hyperdrive-id-here>"


```

## 2\. Configure Prisma ORM

### 2.1\. Initialize Prisma

Initialize Prisma in your application:

Terminal window

```

npx prisma init


```

This creates a `prisma` folder with a `schema.prisma` file and an `.env` file.

### 2.2\. Define a schema

Define your database schema in the `prisma/schema.prisma` file:

prisma/schema.prisma

```

generator client {

  provider        = "prisma-client-js"

  previewFeatures = ["driverAdapters"]

}


datasource db {

  provider = "postgresql"

  url      = env("DATABASE_URL")

}


model User {

  id        Int      @id @default(autoincrement())

  name      String

  email     String   @unique

  createdAt DateTime @default(now())

}


```

### 2.3\. Set up environment variables

Add your database connection string to the `.env` file created by Prisma:

.env

```

DATABASE_URL="postgres://user:password@host:port/database"


```

Add helper scripts to your `package.json`:

package.json

```

"scripts": {

  "migrate": "npx prisma migrate dev",

  "generate": "npx prisma generate --no-engine",

  "studio": "npx prisma studio"

}


```

### 2.4\. Generate Prisma Client

Generate the Prisma client with driver adapter support:

Terminal window

```

npm run generate


```

### 2.5\. Run migrations

Generate and apply the database schema:

Terminal window

```

npm run migrate


```

When prompted, provide a name for the migration (for example, `init`).

## 3\. Connect Prisma ORM to Hyperdrive

Use your Hyperdrive configuration when using Prisma ORM. Update your `src/index.ts` file:

src/index.ts

```

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@prisma/client";


export interface Env {

  HYPERDRIVE: Hyperdrive;

}


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Create Prisma client using driver adapter with Hyperdrive connection string

    const adapter = new PrismaPg({ connectionString: env.HYPERDRIVE.connectionString });

    const prisma = new PrismaClient({ adapter });


    // Sample query to create and fetch users

    const user = await prisma.user.create({

      data: {

        name: "John Doe",

        email: `john.doe.${Date.now()}@example.com`,

      },

    });


    const allUsers = await prisma.user.findMany();


    return Response.json({

      newUser: user,

      allUsers: allUsers,

    });

  },

} satisfies ExportedHandler<Env>;


```

Note

When using Prisma ORM with Hyperdrive, you must use driver adapters to properly utilize the Hyperdrive connection string. The `@prisma/adapter-pg` driver adapter allows Prisma ORM to work with the `pg` driver and Hyperdrive's connection pooling. This approach provides connection pooling at the network level through Hyperdrive, so you don't need Prisma-specific connection pooling extensions like Prisma Accelerate.

## 4\. Deploy your Worker

Deploy your Worker:

Terminal window

```

npx wrangler deploy


```

## Next steps

* Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).
* Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
* Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/examples/","name":"Examples"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/","name":"Connect to PostgreSQL"}},{"@type":"ListItem","position":5,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/","name":"Libraries and Drivers"}},{"@type":"ListItem","position":6,"item":{"@id":"/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/prisma-orm/","name":"Prisma ORM"}}]}
```

---

---
title: Metrics and analytics
description: Inspect query volume, latency, and cache hit ratios for your Hyperdrive configurations.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Metrics and analytics

Hyperdrive exposes analytics that allow you to inspect query volume, query latency, and cache hit ratios for each Hyperdrive configuration in your account.

## Metrics

Hyperdrive currently exports the below metrics as part of the `hyperdriveQueriesAdaptiveGroups` GraphQL dataset:

| Metric             | GraphQL Field Name | Description                                                                                                                                                                                 |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Queries            | count              | The number of queries issued against your Hyperdrive in the given time period.                                                                                                              |
| Cache Status       | cacheStatus        | Whether the query was cached or not. Can be one of disabled, hit, miss, uncacheable, multiplestatements, notaquery, oversizedquery, oversizedresult, parseerror, transaction, and volatile. |
| Query Bytes        | queryBytes         | The size of your queries, in bytes.                                                                                                                                                         |
| Result Bytes       | resultBytes        | The size of your query _results_, in bytes.                                                                                                                                                 |
| Connection Latency | connectionLatency  | The time (in milliseconds) required to establish new connections from Hyperdrive to your database, as measured from your Hyperdrive connection pool(s).                                     |
| Query Latency      | queryLatency       | The time (in milliseconds) required to query (and receive results) from your database, as measured from your Hyperdrive connection pool(s).                                                 |
| Event Status       | eventStatus        | Whether a query responded successfully (complete) or failed (error).                                                                                                                        |

The `volatile` cache status indicates the query contains a PostgreSQL function categorized as `STABLE` or `VOLATILE` (for example, `NOW()`, `RANDOM()`). Refer to [Query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/) for details on which functions affect cacheability.

Metrics can be queried (and are retained) for the past 31 days.

## View metrics in the dashboard

Per-database analytics for Hyperdrive are available in the Cloudflare dashboard. To view current and historical metrics for a Hyperdrive configuration:

1. In the Cloudflare dashboard, go to the **Hyperdrive** page.  
[ Go to **Hyperdrive** ](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select an existing Hyperdrive configuration.
3. Select the **Metrics** tab.

You can optionally select a time window to query. This defaults to the last 24 hours.

## Query via the GraphQL API

You can programmatically query analytics for your Hyperdrive configurations via the [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/). This API queries the same datasets as the Cloudflare dashboard, and supports GraphQL [introspection](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/introspection/).

Hyperdrive's GraphQL datasets require an `accountTag` filter with your Cloudflare account ID. Hyperdrive exposes the `hyperdriveQueriesAdaptiveGroups` dataset.

## Write GraphQL queries

Examples of how to explore your Hyperdrive metrics.

### Get the number of queries handled via your Hyperdrive config by cache status

```

query HyperdriveQueries(

  $accountTag: string!

  $configId: string!

  $datetimeStart: Time!

  $datetimeEnd: Time!

) {

  viewer {

    accounts(filter: { accountTag: $accountTag }) {

      hyperdriveQueriesAdaptiveGroups(

        limit: 10000

        filter: {

          configId: $configId

          datetime_geq: $datetimeStart

          datetime_leq: $datetimeEnd

        }

      ) {

        count

        dimensions {

          cacheStatus

        }

      }

    }

  }

}


```

[Run in GraphQL API Explorer](https://graphql.cloudflare.com/explorer?query=I4VwpgTgngBAElADpAJhAlgNzARXBsAZwAoAoGGAEgEMBjWgexADsAXAFWoHMAuGQ1hmZcAhOSqNmAM3RcAkij4Cho8ZRTVWYVugC2YAMqtqEVn3Z6wYius3bLAUWaKYF-WICUMAN7jM6MAB3SB9xCjpGFlYSGQAbLQg+bxgIpjZOXipUqIyYAF8vXwpimAALJFQMbDxIAMIAQQ1EHWwAcQgmRBIwkphYvXQzGABGAAZx0Z6SuISkqd7JGXkXSkXZBXmSjS0dfQB9LjBgPlsdyyMTVk3i7ft92KOT292wJxRrvPnC68i2a5RLMxCOgGEDQr0FnRSoZjKwQIQPvNPiVkflSHkgA&variables=N4IghgxhD2CuB2AXAKmA5iAXCAggYTwHkBVAOWQH0BJAERABoQZ4AzASzSoBMsQAlAKIAFADL4BFAOpVkACWp1GXMIgCmiNgFtVAZURgATol4AmAAwmAbAFozAFmsBmM8gCMAdkwmArJjuWALQYQZTUNbQF4HmxzK1sHZ2QTRy9ffyCAXyA)

### Get the average query and connection latency for queries handled via your Hyperdrive config within a range of time, excluding queries that failed due to an error

```

query AverageHyperdriveLatencies(

  $accountTag: string!

  $configId: string!

  $datetimeStart: Time!

  $datetimeEnd: Time!

) {

  viewer {

    accounts(filter: { accountTag: $accountTag }) {

      hyperdriveQueriesAdaptiveGroups(

        limit: 10000

        filter: {

          configId: $configId

          eventStatus: "complete"

          datetime_geq: $datetimeStart

          datetime_leq: $datetimeEnd

        }

      ) {

        avg {

          connectionLatency

          queryLatency

        }

      }

    }

  }

}


```

[Run in GraphQL API Explorer](https://graphql.cloudflare.com/explorer?query=I4VwpgTgngBAggN0gQwOZgBJQA6QCYQCWSAMsgC5gB2AxoWAM4AUAUDDACTI00D2IVcgBU0ALhgNyRKqgCEbTnyoAzQqgCSecZOlyFHPBTDlCAWzABlcsgjlxQs2HnsDRk+YCiVLTAfn5AJQwAN4KCPQA7pAhCuzcfALkzKoANpQQ4sEw8fyCIqjiXDy5wmgwAL5Boew1MAAWOPhESACK4ESMcIbYJkgA4hD82MyxtTApZoR2MACMAAwLc6O1qemZy2NKqho+HFtqmhu1YEiCVhQgDOIARHym2CnGYNdHNYaU7mAA+ujAhe-GRznWyvdgAz5fR5-TjgxxePCvcobKqvZAIVAxMabXhUKhgGgmHFkSi0KCgmCgSBQYnUGhkrHsJFYpk1FlI8pAA&variables=N4IghgxhD2CuB2AXAKmA5iAXCAggYTwHkBVAOWQH0BJAERABoQZ4AzASzSoBMsQAlAKIAFADL4BFAOpVkACWp1GXMIgCmiNgFtVAZURgATol4AmAAwmAbAFozAFmsBmM8gCMAdkwmArJjuWALQYQZTUNbQF4HmxzK1sHZ2QTRy9ffyCAXyA)

### Get the total amount of query and result bytes flowing through your Hyperdrive config

```

query HyperdriveQueryAndResultBytesForSuccessfulQueries(

  $accountTag: string!

  $configId: string!

  $datetimeStart: Date!

  $datetimeEnd: Date!

) {

  viewer {

    accounts(filter: { accountTag: $accountTag }) {

      hyperdriveQueriesAdaptiveGroups(

        limit: 10000

        filter: {

          configId: $configId

          datetime_geq: $datetimeStart

          datetime_leq: $datetimeEnd

        }

      ) {

        sum {

          queryBytes

          resultBytes

        }

      }

    }

  }

}


```

[Run in GraphQL API Explorer](https://graphql.cloudflare.com/explorer?query=I4VwpgTgngBAElADpAJhAlgNzARXNAQQDsUAlMAZxABsAXAISlsoDEB7CAZRAGMfKKAMxp5I6SgAoAUDBgASAIZ82IIrQAqCgOYAuGBVoYiWgIQz5PNkUHotASRR6DR0+bkoFzWugC2YTrQKELR6ACKeYGay7hHefgCiJGERZgCUMADe5pjiAO6QmeaySpaqtBQSNnSQehkwJSpqmrryDWXNMAC+6VmyfTAAFkioGNiiGJQEHoje2ADiECqIFUX9MNS+6CEwAIwADAd7q-1VzBC1x2uW1rYOenLXNvYol-0eXr5gAPpaYMD37zAcX8gWCrz6gOBX2ofwBsU+iReaz6nUuPXBVB8hWR-VAkCgjGYFHBsgglBoDCYlHBqORtJR5lRnSAA&variables=N4IghgxhD2CuB2AXAKmA5iAXCAggYTwHkBVAOWQH0BJAERABoQZ4AzASzSoBMsQAlAKIAFADL4BFAOpVkACWp1GXMIgCmiNgFtVAZURgATol4AmAAwmAbAFozAFmsmAnAxDK1G7QPg9s5q7YOAMxmIAC+QA)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/observability/","name":"Observability"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/observability/metrics/","name":"Metrics and analytics"}}]}
```

---

---
title: Troubleshoot and debug
description: Resolve common Hyperdrive connection errors and database connectivity issues.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Troubleshoot and debug

Troubleshoot and debug errors commonly associated with connecting to a database with Hyperdrive.

## Configuration errors

When creating a new Hyperdrive configuration, or updating the connection parameters associated with an existing configuration, Hyperdrive performs a test connection to your database in the background before creating or updating the configuration.

Hyperdrive will also issue an empty test query, a `;` in PostgreSQL, to validate that it can pass queries to your database.

| Error Code | Details                                                                                          | Recommended fixes                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2008       | Bad hostname.                                                                                    | Hyperdrive could not resolve the database hostname. Confirm it exists in public DNS.                                                                           |
| 2009       | The hostname does not resolve to a public IP address, or the IP address is not a public address. | Hyperdrive can only connect to public IP addresses. Private IP addresses, like 10.1.5.0 or 192.168.2.1, are not currently supported.                           |
| 2010       | Cannot connect to the host:port.                                                                 | Hyperdrive could not route to the hostname: ensure it has a public DNS record that resolves to a public IP address. Check that the hostname is not misspelled. |
| 2011       | Connection refused.                                                                              | A network firewall or access control list (ACL) is likely rejecting requests from Hyperdrive. Ensure you have allowed connections from the public Internet.    |
| 2012       | TLS (SSL) not supported by the database.                                                         | Hyperdrive requires TLS (SSL) to connect. Configure TLS on your database.                                                                                      |
| 2013       | Invalid database credentials.                                                                    | Ensure your username is correct (and exists), and the password is correct (case-sensitive).                                                                    |
| 2014       | The specified database name does not exist.                                                      | Check that the database (not table) name you provided exists on the database you are asking Hyperdrive to connect to.                                          |
| 2015       | Generic error.                                                                                   | Hyperdrive failed to connect and could not determine a reason. Open a support ticket so Cloudflare can investigate.                                            |
| 2016       | Test query failed.                                                                               | Confirm that the user Hyperdrive is connecting as has permissions to issue read and write queries to the given database.                                       |

### Failure to connect

Hyperdrive may also emit `Failed to connect to the provided database` when it fails to connect to the database when attempting to create a Hyperdrive configuration. This is possible when the TLS (SSL) certificates are misconfigured. Here is a non-exhaustive table of potential failure to connect errors:

| Error message                                 | Details                                                                                                                                                                                               | Recommended fixes                                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server return error and closed connection.    | This message occurs when you attempt to connect to a database that has client certificate verification enabled.                                                                                       | Ensure you are configuring your Hyperdrive with [client certificates](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/) if your database requires them. |
| TLS handshake failed: cert validation failed. | This message occurs when Hyperdrive has been configured with server CA certificates and is indicating that the certificate provided by the server has not been signed by the expected CA certificate. | Ensure you are using the expected the correct CA certificate for Hyperdrive, or ensure you are connecting to the right database.                                                                       |

## Connection errors

Hyperdrive may also return errors at runtime. This can happen during initial connection setup, or in response to a query or other wire-protocol command sent by your driver.

These errors are returned as `ErrorResponse` wire protocol messages, which are handled by most drivers by throwing from the responsible query or by triggering an error event. Hyperdrive errors that do not map 1:1 with an error message code [documented by PostgreSQL ↗](https://www.postgresql.org/docs/current/errcodes-appendix.html) use the `58000` error code.

Hyperdrive may also encounter `ErrorResponse` wire protocol messages sent by your database. Hyperdrive will pass these errors through unchanged when possible.

### Hyperdrive specific errors

| Error Message                                                           | Details                                                                                         | Recommended fixes                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internal error.                                                         | Something is broken on our side.                                                                | Check for an ongoing incident affecting Hyperdrive, and [contact Cloudflare Support](https://developers.cloudflare.com/support/contacting-cloudflare-support/). Retrying the query is appropriate, if it makes sense for your usage pattern.                                                   |
| Failed to acquire a connection from the pool.                           | Hyperdrive timed out while waiting for a connection to your database, or cannot connect at all. | If you are seeing this error intermittently, your Hyperdrive pool is being exhausted because too many connections are being held open for too long by your worker. This can be caused by a myriad of different issues, but long-running queries/transactions are a common offender.            |
| Server connection attempt failed: connection\_refused                   | Hyperdrive is unable to create new connections to your origin database.                         | A network firewall or access control list (ACL) is likely rejecting requests from Hyperdrive. Ensure you have allowed connections from the public Internet. Sometimes, this can be caused by your database host provider refusing incoming connections when you go over your connection limit. |
| Hyperdrive does not currently support MySQL COM\_STMT\_PREPARE messages | Hyperdrive does not support prepared statements for MySQL databases.                            | Remove prepared statements from your MySQL queries.                                                                                                                                                                                                                                            |

### Node errors

| Error Message                                  | Details                                                                                                               | Recommended fixes                                                                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uncaught Error: No such module "node:<module>" | Your Cloudflare Workers project or a library that it imports is trying to access a Node module that is not available. | Enable [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) for your Cloudflare Workers project to maximize compatibility. |

### Uncached queries

If your queries are not being cached despite Hyperdrive having caching enabled, check the following:

* **Stable or volatile PostgreSQL functions in your query**: Queries that contain PostgreSQL functions categorized as `STABLE` or `VOLATILE` are not cacheable. Common examples include `NOW()`, `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `RANDOM()`, and `LASTVAL()`. To resolve this, move the function call to your application code and pass the result as a query parameter. For example, instead of `WHERE created_at > NOW()`, compute the timestamp in your Worker and pass it as a parameter: `WHERE created_at > $1`. Refer to [Query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/) for a full list of uncacheable functions.

**Function names in SQL comments**: Hyperdrive uses text-based pattern matching to detect uncacheable functions. References to function names like `NOW()` in SQL comments cause the query to be treated as uncacheable, even if the function is not actually called. Remove any references to uncacheable function names from your query text, including comments.

* **Driver configuration**: Your driver may be configured such that your queries are not cacheable by Hyperdrive. This may happen if you are using the [Postgres.js ↗](https://github.com/porsager/postgres) driver with [prepare: false ↗](https://github.com/porsager/postgres?tab=readme-ov-file#prepared-statements). To resolve this, enable prepared statements with `prepare: true`.

### Driver errors

| Error Message                                            | Details                                                                                                                                          | Recommended fixes                                                                                                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code generation from strings disallowed for this context | The database driver you are using is attempting to use the eval() command, which is unsupported on Cloudflare Workers (common in mysql2 driver). | Configure the database driver to not use eval(). See how to [configure mysql2 to disable the usage of eval()](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/mysql2/). |

### Stale connection and I/O context errors

These errors occur when a database client or connection is created in the global scope (outside of a request handler) or is reused across requests. Workers do not allow [I/O across requests](https://developers.cloudflare.com/workers/runtime-apis/bindings/#making-changes-to-bindings), and database connections from a previous request context become unusable. Always [create database clients inside your handlers](https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/#cleaning-up-client-connections).

#### Workers runtime errors

| Error Message                                                                                                                                                                                                                | Details                                                                                                                     | Recommended fixes                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.                                           | Your Worker is attempting to open a database connection or perform I/O during script startup, outside of a request handler. | Move the database client creation into your fetch, queue, or other handler function.                                                                                          |
| Cannot perform I/O on behalf of a different request. I/O objects (such as streams, request/response bodies, and others) created in the context of one request handler cannot be accessed from a different request's handler. | A database connection or client created during one request is being reused in a subsequent request.                         | Create a new database client on every request instead of caching it in a global variable. Hyperdrive's connection pooling already eliminates the connection startup overhead. |

#### node-postgres (`pg`) errors

| Error Message                                                  | Details                                                                                                                                       | Recommended fixes                                                                                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Connection terminated                                          | The client's .end() method was called, or the connection was cleaned up at the end of a previous request.                                     | Create a new Client inside your handler instead of reusing one from a prior request.                                                  |
| Connection terminated unexpectedly                             | The underlying connection was dropped without an explicit .end() call — for example, when a previous request's context was garbage collected. | Create a new Client inside your handler for every request.                                                                            |
| Client has encountered a connection error and is not queryable | A socket-level error occurred on the connection (common when reusing a client across requests).                                               | Create a new Client inside your handler. Do not store clients in global variables.                                                    |
| Client was closed and is not queryable                         | A query was attempted on a client whose .end() method was already called.                                                                     | Create a new Client inside your handler instead of reusing one.                                                                       |
| Cannot use a pool after calling end on the pool                | pool.connect() was called on a Pool instance that has already been ended.                                                                     | Do not use new Pool() in the global scope. Create a new Client() inside your handler — Hyperdrive handles connection pooling for you. |
| Client has already been connected. You cannot reuse a client.  | client.connect() was called on a client that was already connected in a previous invocation.                                                  | Create a new Client per request. node-postgres clients cannot be reconnected once connected.                                          |

#### Postgres.js (`postgres`) errors

Postgres.js error messages include the error code and the target host. The `code` property on the error object contains the error code.

| Error Message                             | Details                                                                                                                                                                              | Recommended fixes                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| write CONNECTION\_ENDED <host>:<port>     | A query was attempted after sql.end() was called, or the connection was cleaned up from a prior request. Error code: CONNECTION\_ENDED.                                              | Create a new postgres() instance inside your handler.                                                                                     |
| write CONNECTION\_DESTROYED <host>:<port> | The connection was forcefully terminated — for example, during sql.end({ timeout }) expiration, or because the connection was already terminated. Error code: CONNECTION\_DESTROYED. | Create a new postgres() instance inside your handler for every request.                                                                   |
| write CONNECTION\_CLOSED <host>:<port>    | The underlying socket was closed unexpectedly while queries were still pending. Error code: CONNECTION\_CLOSED.                                                                      | Create a new postgres() instance inside your handler. If this occurs within a single request, check for network issues or query timeouts. |

#### mysql2 errors

| Error Message                                            | Details                                                                                                                           | Recommended fixes                                                                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Can't add new command when connection is in closed state | A query was attempted on a connection that has already been closed or encountered a fatal error.                                  | Create a new connection inside your handler instead of reusing one from global scope.                                                  |
| Connection lost: The server closed the connection.       | The underlying socket was closed by the server or was garbage collected between requests. Error code: PROTOCOL\_CONNECTION\_LOST. | Create a new connection inside your handler for every request.                                                                         |
| Pool is closed.                                          | pool.getConnection() was called on a pool that has already been closed.                                                           | Do not use createPool() in the global scope. Create a new createConnection() inside your handler — Hyperdrive handles pooling for you. |

#### mysql errors

| Error Message                                                 | Details                                                                                                                                  | Recommended fixes                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Cannot enqueue Query after fatal error.                       | A query was attempted on a connection that previously encountered a fatal error. Error code: PROTOCOL\_ENQUEUE\_AFTER\_FATAL\_ERROR.     | Create a new connection inside your handler instead of reusing one from global scope.        |
| Cannot enqueue Query after invoking quit.                     | A query was attempted on a connection after .end() was called. Error code: PROTOCOL\_ENQUEUE\_AFTER\_QUIT.                               | Create a new connection inside your handler for every request.                               |
| Cannot enqueue Handshake after already enqueuing a Handshake. | .connect() was called on a connection that was already connected in a previous request. Error code: PROTOCOL\_ENQUEUE\_HANDSHAKE\_TWICE. | Create a new connection per request. mysql connections cannot be reconnected once connected. |

### Improve performance

Having query traffic written as transactions can limit performance. This is because in the case of a transaction, the connection must be held for the duration of the transaction, which limits connection multiplexing. If there are multiple queries per transaction, this can be particularly impactful on connection multiplexing. Where possible, we recommend not wrapping queries in transactions to allow the connections to be shared more aggressively.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/observability/","name":"Observability"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/observability/troubleshooting/","name":"Troubleshoot and debug"}}]}
```

---

---
title: Limits
description: Configuration, connection, and query limits that apply to Hyperdrive.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Limits

The following limits apply to Hyperdrive configurations, connections, and queries made to your configured origin databases.

## Configuration limits

These limits apply when creating or updating Hyperdrive configurations.

| Limit                                                | Free                  | Paid                  |
| ---------------------------------------------------- | --------------------- | --------------------- |
| Maximum configured databases                         | 10 per account        | 25 per account        |
| Maximum username length [1](#user-content-fn-1)      | 63 characters (bytes) | 63 characters (bytes) |
| Maximum database name length [1](#user-content-fn-1) | 63 characters (bytes) | 63 characters (bytes) |

## Connection limits

These limits apply to connections between Hyperdrive and your origin database.

| Limit                                                                           | Free             | Paid              |
| ------------------------------------------------------------------------------- | ---------------- | ----------------- |
| Initial connection timeout                                                      | 15 seconds       | 15 seconds        |
| Idle connection timeout                                                         | 10 minutes       | 10 minutes        |
| Maximum origin database connections (per configuration) [2](#user-content-fn-2) | \~20 connections | \~100 connections |

Hyperdrive does not limit the number of concurrent client connections from your Workers. However, Hyperdrive limits connections to your origin database because most hosted databases have connection limits.

### Connection errors

When Hyperdrive cannot acquire a connection to your origin database, you may see one of the following errors:

| Error message                                         | Cause                                                                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failed to acquire a connection from the pool.         | The connection pool is exhausted because connections are held open too long. Long-running queries or transactions are a common cause.                           |
| Server connection attempt failed: connection\_refused | Your origin database is rejecting connections. This can occur when a firewall blocks Hyperdrive, or when your database provider's connection limit is exceeded. |

For a complete list of error codes, refer to [Troubleshoot and debug](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/).

## Query limits

These limits apply to queries sent through Hyperdrive.

| Limit                              | Free       | Paid       |
| ---------------------------------- | ---------- | ---------- |
| Maximum query (statement) duration | 60 seconds | 60 seconds |
| Maximum cached query response size | 50 MB      | 50 MB      |

Queries exceeding the maximum duration are terminated. Query responses larger than 50 MB are not cached but are still returned to your Worker.

## Request a limit increase

You can request adjustments to limits that conflict with your project goals by contacting Cloudflare. Not all limits can be increased.

To request an increase, submit a [Limit Increase Request form ↗](https://forms.gle/ukpeZVLWLnKeixDu7). You can also ask questions in the Hyperdrive channel on [Cloudflare's Discord community ↗](https://discord.cloudflare.com/).

## Footnotes

1. This is a limit enforced by PostgreSQL. Some database providers may enforce smaller limits. [↩](#user-content-fnref-1) [↩2](#user-content-fnref-1-2)
2. Hyperdrive is a distributed system, so a client may be unable to reach an existing pool. In this scenario, a new pool is established with its own connection allocation. This prioritizes availability over strict limit enforcement, which means connection counts may occasionally exceed the listed limits. [↩](#user-content-fnref-2)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/platform/","name":"Platform"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/platform/limits/","name":"Limits"}}]}
```

---

---
title: Pricing
description: Hyperdrive pricing details for Free and Workers Paid plans.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Pricing

Hyperdrive is included in both the Free and Paid [Workers plans](https://developers.cloudflare.com/workers/platform/pricing/).

| Free plan[1](#user-content-fn-1)        | Paid plan     |           |
| --------------------------------------- | ------------- | --------- |
| Database queries[2](#user-content-fn-2) | 100,000 / day | Unlimited |

Footnotes

1: The Workers Free plan includes limited Hyperdrive usage. All limits reset daily at 00:00 UTC. If you exceed any one of these limits, further operations of that type will fail with an error.

2: Database queries refers to any database statement made via Hyperdrive, whether a query (`SELECT`), a modification (`INSERT`,`UPDATE`, or `DELETE`) or a schema change (`CREATE`, `ALTER`, `DROP`).

## Footnotes

1. The Workers Free plan includes limited Hyperdrive usage. All limits reset daily at 00:00 UTC. If you exceed any one of these limits, further operations of that type will fail with an error. [↩](#user-content-fnref-1)
2. Database queries refers to any database statement made via Hyperdrive, whether a query (`SELECT`), a modification (`INSERT`,`UPDATE`, or `DELETE`) or a schema change (`CREATE`, `ALTER`, `DROP`). [↩](#user-content-fnref-2)

Hyperdrive limits are automatically adjusted when subscribed to a Workers Paid plan. Hyperdrive's [connection pooling and query caching](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/) are included in Workers Paid plan, so do not incur any additional charges.

## Pricing FAQ

### Does connection pooling or query caching incur additional charges?

No. Hyperdrive's built-in cache and connection pooling are included within the stated plans above. There are no hidden limits other than those [published](https://developers.cloudflare.com/hyperdrive/platform/limits/).

### Are cached queries counted the same as uncached queries?

Yes, any query made through Hyperdrive, whether cached or uncached, whether query or mutation, is counted according to the limits above.

### Does Hyperdrive charge for data transfer / egress?

No.

Note

For questions about pricing, refer to the [pricing FAQs](https://developers.cloudflare.com/hyperdrive/reference/faq/#pricing).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/platform/","name":"Platform"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/platform/pricing/","name":"Pricing"}}]}
```

---

---
title: Release notes
description: Recent changes and updates to Hyperdrive.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Release notes

[ Subscribe to RSS ](https://developers.cloudflare.com/hyperdrive/platform/release-notes/index.xml)

## 2025-12-04

**Connect to remote databases during local development with wrangler dev**

The `localConnectionString` configuration field and `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING_NAME>` environment variable now support connecting to remote databases over TLS during local development with `wrangler dev`. 

When using a remote database connection string, your Worker code runs locally on your machine while connecting directly to the remote database. Hyperdrive caching does not take effect. 

Refer to [Local development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/) for instructions on how to configure remote database connections for local development.

## 2025-07-03

**Hyperdrive now supports configurable connection counts**

Hyperdrive configurations can now be set to use a specific number of connections to your origin database. There is a minimum of 5 connections for all configurations and a maximum according to your [Workers plan](https://developers.cloudflare.com/hyperdrive/platform/limits/).

This limit is a soft maximum. Hyperdrive may make more than this amount of connections in the event of unexpected networking issues in order to ensure high availability and resiliency.

## 2025-05-05

**Hyperdrive improves regional caching for prepared statements for faster cache hits**

Hyperdrive now better caches prepared statements closer to your Workers. This results in up to 5x faster cache hits by reducing the roundtrips needed between your Worker and Hyperdrive's connection pool.

## 2025-03-07

**Hyperdrive connects to your database using Cloudflare's IP address ranges**

Hyperdrive now uses [Cloudflare's IP address ranges](https://www.cloudflare.com/ips/) for egress.

This enables you to configure the firewall policies on your database to allow access to this limited IP address range.

Learn more about [configuring your database networking for Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/firewall-and-networking-configuration/).

## 2025-03-07

**Hyperdrive improves connection pool placement, decreasing query latency by up to 90%**

Hyperdrive now pools all database connections in one or more regions as close to your database as possible. This means that your uncached queries and new database connections have up to 90% less latency as measured from Hyperdrive connection pools.

With improved placement for Hyperdrive connection pools, Workers' Smart Placement is more effective by ensuring that your Worker and Hyperdrive database connection pool are placed as close to your database as possible.

See [the announcement](https://developers.cloudflare.com/changelog/2025-03-04-hyperdrive-pooling-near-database-and-ip-range-egress/) for more details.

## 2025-01-28

**Hyperdrive automatically configures your Cloudflare Tunnel to connect to your private database.**

When creating a Hyperdrive configuration for a private database, you only need to provide your database credentials and set up a Cloudflare Tunnel within the private network where your database is accessible.

Hyperdrive will automatically create the Cloudflare Access, Service Token and Policies needed to secure and restrict your Cloudflare Tunnel to the Hyperdrive configuration.

Refer to [documentation on how to configure Hyperdrive to connect to a private database](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).

## 2024-12-11

**Hyperdrive now caches queries in all Cloudflare locations decreasing cache hit latency by up to 90%**

Hyperdrive query caching now happens in all locations where Hyperdrive can be accessed. When making a query in a location that has cached the query result, your latency may be decreased by up to 90%.

Refer to [documentation on how Hyperdrive caches query results](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/#3-query-caching).

## 2024-11-19

**Hyperdrive now supports clear-text password authentication**

When connecting to a database that requires secure clear-text password authentication over TLS, Hyperdrive will now support this authentication method.

Refer to the documentation to see [all PostgreSQL authentication modes supported by Hyperdrive](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features#supported-postgresql-authentication-modes).

## 2024-10-30

**New Hyperdrive configurations to private databases using Tunnels are validated before creation**

When creating a new Hyperdrive configuration to a private database using Tunnels, Hyperdrive will verify that it can connect to the database to ensure that your Tunnel and Access application have been properly configured. This makes it easier to debug connectivity issues.

Refer to [documentation on connecting to private databases](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/) for more information.

## 2024-09-20

**The \`node-postgres\` (pg) driver is now supported for Pages applications using Hyperdrive.**

The popular `pg` ([node-postgres](https://github.com/brianc/node-postgres) driver no longer requires the legacy `node_compat` mode, and can now be used in both Workers and Pages for connecting to Hyperdrive. This uses the new (improved) Node.js compatibility in Workers and Pages.

You can set [compatibility\_flags = \["nodejs\_compat\_v2"\]](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) in your `wrangler.toml` or via the Pages dashboard to benefit from this change. Visit the [Hyperdrive documentation on supported drivers](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/#supported-drivers) to learn more about the driver versions supported by Hyperdrive.

## 2024-08-19

**Improved caching for Postgres.js**

Hyperdrive now better caches [Postgres.js](https://github.com/porsager/postgres) queries to reduce queries to the origin database.

## 2024-08-13

**Hyperdrive audit logs now available in the Cloudflare Dashboard**

Actions that affect Hyperdrive configs in an account will now appear in the audit logs for that account.

## 2024-05-24

**Increased configuration limits**

You can now create up to 25 Hyperdrive configurations per account, up from the previous maximum of 10.

Refer to [Limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) to review the limits that apply to Hyperdrive.

## 2024-05-22

**Driver performance improvements**

Compatibility improvements to how Hyperdrive interoperates with the popular [Postgres.js](https://github.com/porsager/postgres) driver have been released. These improvements allow queries made via Postgres.js to be correctly cached (when enabled) in Hyperdrive.

Developers who had previously set `prepare: false` can remove this configuration when establishing a new Postgres.js client instance.

Read the [documentation on supported drivers](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/#supported-drivers) to learn more about database driver interoperability with Hyperdrive.

## 2024-04-01

**Hyperdrive is now Generally Available**

Hyperdrive is now Generally Available and ready for production applications.

Read the [announcement blog](https://blog.cloudflare.com/making-full-stack-easier-d1-ga-hyperdrive-queues) to learn more about the Hyperdrive and the roadmap, including upcoming support for MySQL databases.

## 2024-03-19

**Improved local development configuration**

Hyperdrive now supports a `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING_NAME>` environmental variable for configuring local development to use a test/non-production database, in addition to the `localConnectionString` configuration in `wrangler.toml`.

Refer to [Local development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/) for instructions on how to configure Hyperdrive locally.

## 2023-09-28

**Hyperdrive now available**

Hyperdrive is now available in public beta to any developer with a Workers Paid plan.

To start using Hyperdrive, visit the [get started](https://developers.cloudflare.com/hyperdrive/get-started/) guide or read the [announcement blog](https://blog.cloudflare.com/hyperdrive-making-regional-databases-feel-distributed/) to learn more.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/platform/","name":"Platform"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/platform/release-notes/","name":"Release notes"}}]}
```

---

---
title: Choose a data or storage product
description: Storage and database options available on Cloudflare's developer platform.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/workers/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Choose a data or storage product

This guide describes the storage & database products available as part of Cloudflare Workers, including recommended use-cases and best practices.

## Choose a storage product

The following table maps our storage & database products to common industry terms as well as recommended use-cases:

| Use-case                                  | Product                                                                           | Ideal for                                                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Key-value storage                         | [Workers KV](https://developers.cloudflare.com/kv/)                               | Configuration data, service routing metadata, personalization (A/B testing)                                                                                   |
| Object storage / blob storage             | [R2](https://developers.cloudflare.com/r2/)                                       | User-facing web assets, images, machine learning and training datasets, analytics datasets, log and event data.                                               |
| Accelerate a Postgres or MySQL database   | [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)                       | Connecting to an existing database in a cloud or on-premise using your existing database drivers & ORMs.                                                      |
| Global coordination & stateful serverless | [Durable Objects](https://developers.cloudflare.com/durable-objects/)             | Building collaborative applications; global coordination across clients; real-time WebSocket applications; strongly consistent, transactional storage.        |
| Lightweight SQL database                  | [D1](https://developers.cloudflare.com/d1/)                                       | Relational data, including user profiles, product listings and orders, and/or customer data.                                                                  |
| Task processing, batching and messaging   | [Queues](https://developers.cloudflare.com/queues/)                               | Background job processing (emails, notifications, APIs), message queuing, and deferred tasks.                                                                 |
| Vector search & embeddings queries        | [Vectorize](https://developers.cloudflare.com/vectorize/)                         | Storing [embeddings](https://developers.cloudflare.com/workers-ai/models/?tasks=Text+Embeddings) from AI models for semantic search and classification tasks. |
| Streaming ingestion                       | [Pipelines](https://developers.cloudflare.com/pipelines/)                         | Streaming data ingestion and processing, including clickstream analytics, telemetry/log data, and structured data for querying                                |
| Time-series metrics                       | [Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) | Write and query high-cardinality time-series data, usage metrics, and service-level telemetry using Workers and/or SQL.                                       |

Applications can build on multiple storage & database products: for example, using Workers KV for session data; R2 for large file storage, media assets and user-uploaded files; and Hyperdrive to connect to a hosted Postgres or MySQL database.

Pages Functions

Storage options can also be used by your front-end application built with Cloudflare Pages. For more information on available storage options for Pages applications, refer to the [Pages Functions bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

## SQL database options

There are three options for SQL-based databases available when building applications with Workers.

* **Hyperdrive** if you have an existing Postgres or MySQL database, require large (1TB, 100TB or more) single databases, and/or want to use your existing database tools. You can also connect Hyperdrive to database platforms like [PlanetScale ↗](https://planetscale.com/) or [Neon ↗](https://neon.tech/).
* **D1** for lightweight, serverless applications that are read-heavy, have global users that benefit from D1's [read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/), and do not require you to manage and maintain a traditional RDBMS.
* **Durable Objects** for stateful serverless workloads, per-user or per-customer SQL state, and building distributed systems (D1 and Queues are built on Durable Objects) where Durable Object's [strict serializability ↗](https://blog.cloudflare.com/durable-objects-easy-fast-correct-choose-three/) enables global ordering of requests and storage operations.

### Session storage

We recommend using [Workers KV](https://developers.cloudflare.com/kv/) for storing session data, credentials (API keys), and/or configuration data. These are typically read at high rates (thousands of RPS or more), are not typically modified (within KV's 1 write RPS per unique key limit), and do not need to be immediately consistent.

Frequently read keys benefit from KV's [internal cache](https://developers.cloudflare.com/kv/concepts/how-kv-works/), and repeated reads to these "hot" keys will typically see latencies in the 500µs to 10ms range.

Authentication frameworks like [OpenAuth ↗](https://openauth.js.org/docs/storage/cloudflare/) use Workers KV as session storage when deployed to Cloudflare, and [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) uses KV to securely store and distribute user credentials so that they can be validated as close to the user as possible and reduce overall latency.

## Product overviews

### Workers KV

Workers KV is an eventually consistent key-value data store that caches on the Cloudflare global network.

It is ideal for projects that require:

* High volumes of reads and/or repeated reads to the same keys.
* Low-latency global reads (typically within 10ms for hot keys)
* Per-object time-to-live (TTL).
* Distributed configuration and/or session storage.

To get started with KV:

* Read how [KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/).
* Create a [KV namespace](https://developers.cloudflare.com/kv/concepts/kv-namespaces/).
* Review the [KV Runtime API](https://developers.cloudflare.com/kv/api/).
* Learn about KV [Limits](https://developers.cloudflare.com/kv/platform/limits/).

### R2

R2 is S3-compatible blob storage that allows developers to store large amounts of unstructured data without egress fees associated with typical cloud storage services.

It is ideal for projects that require:

* Storage for files which are infrequently accessed.
* Large object storage (for example, gigabytes or more per object).
* Strong consistency per object.
* Asset storage for websites (refer to [caching guide](https://developers.cloudflare.com/r2/buckets/public-buckets/#caching))

To get started with R2:

* Read the [Get started guide](https://developers.cloudflare.com/r2/get-started/).
* Learn about R2 [Limits](https://developers.cloudflare.com/r2/platform/limits/).
* Review the [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).

### Durable Objects

Durable Objects provide low-latency coordination and consistent storage for the Workers platform through global uniqueness and a transactional storage API.

* Global Uniqueness guarantees that there will be a single instance of a Durable Object class with a given ID running at once, across the world. Requests for a Durable Object ID are routed by the Workers runtime to the Cloudflare data center that owns the Durable Object.
* The transactional storage API provides strongly consistent key-value storage to the Durable Object. Each Object can only read and modify keys associated with that Object. Execution of a Durable Object is single-threaded, but multiple request events may still be processed out-of-order from how they arrived at the Object.

It is ideal for projects that require:

* Real-time collaboration (such as a chat application or a game server).
* Consistent storage.
* Data locality.

To get started with Durable Objects:

* Read the [introductory blog post ↗](https://blog.cloudflare.com/introducing-workers-durable-objects/).
* Review the [Durable Objects documentation](https://developers.cloudflare.com/durable-objects/).
* Get started with [Durable Objects](https://developers.cloudflare.com/durable-objects/get-started/).
* Learn about Durable Objects [Limits](https://developers.cloudflare.com/durable-objects/platform/limits/).

### D1

[D1](https://developers.cloudflare.com/d1/) is Cloudflare’s native serverless database. With D1, you can create a database by importing data or defining your tables and writing your queries within a Worker or through the API.

D1 is ideal for:

* Persistent, relational storage for user data, account data, and other structured datasets.
* Use-cases that require querying across your data ad-hoc (using SQL).
* Workloads with a high ratio of reads to writes (most web applications).

To get started with D1:

* Read [the documentation](https://developers.cloudflare.com/d1)
* Follow the [Get started guide](https://developers.cloudflare.com/d1/get-started/) to provision your first D1 database.
* Review the [D1 Workers Binding API](https://developers.cloudflare.com/d1/worker-api/).

Note

If your working data size exceeds 10 GB (the maximum size for a D1 database), consider splitting the database into multiple, smaller D1 databases.

### Queues

Cloudflare Queues allows developers to send and receive messages with guaranteed delivery. It integrates with [Cloudflare Workers](https://developers.cloudflare.com/workers) and offers at-least once delivery, message batching, and does not charge for egress bandwidth.

Queues is ideal for:

* Offloading work from a request to schedule later.
* Send data from Worker to Worker (inter-Service communication).
* Buffering or batching data before writing to upstream systems, including third-party APIs or [Cloudflare R2](https://developers.cloudflare.com/queues/examples/send-errors-to-r2/).

To get started with Queues:

* [Set up your first queue](https://developers.cloudflare.com/queues/get-started/).
* Learn more [about how Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/).

### Hyperdrive

Hyperdrive is a service that accelerates queries you make to MySQL and Postgres databases, making it faster to access your data from across the globe, irrespective of your users’ location.

Hyperdrive allows you to:

* Connect to an existing database from Workers without connection overhead.
* Cache frequent queries across Cloudflare's global network to reduce response times on highly trafficked content.
* Reduce load on your origin database with connection pooling.

To get started with Hyperdrive:

* [Connect Hyperdrive](https://developers.cloudflare.com/hyperdrive/get-started/) to your existing database.
* Learn more [about how Hyperdrive speeds up your database queries](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/).

## Pipelines

Pipelines is a streaming ingestion service that allows you to ingest high volumes of real time data, without managing any infrastructure.

Pipelines allows you to:

* Ingest data at extremely high throughput (tens of thousands of records per second or more)
* Batch and write data directly to object storage, ready for querying
* (Future) Transform and aggregate data during ingestion

To get started with Pipelines:

* [Create a Pipeline](https://developers.cloudflare.com/pipelines/getting-started/) that can batch and write records to R2.

### Analytics Engine

Analytics Engine is Cloudflare's time-series and metrics database that allows you to write unlimited-cardinality analytics at scale using a built-in API to write data points from Workers and query that data using SQL directly.

Analytics Engine allows you to:

* Expose custom analytics to your own customers
* Build usage-based billing systems
* Understand the health of your service on a per-customer or per-user basis
* Add instrumentation to frequently called code paths, without impacting performance or overwhelming external analytics systems with events

Cloudflare uses Analytics Engine internally to store and product per-product metrics for products like D1 and R2 at scale.

To get started with Analytics Engine:

* Learn how to [get started with Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/get-started/)
* See [an example of writing time-series data to Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/recipes/usage-based-billing-for-your-saas-product/)
* Understand the [SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) for reading data from your Analytics Engine datasets

### Vectorize

Vectorize is a globally distributed vector database that enables you to build full-stack, AI-powered applications with Cloudflare Workers and [Workers AI](https://developers.cloudflare.com/workers-ai/).

Vectorize allows you to:

* Store embeddings from any vector embeddings model (Bring Your Own embeddings) for semantic search and classification tasks.
* Add context to Large Language Model (LLM) queries by using vector search as part of a [Retrieval Augmented Generation](https://developers.cloudflare.com/workers-ai/guides/tutorials/build-a-retrieval-augmented-generation-ai/) (RAG) workflow.
* [Filter on vector metadata](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/) to reduce the search space and return more relevant results.

To get started with Vectorize:

* [Create your first vector database](https://developers.cloudflare.com/vectorize/get-started/intro/).
* Combine [Workers AI and Vectorize](https://developers.cloudflare.com/vectorize/get-started/embeddings/) to generate, store and query text embeddings.
* Learn more about [how vector databases work](https://developers.cloudflare.com/vectorize/reference/what-is-a-vector-database/).

## SQL in Durable Objects vs D1

Cloudflare Workers offers a SQLite-backed serverless database product - [D1](https://developers.cloudflare.com/d1/). How should you compare [SQLite in Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/) and D1?

**D1 is a managed database product.**

D1 fits into a familiar architecture for developers, where application servers communicate with a database over the network. Application servers are typically Workers; however, D1 also supports external, non-Worker access via an [HTTP API ↗](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/), which helps unlock [third-party tooling](https://developers.cloudflare.com/d1/reference/community-projects/#%5Ftop) support for D1.

D1 aims for a "batteries included" feature set, including the above HTTP API, [database schema management](https://developers.cloudflare.com/d1/reference/migrations/#%5Ftop), [data import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), and [database query insights](https://developers.cloudflare.com/d1/observability/metrics-analytics/#query-insights).

With D1, your application code and SQL database queries are not colocated which can impact application performance. If performance is a concern with D1, Workers has [Smart Placement](https://developers.cloudflare.com/workers/configuration/placement/#%5Ftop) to dynamically run your Worker in the best location to reduce total Worker request latency, considering everything your Worker talks to, including D1.

**SQLite in Durable Objects is a lower-level compute with storage building block for distributed systems.**

By design, Durable Objects are accessed with Workers-only.

Durable Objects require a bit more effort, but in return, give you more flexibility and control. With Durable Objects, you must implement two pieces of code that run in different places: a front-end Worker which routes incoming requests from the Internet to a unique Durable Object, and the Durable Object itself, which runs on the same machine as the SQLite database. You get to choose what runs where, and it may be that your application benefits from running some application business logic right next to the database.

With SQLite in Durable Objects, you may also need to build some of your own database tooling that comes out-of-the-box with D1.

SQL query pricing and limits are intended to be identical between D1 ([pricing](https://developers.cloudflare.com/d1/platform/pricing/), [limits](https://developers.cloudflare.com/d1/platform/limits/)) and SQLite in Durable Objects ([pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/#sqlite-storage-backend), [limits](https://developers.cloudflare.com/durable-objects/platform/limits/)).

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/workers/","name":"Workers"}},{"@type":"ListItem","position":3,"item":{"@id":"/workers/platform/","name":"Platform"}},{"@type":"ListItem","position":4,"item":{"@id":"/workers/platform/storage-options/","name":"Choose a data or storage product"}}]}
```

---

---
title: FAQ
description: Frequently asked questions about Hyperdrive connectivity, caching, and supported databases.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# FAQ

Below you will find answers to our most commonly asked questions regarding Hyperdrive.

## Connectivity

### Does Hyperdrive use specific IP addresses to connect to my database?

Hyperdrive connects to your database using [Cloudflare's IP address ranges ↗](https://www.cloudflare.com/ips/). These are shared by all Hyperdrive configurations and other Cloudflare products.

You can use this to configure restrictions in your database firewall to restrict the IP addresses that can access your database.

### Does Hyperdrive support connecting to D1 databases?

Hyperdrive does not support [D1](https://developers.cloudflare.com/d1) because D1 provides fast connectivity from Workers by design.

Hyperdrive is designed to speed up connectivity to traditional, regional SQL databases such as PostgreSQL. These databases are typically accessed using database drivers that communicate over TCP/IP. Unlike D1, creating a secure database connection to a traditional SQL database involves multiple round trips between the client (your Worker) and your database server. See [How Hyperdrive works](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/) for more detail on why round trips are needed and how Hyperdrive solves this.

D1 does not require round trips to create database connections. D1 is designed to be performant for access from Workers by default, without needing Hyperdrive.

### Should I use Placement with Hyperdrive?

Yes, if your Worker makes multiple queries per request. [Placement](https://developers.cloudflare.com/workers/configuration/placement/) runs your Worker near your database, reducing per-query latency from 20-30ms to 1-3ms. Hyperdrive handles connection pooling and setup. Placement reduces the network distance for query execution.

Use `placement.region` if your database runs in AWS, GCP, or Azure. Use `placement.host` for databases hosted elsewhere.

## Pricing

### Does Hyperdrive charge for data transfer / egress?

No.

### Is Hyperdrive available on the [Workers Free](https://developers.cloudflare.com/workers/platform/pricing/#workers) plan?

Yes. Refer to [pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/).

### Does Hyperdrive charge for additional compute?

Hyperdrive itself does not charge for compute (CPU) or processing (wall clock) time. Workers querying Hyperdrive and computing results: for example, serializing results into JSON and/or issuing queries, are billed per [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/#workers).

## Limits

### Are there any limits to Hyperdrive?

Refer to the published [limits](https://developers.cloudflare.com/hyperdrive/platform/limits/) documentation.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/reference/","name":"Reference"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/reference/faq/","name":"FAQ"}}]}
```

---

---
title: Supported databases and features
description: Database engines, providers, and driver libraries compatible with Hyperdrive.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Supported databases and features

## Database support

The following table shows which database engines and/or specific database providers are supported.

| Database Engine | Supported                | Known supported versions | Details                                                                                                             |
| --------------- | ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL      | ✅                        | 9.0 to 17.x              | Both self-hosted and managed (AWS, Azure, Google Cloud, Oracle) instances are supported.                            |
| MySQL           | ✅                        | 5.7 to 8.x               | Both self-hosted and managed (AWS, Azure, Google Cloud, Oracle) instances are supported. MariaDB is also supported. |
| SQL Server      | Not currently supported. |                          |                                                                                                                     |
| MongoDB         | Not currently supported. |                          |                                                                                                                     |

## Supported database providers

Hyperdrive supports managed Postgres and MySQL databases provided by various providers, including AWS, Azure, and GCP. Refer to [Examples](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/) to see how to connect to various database providers.

Hyperdrive also supports databases that are compatible with the Postgres or MySQL protocol. The following is a non-exhaustive list of Postgres or MySQL-compatible database providers:

| Database Engine | Supported | Known supported versions | Details                                                                                                                                                                                                                                                                                                                                    |
| --------------- | --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AWS Aurora      | ✅         | All                      | Postgres-compatible and MySQL-compatible. Refer to AWS Aurora examples for [MySQL](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-database-providers/aws-rds-aurora/) and [Postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/aws-rds-aurora/). |
| Neon            | ✅         | All                      | Neon currently runs Postgres 15.x                                                                                                                                                                                                                                                                                                          |
| Supabase        | ✅         | All                      | Supabase currently runs Postgres 15.x                                                                                                                                                                                                                                                                                                      |
| Timescale       | ✅         | All                      | See the [Timescale guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/timescale/) to connect.                                                                                                                                                                                    |
| Materialize     | ✅         | All                      | Postgres-compatible. Refer to the [Materialize guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/materialize/) to connect.                                                                                                                                                      |
| CockroachDB     | ✅         | All                      | Postgres-compatible. Refer to the [CockroachDB](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/cockroachdb/) guide to connect.                                                                                                                                                      |
| PlanetScale     | ✅         | All                      | PlanetScale provides MySQL-compatible and PostgreSQL databases                                                                                                                                                                                                                                                                             |
| MariaDB         | ✅         | All                      | MySQL-compatible.                                                                                                                                                                                                                                                                                                                          |

## Supported TLS (SSL) modes

### PostgreSQL

Hyperdrive supports the following [PostgreSQL TLS (SSL) ↗](https://www.postgresql.org/docs/current/libpq-ssl.html) connection modes when connecting to your origin database:

| Mode        | Supported        | Details                                                                                                                                  |
| ----------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| none        | No               | Hyperdrive does not support insecure plain text connections.                                                                             |
| prefer      | No (use require) | Hyperdrive will always use TLS.                                                                                                          |
| require     | Yes (default)    | TLS is required, and server certificates are validated (based on WebPKI).                                                                |
| verify-ca   | Yes              | Verifies the server's TLS certificate is signed by a root CA on the client. This ensures the server has a certificate the client trusts. |
| verify-full | Yes              | Identical to verify-ca, but also requires the database hostname must match a Subject Alternative Name (SAN) present on the certificate.  |

### MySQL

Hyperdrive supports the following [MySQL TLS (SSL) ↗](https://dev.mysql.com/doc/refman/8.0/en/connection-options.html#option%5Fgeneral%5Fssl-mode) connection modes when connecting to your origin database:

| Mode             | Supported         | Details                                                                                                                                                       |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DISABLED         | No                | Hyperdrive does not support insecure plain text connections.                                                                                                  |
| PREFERRED        | No (use REQUIRED) | Hyperdrive will always use TLS.                                                                                                                               |
| REQUIRED         | Yes (default)     | TLS is required, and server certificates are validated (based on WebPKI).                                                                                     |
| VERIFY\_CA       | Yes               | Verifies the server's TLS certificate is signed by a root CA on the client. This ensures the server has a certificate the client trusts.                      |
| VERIFY\_IDENTITY | Yes               | In addition to VERIFY\_CA checks, Hyperdrive requires the database hostname to match a Subject Alternative Name (SAN) or Common Name (CN) on the certificate. |

Refer to [SSL/TLS certificates](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/) documentation for details on how to configure these TLS (SSL) modes for Hyperdrive.

## Supported PostgreSQL authentication modes

Hyperdrive supports the following [authentication modes ↗](https://www.postgresql.org/docs/current/auth-methods.html) for connecting to PostgreSQL databases:

* Password Authentication (`md5`)
* Password Authentication (`password`) (clear-text password)
* SASL Authentication (`SCRAM-SHA-256`)

## Unsupported PostgreSQL features:

Hyperdrive does not support the following PostgreSQL features:

* SQL-level management of prepared statements, such as using `PREPARE`, `DISCARD`, `DEALLOCATE`, or `EXECUTE`.
* Advisory locks ([PostgreSQL documentation ↗](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)).
* `LISTEN` and `NOTIFY`.
* `PREPARE` and `DEALLOCATE`.
* Any modification to per-session state not explicitly documented as supported elsewhere.

## Unsupported MySQL features:

Hyperdrive does not support the following MySQL features:

* Non-UTF8 characters in queries
* `USE` statements
* Multi-statement queries
* Prepared statement queries via SQL (using `PREPARE` and `EXECUTE` statements) and [protocol-level prepared statements ↗](https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements).
* `COM_INIT_DB` messages
* [Authentication plugins ↗](https://dev.mysql.com/doc/refman/8.4/en/authentication-plugins.html) other than `caching_sha2_password` or `mysql_native_password`

In cases where you need to issue these unsupported statements from your application, the Hyperdrive team recommends setting up a second, direct client without Hyperdrive.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/reference/","name":"Reference"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/reference/supported-databases-and-features/","name":"Supported databases and features"}}]}
```

---

---
title: Wrangler commands
description: Wrangler CLI commands for creating and managing Hyperdrive configurations.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/hyperdrive/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Wrangler commands

The following [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/) apply to Hyperdrive.

## `hyperdrive create`

Create a Hyperdrive config

* [  npm ](#tab-panel-6043)
* [  pnpm ](#tab-panel-6044)
* [  yarn ](#tab-panel-6045)

Terminal window

```

npx wrangler hyperdrive create [NAME]


```

Terminal window

```

pnpm wrangler hyperdrive create [NAME]


```

Terminal window

```

yarn wrangler hyperdrive create [NAME]


```

* `[NAME]` ` string ` required  
The name of the Hyperdrive config
* `--connection-string` ` string `  
The connection string for the database you want Hyperdrive to connect to - ex: protocol://user:password@host:port/database
* `--service-id` ` string `  
The Workers VPC Service ID of the origin database
* `--origin-host` ` string ` alias: --host  
The host of the origin database
* `--origin-port` ` number ` alias: --port  
The port number of the origin database
* `--origin-scheme` ` string ` alias: --scheme default: postgresql  
The scheme used to connect to the origin database
* `--database` ` string `  
The name of the database within the origin database
* `--origin-user` ` string ` alias: --user  
The username used to connect to the origin database
* `--origin-password` ` string ` alias: --password  
The password used to connect to the origin database
* `--access-client-id` ` string `  
The Client ID of the Access token to use when connecting to the origin database
* `--access-client-secret` ` string `  
The Client Secret of the Access token to use when connecting to the origin database
* `--caching-disabled` ` boolean `  
Disables the caching of SQL responses
* `--max-age` ` number `  
Specifies max duration for which items should persist in the cache, cannot be set when caching is disabled
* `--swr` ` number `  
Indicates the number of seconds cache may serve the response after it becomes stale, cannot be set when caching is disabled
* `--ca-certificate-id` ` string ` alias: --ca-certificate-uuid  
Sets custom CA certificate when connecting to origin database. Must be valid UUID of already uploaded CA certificate.
* `--mtls-certificate-id` ` string ` alias: --mtls-certificate-uuid  
Sets custom mTLS client certificates when connecting to origin database. Must be valid UUID of already uploaded public/private key certificates.
* `--sslmode` ` string `  
Sets sslmode for connecting to database. For PostgreSQL: 'require, verify-ca, verify-full'. For MySQL: 'REQUIRED, VERIFY\_CA, VERIFY\_IDENTITY'.
* `--origin-connection-limit` ` number `  
The (soft) maximum number of connections that Hyperdrive may establish to the origin database
* `--binding` ` string `  
The binding name of this resource in your Worker
* `--update-config` ` boolean `  
Automatically update your config file with the newly added resource

Global flags

* `--v` ` boolean ` alias: --version  
Show version number
* `--cwd` ` string `  
Run as if Wrangler was started in the specified directory instead of the current working directory
* `--config` ` string ` alias: --c  
Path to Wrangler configuration file
* `--env` ` string ` alias: --e  
Environment to use for operations, and for selecting .env and .dev.vars files
* `--env-file` ` string `  
Path to an .env file to load - can be specified multiple times - values from earlier files are overridden by values in later files
* `--experimental-provision` ` boolean ` aliases: --x-provision default: true  
Experimental: Enable automatic resource provisioning
* `--experimental-auto-create` ` boolean ` alias: --x-auto-create default: true  
Automatically provision draft bindings with new resources

## `hyperdrive delete`

Delete a Hyperdrive config

* [  npm ](#tab-panel-6046)
* [  pnpm ](#tab-panel-6047)
* [  yarn ](#tab-panel-6048)

Terminal window

```

npx wrangler hyperdrive delete [ID]


```

Terminal window

```

pnpm wrangler hyperdrive delete [ID]


```

Terminal window

```

yarn wrangler hyperdrive delete [ID]


```

* `[ID]` ` string ` required  
The ID of the Hyperdrive config

Global flags

* `--v` ` boolean ` alias: --version  
Show version number
* `--cwd` ` string `  
Run as if Wrangler was started in the specified directory instead of the current working directory
* `--config` ` string ` alias: --c  
Path to Wrangler configuration file
* `--env` ` string ` alias: --e  
Environment to use for operations, and for selecting .env and .dev.vars files
* `--env-file` ` string `  
Path to an .env file to load - can be specified multiple times - values from earlier files are overridden by values in later files
* `--experimental-provision` ` boolean ` aliases: --x-provision default: true  
Experimental: Enable automatic resource provisioning
* `--experimental-auto-create` ` boolean ` alias: --x-auto-create default: true  
Automatically provision draft bindings with new resources

## `hyperdrive get`

Get a Hyperdrive config

* [  npm ](#tab-panel-6049)
* [  pnpm ](#tab-panel-6050)
* [  yarn ](#tab-panel-6051)

Terminal window

```

npx wrangler hyperdrive get [ID]


```

Terminal window

```

pnpm wrangler hyperdrive get [ID]


```

Terminal window

```

yarn wrangler hyperdrive get [ID]


```

* `[ID]` ` string ` required  
The ID of the Hyperdrive config

Global flags

* `--v` ` boolean ` alias: --version  
Show version number
* `--cwd` ` string `  
Run as if Wrangler was started in the specified directory instead of the current working directory
* `--config` ` string ` alias: --c  
Path to Wrangler configuration file
* `--env` ` string ` alias: --e  
Environment to use for operations, and for selecting .env and .dev.vars files
* `--env-file` ` string `  
Path to an .env file to load - can be specified multiple times - values from earlier files are overridden by values in later files
* `--experimental-provision` ` boolean ` aliases: --x-provision default: true  
Experimental: Enable automatic resource provisioning
* `--experimental-auto-create` ` boolean ` alias: --x-auto-create default: true  
Automatically provision draft bindings with new resources

## `hyperdrive list`

List Hyperdrive configs

* [  npm ](#tab-panel-6052)
* [  pnpm ](#tab-panel-6053)
* [  yarn ](#tab-panel-6054)

Terminal window

```

npx wrangler hyperdrive list


```

Terminal window

```

pnpm wrangler hyperdrive list


```

Terminal window

```

yarn wrangler hyperdrive list


```

Global flags

* `--v` ` boolean ` alias: --version  
Show version number
* `--cwd` ` string `  
Run as if Wrangler was started in the specified directory instead of the current working directory
* `--config` ` string ` alias: --c  
Path to Wrangler configuration file
* `--env` ` string ` alias: --e  
Environment to use for operations, and for selecting .env and .dev.vars files
* `--env-file` ` string `  
Path to an .env file to load - can be specified multiple times - values from earlier files are overridden by values in later files
* `--experimental-provision` ` boolean ` aliases: --x-provision default: true  
Experimental: Enable automatic resource provisioning
* `--experimental-auto-create` ` boolean ` alias: --x-auto-create default: true  
Automatically provision draft bindings with new resources

## `hyperdrive update`

Update a Hyperdrive config

* [  npm ](#tab-panel-6055)
* [  pnpm ](#tab-panel-6056)
* [  yarn ](#tab-panel-6057)

Terminal window

```

npx wrangler hyperdrive update [ID]


```

Terminal window

```

pnpm wrangler hyperdrive update [ID]


```

Terminal window

```

yarn wrangler hyperdrive update [ID]


```

* `[ID]` ` string ` required  
The ID of the Hyperdrive config
* `--name` ` string `  
Give your config a new name
* `--connection-string` ` string `  
The connection string for the database you want Hyperdrive to connect to - ex: protocol://user:password@host:port/database
* `--service-id` ` string `  
The Workers VPC Service ID of the origin database
* `--origin-host` ` string ` alias: --host  
The host of the origin database
* `--origin-port` ` number ` alias: --port  
The port number of the origin database
* `--origin-scheme` ` string ` alias: --scheme  
The scheme used to connect to the origin database
* `--database` ` string `  
The name of the database within the origin database
* `--origin-user` ` string ` alias: --user  
The username used to connect to the origin database
* `--origin-password` ` string ` alias: --password  
The password used to connect to the origin database
* `--access-client-id` ` string `  
The Client ID of the Access token to use when connecting to the origin database
* `--access-client-secret` ` string `  
The Client Secret of the Access token to use when connecting to the origin database
* `--caching-disabled` ` boolean `  
Disables the caching of SQL responses
* `--max-age` ` number `  
Specifies max duration for which items should persist in the cache, cannot be set when caching is disabled
* `--swr` ` number `  
Indicates the number of seconds cache may serve the response after it becomes stale, cannot be set when caching is disabled
* `--ca-certificate-id` ` string ` alias: --ca-certificate-uuid  
Sets custom CA certificate when connecting to origin database. Must be valid UUID of already uploaded CA certificate.
* `--mtls-certificate-id` ` string ` alias: --mtls-certificate-uuid  
Sets custom mTLS client certificates when connecting to origin database. Must be valid UUID of already uploaded public/private key certificates.
* `--sslmode` ` string `  
Sets sslmode for connecting to database. For PostgreSQL: 'require, verify-ca, verify-full'. For MySQL: 'REQUIRED, VERIFY\_CA, VERIFY\_IDENTITY'.
* `--origin-connection-limit` ` number `  
The (soft) maximum number of connections that Hyperdrive may establish to the origin database

Global flags

* `--v` ` boolean ` alias: --version  
Show version number
* `--cwd` ` string `  
Run as if Wrangler was started in the specified directory instead of the current working directory
* `--config` ` string ` alias: --c  
Path to Wrangler configuration file
* `--env` ` string ` alias: --e  
Environment to use for operations, and for selecting .env and .dev.vars files
* `--env-file` ` string `  
Path to an .env file to load - can be specified multiple times - values from earlier files are overridden by values in later files
* `--experimental-provision` ` boolean ` aliases: --x-provision default: true  
Experimental: Enable automatic resource provisioning
* `--experimental-auto-create` ` boolean ` alias: --x-auto-create default: true  
Automatically provision draft bindings with new resources

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/hyperdrive/","name":"Hyperdrive"}},{"@type":"ListItem","position":3,"item":{"@id":"/hyperdrive/reference/","name":"Reference"}},{"@type":"ListItem","position":4,"item":{"@id":"/hyperdrive/reference/wrangler-commands/","name":"Wrangler commands"}}]}
```