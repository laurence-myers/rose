export class RoseError extends Error {}

export class InvalidQuerySelectorError extends RoseError {}

export class InvalidInsertError extends RoseError {}

export class InvalidUpdateError extends RoseError {}

export class MissingDependencyError extends RoseError {}

export class MissingKeyError extends RoseError {}

export class NotEnoughExpressionsError extends RoseError {}

export class RowMappingError extends RoseError {}

export class UnrecognisedColumnError extends RoseError {}

export class UnsupportedOperationError extends RoseError {}
