import {
	ArrowFunctionExpressionNode,
	BodyNode,
	CodegenAstNode,
	FunctionCallNode,
	FunctionExpressionNode,
	GroupedExpressionNode,
	IdentifierNode,
	ImportNode,
	InterfaceNode,
	InterfacePropertyNode,
	ModuleNode,
	NamedImportNode,
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
import { assertNever } from "../lang";
import { isArray } from "util";

export class CodegenAstWalker {
	protected sb: string = '';

	constructor() {
	}

	walk(moduleNode: ModuleNode): string {
		this.walkNode(moduleNode);
		return this.sb;
	}

	protected walkNode(node: CodegenAstNode) {
		switch (node.type) {
			case NodeType.ArrowFunctionExpression:
				return this.walkArrowFunctionExpression(node);
			case NodeType.Body:
				return this.walkBody(node);
			// case NodeType.Class:
			// 	return this.walkClass(node);
			// case NodeType.ClassConstructor:
			// 	return this.walkClassConstructor(node);
			// case NodeType.ClassProperty:
			// 	return this.walkClassProperty(node);
			case NodeType.FunctionCall:
				return this.walkFunctionCall(node);
			case NodeType.FunctionExpression:
				return this.walkFunctionExpression(node);
			case NodeType.GroupedExpression:
				return this.walkGroupedExpression(node);
			case NodeType.Identifier:
				return this.walkIdentifier(node);
			case NodeType.Import:
				return this.walkImport(node);
			case NodeType.Interface:
				return this.walkInterface(node);
			case NodeType.InterfaceProperty:
				return this.walkInterfaceProperty(node);
			case NodeType.Module:
				return this.walkModule(node);
			case NodeType.NamedImport:
				return this.walkNamedImport(node);
			case NodeType.Object:
				return this.walkObject(node);
			case NodeType.ObjectProperty:
				return this.walkObjectProperty(node);
			case NodeType.Parameter:
				return this.walkParameter(node);
			case NodeType.PropertyLookup:
				return this.walkPropertyLookup(node);
			case NodeType.Return:
				return this.walkReturn(node);
			case NodeType.Statement:
				return this.walkStatement(node);
			case NodeType.TypeAnnotation:
				return this.walkTypeAnnotation(node);
			case NodeType.VariableDeclaration:
				return this.walkVariableDeclaration(node);
			default:
				return assertNever(node);
		}
	}

	protected walkNodes(nodes: CodegenAstNode[], seperator: string): void {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			this.walkNode(node);
			if (i < nodes.length - 1) {
				this.sb += seperator;
			}
		}
	}

	private walkArrowFunctionExpression(node: ArrowFunctionExpressionNode) {
		this.sb += '(';
		this.walkNodes(node.parameters, ', ');
		this.sb += ') => ';
		if (isArray(node.body)) {
			this.sb += '{\n';
			this.walkNodes(node.body as CodegenAstNode[], '\n');
			this.sb += '\n}';
		} else {
			this.walkNode(node.body as CodegenAstNode);
		}
	}

	private walkBody(node: BodyNode) {
		this.walkNodes(node.statements, '\n');
	}

	private walkFunctionCall(node: FunctionCallNode) {
		this.walkNode(node.identifier);
		this.sb += '(';
		this.walkNodes(node.arguments_, ', ');
		this.sb += ')';
	}

	private walkFunctionExpression(node: FunctionExpressionNode) {
		this.sb += 'function ';
		if (node.name) {
			this.sb += node.name;
		}
		this.sb += '(';
		this.walkNodes(node.parameters, ', ');
		this.sb += ') {\n';
		this.walkNodes(node.body, '\n');
		this.sb += '\n}';
	}

	protected walkGroupedExpression(node: GroupedExpressionNode) {
		this.sb += '(';
		this.walkNode(node.expression);
		this.sb += ')';
	}

	private walkIdentifier(node: IdentifierNode) {
		this.sb += node.name;
	}

	private walkImport(node: ImportNode) {
		throw new Error(`Not yet implemented`);
	}

	private walkInterface(node: InterfaceNode) {
		this.sb += 'interface ';
		this.sb += node.name;
		if (node.extends_ && node.extends_.length > 0) {
			this.sb += node.extends_.join(', ');
		}
		this.sb += ' { ';
		this.walkNodes(node.properties, ' ');
		this.sb += ' }';
	}

	private walkInterfaceProperty(node: InterfacePropertyNode) {
		this.sb += node.name;
		this.sb += ': ';
		this.walkNode(node.annotation);
		this.sb += ';';
	}

	private walkModule(node: ModuleNode) {
		// this.walkNodes(node.imports);
		this.walkNode(node.body);
	}

	private walkNamedImport(node: NamedImportNode) {
		throw new Error(`Not yet implemented`);
	}

	private walkObject(node: ObjectNode) {
		this.sb += '{ ';
		this.walkNodes(node.properties, ', ');
		this.sb += ' }';
	}

	private walkObjectProperty(node: ObjectPropertyNode) {
		this.sb += node.name;
		this.sb += ': ';
		this.walkNode(node.expression);
	}

	private walkParameter(node: ParameterNode) {
		this.sb += node.name;
		if (node.optional) {
			this.sb += '?';
		}
		if (node.annotation) {
			this.sb += ': ';
			this.walkNode(node.annotation);
		}
		if (node.default_) {
			this.sb += ' = ';
			this.walkNode(node.default_);
		}
	}

	private walkPropertyLookup(node: PropertyLookupNode) {
		this.walkNode(node.parent);
		this.sb += '.';
		this.sb += node.child;
	}

	private walkReturn(node: ReturnNode) {
		this.sb += 'return';
		if (node.expression) {
			this.sb += ' ';
			this.walkNode(node.expression);
		}
	}

	private walkStatement(node: StatementNode) {
		this.walkNode(node.statement);
		switch (node.statement.type) {
			case NodeType.FunctionExpression:
			case NodeType.Interface: // TODO: omit semicolon for type declarations
				break;
			default:
				this.sb += ';';
				break;
		}
	}

	private walkTypeAnnotation(node: TypeAnnotationNode) {
		this.sb += node.annotation;
	}

	private walkVariableDeclaration(node: VariableDeclarationNode) {
		if (node.exported) {
			this.sb += 'export ';
		}
		this.sb += node.variableType;
		this.sb += ' ';
		this.sb += node.name;
		if (node.expression) {
			this.sb += ' = ';
			this.walkNode(node.expression);
		}
	}
}
