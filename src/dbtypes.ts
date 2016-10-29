import {DefaultMap} from "./lang";

export const POSTGRES_TO_TYPESCRIPT_TYPE_MAP : Map<string, string> = new DefaultMap<string, string>(() => "any", <[string, string][]>[
	["bigint", "string"], // 8 bytes, can't be represented as a FP number
	["int8", "string"], // 8 bytes, can't be represented as a FP number
	["bigserial", "string"], // 8 bytes, can't be represented as a FP number
	["bit", "number"], // bit string?
	["varbit", "number"], // bit string?
	["boolean", "boolean"],
	["bool", "boolean"],
	["box", "boolean"],
	["bytea", "Buffer"],
	["character", "string"],
	["char", "string"],
	["bpchar", "string"],
	["character varying", "string"],
	["varchar", "string"],
	["cidr", "string"],
	["circle", "any"], // ?
	["date", "Date"],
	["double precision", "number"],
	["float8", "number"],
	["hstore", "{ [key : string] : string }"],
	["inet", "string"],
	["integer", "number"],
	["int", "number"],
	["int4", "number"],
	["interval", "any"], // ?
	["json", "Object"], // would be nice to make this more explicit
	["jsonb", "Object"], // would be nice to make this more explicit
	["line", "any"], // ?
	["lseg", "any"], // ?
	["macaddr", "string"],
	["money", "number"], // ?
	["numeric", "number"],
	["decimal", "number"],
	["path", "any"], // ?
	["point", "any"], // ?
	["polygon", "any"], // ?
	["real", "number"],
	["float4", "number"],
	["smallint", "number"],
	["int2", "number"],
	["smallserial", "number"],
	["serial2", "number"],
	["serial", "number"],
	["serial4", "number"],
	["text", "string"],
	["time", "Date"],
	["time without time zone", "Date"],
	["time with time zone", "Date"],
	["timetz", "Date"],
	["timestamp", "Date"],
	["timestamp without time zone", "Date"],
	["timestamp with time zone", "Date"],
	["timestamptz", "Date"],
	["tsquery", "any"], // ?
	["tsvector", "any"], // ?
	["snapshot", "any"], // ?
	["uuid", "string"], // ?
	["xml", "string"], // ?

	["int4range", "any"], // ?
	["int8range", "any"], // ?
	["numrange", "any"], // ?
	["tsrange", "any"], // ?
	["tstzrange", "any"], // ?
	["daterange", "any"] // ?

	// Not supported; other internal formats like
]);
