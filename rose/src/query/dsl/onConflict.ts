import { OnConflictDoNothingBuilder, OnConflictDoUpdateInitialBuilder } from "../builders/onConflict";
import { OnConflictTargetIndexNode } from "../ast";

export function doNothing() {
	return new OnConflictDoNothingBuilder();
}

export function doUpdate() {
	return new OnConflictDoUpdateInitialBuilder();
}

export function targetIndex(index: OnConflictTargetIndexNode['identifier'], options?: Pick<OnConflictTargetIndexNode, 'collation' | 'opclass'>): OnConflictTargetIndexNode {
	return {
		type: "onConflictTargetIndexNode",
		identifier: index,
		...options
	};
}
