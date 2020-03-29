import {
	ArrowFunctionExpressionNode,
	BodyNode,
	FunctionCallNode,
	FunctionExpressionNode,
	GroupedExpressionNode,
	IdentifierNode,
	InterfaceNode,
	InterfacePropertyNode,
	ModuleNode,
	NodeType,
	ObjectNode,
	ObjectPropertyNode,
	ParameterNode,
	PropertyLookupNode,
	ReturnNode,
	StatementNode,
	TypeAnnotationNode,
	VariableDeclarationNode
} from "./ast";

export function arrowFunc(parameters: ArrowFunctionExpressionNode['parameters'], body: ArrowFunctionExpressionNode['body']): ArrowFunctionExpressionNode {
	return {
		type: NodeType.ArrowFunctionExpression,
		parameters,
		body
	};
}

export function anno(annotation: TypeAnnotationNode['annotation']): TypeAnnotationNode {
	return {
		type: NodeType.TypeAnnotation,
		annotation
	};
}

export function body(statements: BodyNode['statements']): BodyNode {
	return {
		type: NodeType.Body,
		statements
	};
}

export function funcCall(identifier: FunctionCallNode['identifier'], arguments_: FunctionCallNode['arguments_']): FunctionCallNode {
	return {
		type: NodeType.FunctionCall,
		identifier,
		arguments_
	};
}

export function funcExpr(parameters: FunctionExpressionNode['parameters'], body: FunctionExpressionNode['body'], name?: FunctionExpressionNode['name']): FunctionExpressionNode {
	return {
		type: NodeType.FunctionExpression,
		parameters,
		body,
		name,
	};
}

export function gexpr(expression: GroupedExpressionNode['expression']): GroupedExpressionNode {
	return {
		type: NodeType.GroupedExpression,
		expression,
	};
}

export function id(name: InterfaceNode['name']): IdentifierNode {
	return {
		type: NodeType.Identifier,
		name
	};
}

export function iface(name: InterfaceNode['name'], properties: InterfaceNode['properties'], extends_?: InterfaceNode['extends_']): InterfaceNode {
	return {
		type: NodeType.Interface,
		name,
		properties,
		extends_
	};
}

export function ifaceProp(name: InterfacePropertyNode['name'], annotation: InterfacePropertyNode['annotation']): InterfacePropertyNode {
	return {
		type: NodeType.InterfaceProperty,
		name,
		annotation
	};
}

export function modl(imports: ModuleNode['imports'], body: ModuleNode['body']): ModuleNode {
	return {
		type: NodeType.Module,
		imports,
		body
	};
}

export function obj(properties: ObjectNode['properties']): ObjectNode {
	return {
		type: NodeType.Object,
		properties,
	};
}

export function objProp(name: ObjectPropertyNode['name'], expression: ObjectPropertyNode['expression']): ObjectPropertyNode {
	return {
		type: NodeType.ObjectProperty,
		name,
		expression
	};
}

export function param(name: ParameterNode['name'], annotation?: ParameterNode['annotation'], optional?: ParameterNode['optional'], default_?: ParameterNode['default_']): ParameterNode {
	return {
		type: NodeType.Parameter,
		name,
		annotation,
		optional,
		default_
	};
}

export function propLookup(parent: PropertyLookupNode['parent'], child: PropertyLookupNode['child'], ...grandChildren: PropertyLookupNode['child'][]): PropertyLookupNode {
	const node: PropertyLookupNode = {
		type: NodeType.PropertyLookup,
		parent,
		child,
	};
	if (grandChildren && grandChildren.length > 0) {
		return propLookup(node, grandChildren[0]);
	} else {
		return node;
	}
}

export function ret(expression?: ReturnNode['expression']): ReturnNode {
	return {
		type: NodeType.Return,
		expression
	};
}

export function stmt(statement: StatementNode['statement']): StatementNode {
	return {
		type: NodeType.Statement,
		statement
	};
}

export function varDecl(
	variableType: VariableDeclarationNode['variableType'],
	name: VariableDeclarationNode['name'],
	expression?: VariableDeclarationNode['expression'],
	exported?: VariableDeclarationNode['exported']
): VariableDeclarationNode {
	return {
		type: NodeType.VariableDeclaration,
		variableType,
		name,
		expression,
		exported
	};
}
