import { DefaultMap } from "../lang";
import { TypeMapEntry } from "../config";

const POSTGRES_TO_TYPESCRIPT_TYPE_MAP: Map<string, string> = new DefaultMap<string, string>(() => "any", <[string, string][]>[
	["bigint", "string"], // 8 bytes, can't be represented as a FP number
	["bigserial", "string"], // 8 bytes, can't be represented as a FP number
	["bit", "number"], // bit string?
	["bool", "boolean"],
	["boolean", "boolean"],
	["box", "boolean"],
	["bpchar", "string"],
	["bytea", "Buffer"],
	["char", "string"],
	["character varying", "string"],
	["character", "string"],
	["cidr", "string"],
	["circle", "any"], // ?
	["date", "Date"],
	["daterange", "any"], // ?
	["decimal", "number"],
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
	["interval", "any"], // ?
	["json", "object"], // would be nice to make this more explicit
	["jsonb", "object"], // would be nice to make this more explicit
	["line", "any"], // ?
	["lseg", "any"], // ?
	["macaddr", "string"],
	["money", "number"], // ?
	["numeric", "number"],
	["numrange", "any"], // ?
	["path", "any"], // ?
	["point", "any"], // ?
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
	["time", "Date"],
	["timestamp with time zone", "Date"],
	["timestamp without time zone", "Date"],
	["timestamp", "Date"],
	["timestamptz", "Date"],
	["timetz", "Date"],
	["tsquery", "any"], // ?
	["tsrange", "any"], // ?
	["tstzrange", "any"], // ?
	["tsvector", "string"], // e.g. "'bird':1 'bore':4 'california':18 'dog':16 'face':14 'must':13 'perdit':2 'pioneer':11 'stori':5 'woman':8"
	["uuid", "string"], // ?
	["varbit", "number"], // bit string?
	["varchar", "string"],
	["xml", "string"], // ?

	// Not supported; other internal formats like
]);

export const defaultPostgresTypeMap = (function () {
	const map: Map<string, TypeMapEntry> = new Map();
	for (const entry of POSTGRES_TO_TYPESCRIPT_TYPE_MAP.entries()) {
		map.set(entry[0], {
			type: entry[1]
		});
	}
	return map;
})();
