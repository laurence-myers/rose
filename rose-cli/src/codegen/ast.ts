export enum NodeType {
	ArrowFunctionExpression,
	Body,
	Class,
	ClassConstructor,
	ClassConstructorParameterNode,
	ClassProperty,
	Comment,
	FunctionCall,
	FunctionExpression,
	GroupedExpression,
	Identifier,
	Import,
	Interface,
	InterfaceProperty,
	Literal,
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
	parameters: ClassConstructorParameterNode[];
	body: BodyNode;
}

export interface ClassConstructorParameterNode {
	type: NodeType.ClassConstructorParameterNode;
	name: string;
	annotation?: TypeAnnotationNode;
	optional?: boolean;
	default_?: ExpressionNode;
	visibility?: 'public' | 'protected' | 'private' | null;
	readonly?: boolean;
}

export interface ClassPropertyNode {
	type: NodeType.ClassProperty;
	name: string;
	annotation?: TypeAnnotationNode;
	optional?: boolean;
	expression?: ExpressionNode
	visibility?: 'public' | 'protected' | 'private' | null;
	readonly?: boolean;
}

export interface ClassNode {
	type: NodeType.Class;
	name: string;
	exported?: boolean;
	extends?: IdentifierNode[];
	implements?: IdentifierNode[];
	properties: ClassPropertyNode[];
	//methods: ClassMethodNode[]; TODO
	constructor_?: ClassConstructorNode;
}

export interface CommentNode {
	type: NodeType.Comment;
	commentType: 'line' | 'block';
	text: string;
}

export type ExpressionNode = ArrowFunctionExpressionNode | FunctionCallNode | FunctionExpressionNode | ObjectNode | PropertyLookupNode | GroupedExpressionNode;

export interface FunctionCallNode {
	type: NodeType.FunctionCall;
	identifier: ExpressionNode | IdentifierNode;
	arguments_: Array<ExpressionNode | IdentifierNode | LiteralNode>;
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
	namedItems?: NamedImportNode[];
	from: string;
}

export interface InterfacePropertyNode {
	type: NodeType.InterfaceProperty;
	name: string;
	annotation: TypeAnnotationNode;
	optional?: boolean;
}

export interface InterfaceNode {
	type: NodeType.Interface;
	name: string;
	extends_?: string[];
	properties: InterfacePropertyNode[];
	exported?: boolean;
}

export interface LiteralNode {
	type: NodeType.Literal;
	value: string;
}

export interface ModuleNode {
	type: NodeType.Module;
	header: CommentNode[];
	imports: ImportNode[];
	body: BodyNode;
}

export interface NamedImportNode {
	type: NodeType.NamedImport;
	name: string;
	alias?: string;
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
	statement: ClassNode | CommentNode | InterfaceNode | FunctionCallNode | FunctionExpressionNode | ReturnNode | VariableDeclarationNode;
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
	| BodyNode
	| ClassConstructorNode
	| ClassConstructorParameterNode
	| ClassNode
	| ClassPropertyNode
	| CommentNode
	| ExpressionNode
	| FunctionCallNode
	| FunctionExpressionNode
	| GroupedExpressionNode
	| IdentifierNode
	| ImportNode
	| InterfaceNode
	| InterfacePropertyNode
	| LiteralNode
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
