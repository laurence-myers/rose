# rose

![](https://github.com/laurence-myers/rose/workflows/Rose%20CI/badge.svg)
[![codecov](https://codecov.io/gh/laurence-myers/rose/branch/master/graph/badge.svg)](https://codecov.io/gh/laurence-myers/rose)


`rose` is a PostgreSQL query builder and row mapper for TypeScript. It has the following goals:

- To provide a type-safe interface between your TypeScript application and the PostgreSQL query language.
- To mimic the SQL syntax as closely as possible using a Domain Specific Language (DSL)
- To support custom queries beyond basic CRUD. This includes:
  - Joining arbitrary tables, including sub-selects
  - Common table expressions
  - "Upserts" (`INSERT ... ON CONFLICT ...`)
  - Transactions
- To allow dynamically composing queries, _or_ pre-compiled queries.
- To treat your database as the source of truth for your data schema.
- Avoid concatenating strings at all costs.

To get started, please read the online documentation:

https://laurence-myers.github.io/rose/

## Project structure

### rose

This is the core library you import into your application. It provides the query building and row mapping functionality.

### rose-cli

This introspects your database schema and generates "metamodel" code.

### rose-docs

This generates the online documentation. Code examples are tested against the real codebase.

### rose-example

This is a demonstration of how you can use `rose` in your application.

## Development

### Publishing a new version

```
cd rose
yarn publish:npm

cd ../rose-docs
yarn publish:npm
```

Increment the `version` in each project's `package.json`
