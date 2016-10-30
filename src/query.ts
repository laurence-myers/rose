import "reflect-metadata";

// interface Criteria {
//
// }
//
// interface Users {
// 	id : number;
// 	locationId : number;
// }

// interface UsersCriteria extends Criteria {
// 	id? : number;
// 	locationId? : number;
// }
//
// interface Locations {
// 	id : number;
// }
//
// interface LocationsCriteria extends Criteria {
// 	id? : number;
// }

// class TableMetamodel<T extends Criteria> {
// 	[key : string] :
// }

interface ColumnMetamodel<T> {
	name : string;
	type : Function;
	colType? : T;
}

const UsersMetamodel = Object.freeze({
	id : {
		name: "id",
		type: Number
	} as ColumnMetamodel<{ id : number }>,
	locationId : {
		name: "locationId",
		type: Number
	} as ColumnMetamodel<{ locationId : number }>,
});

// const LocationsMetamodel = Object.freeze({
// 	id : {
// 		name: "id",
// 		type: Number
// 	}
// });


function from<T>(tables : T) {
	return new TableQuery<T>(tables);
}


// export function Column<T>(metamodel : ColumnMetamodel<T>) : PropertyDecorator {
// 	return function (target : Object, propertyKey : string | symbol) {
// 		// target['_metadata'] = ;
// 	}
// }
//
// class QuerySelect {
//
// 	id : number;
// }

class TableQuery<T> {
	constructor(private tables : T) {

	}

	private addColumnType<T, U>(input : T, column : U) : T & U {
		return <any> input || column; // the operator is meaningless, this is just to satisfy the compiler. Should always return "input".
	}

	select<U>(selectFn : (tables : T) => ColumnMetamodel<any>[]) : U {
		const columns = selectFn(this.tables);
		let result = {};
		for (let column of columns) {
			result = this.addColumnType(result, column.colType);
		}
		return <U>result;
	}

	// join() {
	//
	// }

}

const result = from({
	users: UsersMetamodel,
	// locations: LocationsMetamodel
}).select((t) => {
	return [t.users.id];
});

console.log(result.id);