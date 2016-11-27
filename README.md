# Arbaon - A Row By Any Other Name

## Goals

- Type safe interface between PostgreSQL and TypeScript (Node.js) applications. 
- Flexible query interface, that can return arbitrary objects, not restricted to a single object graph (i.e. one class).
- Multiple layers of capabilities:
  - Generating TypeScript interfaces from your database schema.
  - Type-safe query builder.
  - ORM layer on top of the query builder. (Not yet implemented.)
- Composable queries.
- Reusable queries; support caching built queries and generated SQL, so application code just passes in parameters.
- No chance for SQL injection, through the sole use of parameterised queries.  

## Out of scope

- DDL statements.
  - You should construct your database outside of your consuming application, using SQL.
- Support for other databases.
  - By focusing on PostgreSQL, we can provide more sophisticated capabilities, and we're not limited to only supporting
    functionality common to all databases.