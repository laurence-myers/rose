import * as assert from "assert";
import { CliConfig, parseConfig } from "../../src/config";
import * as arp from "app-root-path";
import * as path from "path";

describe(`Config`, () => {
	it(`parses a config file okay`, async () => {
		const config = await parseConfig(
			arp.resolve(path.join("test", "codegen", "data", "testConfig1.json"))
		);
		const expected: CliConfig = {
			ignore: ["foo", "bar"],
			types: {
				global: {
					int8: "BigInt",
					circle: {
						type: "Circle",
						from: "../circle.ts",
					},
				},
				columns: {
					"foo.bar": "Buffer",
					"baz.qux": {
						type: "Square",
						from: "../square.ts",
					},
				},
			},
		};
		assert.deepEqual(config, expected);
	});
});
