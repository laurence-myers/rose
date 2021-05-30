import { begin, commit, rollback } from "../../../../src/query/dsl/commands";
import * as assert from "assert";
import {
	BeginCommandBuilder,
	TransactionIsolationLevel,
	TransactionReadMode,
} from "../../../../src/query/builders/begin";
import { GeneratedQuery } from "../../../../src/query";
import { CommitCommandBuilder } from "../../../../src/query/builders/commit";
import { RollbackCommandBuilder } from "../../../../src/query/builders/rollback";

describe(`Transaction commands`, () => {
	describe(`BEGIN command`, () => {
		function doTest(builder: BeginCommandBuilder, expectedSql: string) {
			const actual = builder.finalise().toSql({});

			// Verify
			const expected: GeneratedQuery = {
				sql: expectedSql,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		}

		it(`outputs command without extras`, async () => {
			doTest(begin(), `BEGIN`);
		});

		it(`outputs command with isolation level`, async () => {
			doTest(
				begin().isolationLevel(TransactionIsolationLevel.Serializable),
				`BEGIN ISOLATION LEVEL SERIALIZABLE`
			);
		});

		it(`outputs command with read mode`, async () => {
			doTest(
				begin().readMode(TransactionReadMode.ReadWrite),
				`BEGIN READ WRITE`
			);
		});

		it(`outputs command with deferrable, explicitly set to true`, async () => {
			doTest(begin().deferrable(true), `BEGIN DEFERRABLE`);
		});

		it(`outputs command with not deferrable`, async () => {
			doTest(begin().deferrable(false), `BEGIN NOT DEFERRABLE`);
		});

		it(`outputs command, unsetting each option`, async () => {
			doTest(
				begin()
					.isolationLevel(TransactionIsolationLevel.ReadUncommitted)
					.isolationLevel(null)
					.readMode(TransactionReadMode.ReadOnly)
					.readMode(null)
					.deferrable(true)
					.deferrable(null),
				`BEGIN`
			);
		});

		it(`outputs command extras without duplicating items, in a consistent order`, async () => {
			doTest(
				begin()
					.deferrable(true)
					.isolationLevel(TransactionIsolationLevel.RepeatableRead)
					.deferrable(false)
					.isolationLevel(TransactionIsolationLevel.ReadCommitted)
					.readMode(TransactionReadMode.ReadOnly),
				`BEGIN ISOLATION LEVEL READ COMMITTED READ ONLY NOT DEFERRABLE`
			);
		});
	});

	describe(`COMMIT command`, () => {
		function doTest(builder: CommitCommandBuilder, expectedSql: string) {
			const actual = builder.finalise().toSql({});

			// Verify
			const expected: GeneratedQuery = {
				sql: expectedSql,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		}

		it(`outputs command without extras`, async () => {
			doTest(commit(), `COMMIT`);
		});

		it(`outputs command with chain`, async () => {
			doTest(commit().andChain(), `COMMIT AND CHAIN`);
		});

		it(`outputs command with no chain`, async () => {
			doTest(commit().andChain(false), `COMMIT AND NO CHAIN`);
		});

		it(`outputs command with explicit chain`, async () => {
			doTest(commit().andChain(true), `COMMIT AND CHAIN`);
		});

		it(`outputs command unsetting chain`, async () => {
			doTest(commit().andChain(true).andChain(null), `COMMIT`);
		});
	});

	xdescribe(`RELEASE SAVEPOINT command`, () => {
		xit(`produces expected SQL`, async () => {});
	});

	describe(`ROLLBACK command`, () => {
		function doTest(builder: RollbackCommandBuilder, expectedSql: string) {
			const actual = builder.finalise().toSql({});

			// Verify
			const expected: GeneratedQuery = {
				sql: expectedSql,
				parameters: [],
			};
			assert.deepEqual(actual, expected);
		}

		it(`outputs command without extras`, async () => {
			doTest(rollback(), `ROLLBACK`);
		});

		it(`outputs command with chain`, async () => {
			doTest(rollback().andChain(), `ROLLBACK AND CHAIN`);
		});

		it(`outputs command with no chain`, async () => {
			doTest(rollback().andChain(false), `ROLLBACK AND NO CHAIN`);
		});

		it(`outputs command with explicit chain`, async () => {
			doTest(rollback().andChain(true), `ROLLBACK AND CHAIN`);
		});

		it(`outputs command unsetting chain`, async () => {
			doTest(rollback().andChain(true).andChain(null), `ROLLBACK`);
		});
	});

	xdescribe(`ROLLBACK TO SAVEPOINT command`, () => {
		xit(`produces expected SQL`, async () => {});
	});

	xdescribe(`SAVEPOINT command`, () => {
		xit(`produces expected SQL`, async () => {});
	});

	xdescribe(`SET SESSION CHARACTERISTICS AS TRANSACTION command`, () => {
		xit(`produces expected SQL`, async () => {});
	});

	xdescribe(`SET TRANSACTION command`, () => {
		xit(`produces expected SQL`, async () => {});
	});

	xdescribe(`SET TRANSACTION SNAPSHOT command`, () => {
		xit(`produces expected SQL`, async () => {});
	});

	// TODO: support PREPARE TRANSACTION, COMMIT PREPARED, and ROLLBACK PREPARED
});
