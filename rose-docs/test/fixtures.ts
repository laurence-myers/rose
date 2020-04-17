// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function dummyClient<T>(rows: T[]) {
    return {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-unused-vars
        async query(_queryText: string, _values: never[]) {
            return {
                rows,
                command: ``,
                oid: 1,
                rowCount: rows.length,
                fields: []
            };
        }
    };
}
