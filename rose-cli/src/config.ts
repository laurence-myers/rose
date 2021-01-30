import { promises as fs } from 'fs';
import { Static, Type } from '@sinclair/typebox';
import { defaultPostgresTypeMap } from "./codegen/dbtypes";
import { ConfigError } from "./errors";
import Ajv from "ajv";

const stringSchema = Type.String({ minLength: 1 });

const typeMapEntrySchema = Type.Object({
	type: stringSchema,
	from: Type.Optional(stringSchema)
});

const typeMapObjectSchema = Type.Dict(Type.Union([
	typeMapEntrySchema,
	stringSchema
]));

export const configSchema = Type.Object({
	ignore: Type.Optional(Type.Array(stringSchema)),
	types: Type.Optional(Type.Object({
		global: Type.Optional(
			typeMapObjectSchema
		),
		columns: Type.Optional(
			typeMapObjectSchema
		)
	}))
});

export interface CliConfig extends Static<typeof configSchema> {
}

export interface PostgresTypeMap extends Map<string, TypeMapEntry> {
}

export interface TypeMapObject extends Static<typeof typeMapObjectSchema> {
}

export interface TypeMapEntry extends Static<typeof typeMapEntrySchema> {
}

export interface IntrospectConfig {
	schema: string;
	ignoredTables: string[];
	types: {
		global: PostgresTypeMap;
		columns: PostgresTypeMap;
		enums: PostgresTypeMap;
	};
}

const defaultIgnoredTables = [
	'__MigrationHistory', // Entity Framework
	'alembic_version', // SQLAlchemy Alembic
	'DATABASECHANGELOG', // Liquibase
	'django_migrations', // Django
	'flyway_schema_history', // Flyway
	'knex_migrations', // Knex.js
	'migrations', // db-migrations, TypeORM (could have issues if the DB is tracking bird flight paths... ;))
	'mikro_orm_migrations', // MikroORM
	'schema_migrations', // ActiveRecord (Ruby on Rails)
	'SequelizeMeta' // umzug (Sequelize)
].map((name) => name.toLowerCase());

export function convertTypeMapObjectToMap(obj: TypeMapObject, outputMap: Map<string, TypeMapEntry> = new Map()): Map<string, TypeMapEntry> {
	for (const entry of Object.entries(obj)) {
		let value = entry[1];
		if (typeof value === 'string') {
			outputMap.set(entry[0], {
				type: value
			});
		} else {
			outputMap.set(entry[0], value);
		}
	}
	return outputMap;
}

export function mergeConfigWithDefaults(config: CliConfig = {}): IntrospectConfig {
	let globalTypes: Map<string, TypeMapEntry> = new Map(defaultPostgresTypeMap.entries());
	globalTypes = convertTypeMapObjectToMap(config?.types?.global || {}, globalTypes);
	const columnTypes = convertTypeMapObjectToMap(config?.types?.columns || {});
	return {
		schema: 'public',
		ignoredTables: defaultIgnoredTables.concat((config.ignore || []).map((name) => name.toLowerCase())),
		types: {
			global: globalTypes,
			columns: columnTypes,
			enums: new Map()
		},
	};
}

export async function parseConfig(configFileName: string): Promise<CliConfig> {
	let rawData;
	try {
		rawData = JSON.parse(await fs.readFile(configFileName, 'utf8'));
	} catch (err) {
		console.error(err);
		throw new ConfigError(`Could not read from config file "${ configFileName }", make sure it is well-formed JSON.`);
	}
	const validator = new Ajv({
		strict: false
	});
	const isValid = validator.validate(configSchema, rawData);
	if (!isValid) {
		throw new ConfigError(`Invalid config: ${ validator.errorsText() }`);
	}
	return rawData;
}
