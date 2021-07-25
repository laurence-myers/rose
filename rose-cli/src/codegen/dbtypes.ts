import { DefaultMap } from "../lang";
import { TypeMapEntry } from "../config";

const POSTGRES_TO_TYPESCRIPT_TYPE_MAP: Map<string, string> = new DefaultMap<
	string,
	string
>(() => "any", <[string, string][]>[
	["bigint", "string"], // 8 bytes, can't be represented as a FP number
	["bigserial", "string"], // 8 bytes, can't be represented as a FP number
	["bit", "number"], // bit string?
	["bool", "boolean"],
	["boolean", "boolean"],
	["box", "boolean"],
	["bpchar", "string"],
	["bytea", "Buffer"],
	["char", "string"],
	['"char"', "string"], // https://www.postgresql.org/docs/13/datatype-character.html#DATATYPE-CHARACTER-SPECIAL-TABLE
	["character varying", "string"],
	["character", "string"],
	["cidr", "string"],
	["circle", "{ radius: number; x: number; y: number }"],
	["date", "Date"],
	["daterange", "any"], // ?
	["decimal", "string"],
	["double precision", "number"],
	["float4", "number"],
	["float8", "number"],
	["hstore", "{ [key : string] : string }"],
	["inet", "string"],
	["int", "number"],
	["int2", "number"],
	["int4", "number"],
	["int4range", "any"], // ?
	["int8", "string"], // 8 bytes, can't be represented as a FP number
	["int8range", "any"], // ?
	["integer", "number"],
	[
		"interval",
		"{ years?: number; months?: number; days?: number; hours?: number; minutes?: number; seconds?: number; milliseconds?: number; toPostgres(): string; toISO(): string; toISOString(): string }",
	],
	["json", "object"], // would be nice to make this more explicit
	["jsonb", "object"], // would be nice to make this more explicit
	["line", "any"], // ?
	["lseg", "any"], // ?
	["macaddr", "string"],
	["money", "string"],
	["name", "string"], // https://www.postgresql.org/docs/13/datatype-character.html#DATATYPE-CHARACTER-SPECIAL-TABLE
	["numeric", "string"],
	["numrange", "string"],
	["oid", "number"], // unsigned four-byte integer
	["path", "any"], // ?
	["point", "{ x: number; y: number }"],
	["polygon", "any"], // ?
	["real", "number"],
	["serial", "number"],
	["serial2", "number"],
	["serial4", "number"],
	["smallint", "number"],
	["smallserial", "number"],
	["snapshot", "any"], // ?
	["text", "string"],
	["time with time zone", "Date"],
	["time without time zone", "Date"],
	["time", "string"],
	["timestamp with time zone", "Date"],
	["timestamp without time zone", "Date"],
	["timestamp", "Date"],
	["timestamptz", "Date"],
	["timetz", "string"],
	["tsquery", "any"], // ?
	["tsrange", "any"], // ?
	["tstzrange", "any"], // ?
	["tsvector", "string"], // e.g. "'bird':1 'bore':4 'california':18 'dog':16 'face':14 'must':13 'perdit':2 'pioneer':11 'stori':5 'woman':8"
	["uuid", "string"], // ?
	["varbit", "number"], // bit string?
	["varchar", "string"],
	["xml", "string"], // ?
]);

export const defaultPostgresTypeMap = (function () {
	const map: Map<string, TypeMapEntry> = new Map();
	for (const entry of POSTGRES_TO_TYPESCRIPT_TYPE_MAP.entries()) {
		map.set(entry[0], {
			type: entry[1],
		});
	}
	return map;
})();
