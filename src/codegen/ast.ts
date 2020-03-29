export enum NodeType {
	ArrowFunctionExpression,
	Body,
	Class,
	ClassConstructor,
	ClassProperty,
	FunctionCall,
	FunctionExpression,
	GroupedExpression,
	Identifier,
	Import,
	Interface,
	InterfaceProperty,
	Module,
	NamedImport,
	Object,
	ObjectProperty,
	Parameter,
	PropertyLookup,
	Return,
	Statement,
	TypeAnnotation,
	VariableDeclaration,
}

export interface ArrowFunctionExpressionNode {
	type: NodeType.ArrowFunctionExpression;
	parameters: ParameterNode[];
	body: StatementNode[] | ExpressionNode;
}

export interface BodyNode {
	type: NodeType.Body;
	statements: StatementNode[];
}

export interface ClassConstructorNode {
	type: NodeType.ClassConstructor;
}

export interface ClassPropertyNode {
	type: NodeType.ClassProperty;
	name: string;
	annotation?: TypeAnnotationNode;
	expression?: ExpressionNode
}

export interface ClassNode {
	type: NodeType.Class;
	name: string;
	extends?: string[];
	implements?: string[];
	properties: ClassPropertyNode[];
	constructor?: ClassConstructorNode;
}

export type ExpressionNode = ArrowFunctionExpressionNode | FunctionCallNode | FunctionExpressionNode | ObjectNode | PropertyLookupNode | GroupedExpressionNode;

export interface FunctionCallNode {
	type: NodeType.FunctionCall;
	identifier: FunctionExpressionNode | FunctionCallNode | GroupedExpressionNode | PropertyLookupNode | IdentifierNode;
	arguments_: Array<ExpressionNode | IdentifierNode>;
}

export interface FunctionExpressionNode {
	type: NodeType.FunctionExpression;
	name?: string;
	parameters: ParameterNode[];
	body: StatementNode[];
}

export interface GroupedExpressionNode {
	type: NodeType.GroupedExpression;
	expression: ExpressionNode;
}

export interface IdentifierNode {
	type: NodeType.Identifier;
	name: string;
}

export interface ImportNode {
	type: NodeType.Import;
	importType: 'all' | 'default' | 'named';
	alias?: string;
	namedItems?: IdentifierNode[];
	from: string;
}

export interface InterfacePropertyNode {
	type: NodeType.InterfaceProperty;
	name: string;
	annotation: TypeAnnotationNode;
}

export interface InterfaceNode {
	type: NodeType.Interface;
	name: string;
	extends_?: string[];
	properties: InterfacePropertyNode[];
}

export interface ModuleNode {
	type: NodeType.Module;
	imports: ImportNode[];
	body: BodyNode;
}

export interface NamedImportNode {
	type: NodeType.NamedImport;
	name: string;
	alias: string;
}

export interface ObjectNode {
	type: NodeType.Object;
	properties: ObjectPropertyNode[];
}

export interface ObjectPropertyNode {
	type: NodeType.ObjectProperty;
	name: string;
	expression: ExpressionNode;
}

export interface ParameterNode {
	type: NodeType.Parameter;
	name: string;
	annotation?: TypeAnnotationNode;
	optional?: boolean;
	default_?: ExpressionNode;
}

export interface PropertyLookupNode {
	type: NodeType.PropertyLookup;
	parent: ExpressionNode | IdentifierNode;
	child: string;
}

export interface ReturnNode {
	type: NodeType.Return;
	expression?: ExpressionNode;
}

export interface StatementNode {
	type: NodeType.Statement;
	statement: InterfaceNode | FunctionCallNode | FunctionExpressionNode | ReturnNode | VariableDeclarationNode;
}

export interface TypeAnnotationNode {
	type: NodeType.TypeAnnotation;
	annotation: string;
}

export interface VariableDeclarationNode {
	type: NodeType.VariableDeclaration;
	variableType: 'var' | 'let' | 'const';
	name: string;
	expression?: ExpressionNode;
	exported?: boolean;
}

export type CodegenAstNode = (
	| ArrowFunctionExpressionNode
	// | ClassConstructorNode
	// | ClassPropertyNode
	// | ClassNode
	| BodyNode
	| ExpressionNode
	| FunctionCallNode
	| FunctionExpressionNode
	| GroupedExpressionNode
	| IdentifierNode
	| ImportNode
	| InterfacePropertyNode
	| InterfaceNode
	| ModuleNode
	| NamedImportNode
	| ObjectNode
	| ObjectPropertyNode
	| ParameterNode
	| PropertyLookupNode
	| ReturnNode
	| StatementNode
	| TypeAnnotationNode
	| VariableDeclarationNode
);
