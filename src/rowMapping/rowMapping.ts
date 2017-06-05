export function mapRowToClass<TDataClass>(clz : { new() : TDataClass }, row : any) : TDataClass {
	const output = new clz();
	for (const key of Object.keys(row)) {
		(<any> output)[key] = row[key];
		// TODO: verify that the key exists in the data class definition
		// TODO: support nested queries
		// TODO: support expressions / function results
	}
	return output;
}

export function mapRowsToClass<TDataClass>(clz : { new() : TDataClass }, rows : any[]) : TDataClass[] {
	return rows.map((row) => mapRowToClass(clz, row));
}
