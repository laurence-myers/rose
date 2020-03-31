import {
	ArrowFunctionExpressionNode,
	BodyNode,
	ClassConstructorNode,
	ClassConstructorParameterNode,
	ClassNode,
	ClassPropertyNode,
	CodegenAstNode,
	CommentNode,
	FunctionCallNode,
	FunctionExpressionNode,
	GroupedExpressionNode,
	IdentifierNode,
	ImportNode,
	InterfaceNode,
	InterfacePropertyNode,
	LiteralNode,
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
import { CodeGeneratorError } from "../errors";

enum Dent {
	In,
	Out,
	None
}

enum NodeSeperator {
	Space,
	Comma,
	Newline
}

class CodegenAstWalker {
	protected sb: string = '';
	protected indentation: number = 0;
	protected indentationString = '\t';

	constructor(
		protected readonly rootNode: CodegenAstNode
	) {
	}

	walk(): string {
		this.walkNode(this.rootNode);
		return this.sb;
	}

	private newline(dentation?: Dent) {
		this.sb += '\n';
		switch (dentation) {
			case Dent.In:
				this.indentation++;
				break;
			case Dent.Out:
				this.indentation--;
				break;
			case Dent.None:
				return;
			default:
				break;
		}
		for (let i = 0; i < this.indentation; i++) {
			this.sb += this.indentationString;
		}
	}

	protected walkNode(node: CodegenAstNode) {
		switch (node.type) {
			case NodeType.ArrowFunctionExpression:
				return this.walkArrowFunctionExpression(node);
			case NodeType.Body:
				return this.walkBody(node);
			case NodeType.Class:
				return this.walkClass(node);
			case NodeType.ClassConstructor:
				return this.walkClassConstructor(node);
			case NodeType.ClassConstructorParameterNode:
				return this.walkClassConstructorParameterNode(node);
			case NodeType.ClassProperty:
				return this.walkClassProperty(node);
			case NodeType.Comment:
				return this.walkComment(node);
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
			case NodeType.Literal:
				return this.walkLiteral(node);
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

	protected walkNodes(nodes: CodegenAstNode[], seperator: NodeSeperator): void {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			this.walkNode(node);
			if (i < nodes.length - 1) {
				switch (seperator) {
					case NodeSeperator.Space:
						this.sb += ' ';
						break;
					case NodeSeperator.Comma:
						this.sb += ', ';
						break;
					case NodeSeperator.Newline:
						this.newline();
						break;
					default:
						throw assertNever(seperator);
				}
			}
		}
	}

	private walkArrowFunctionExpression(node: ArrowFunctionExpressionNode) {
		this.sb += '(';
		this.walkNodes(node.parameters, NodeSeperator.Comma);
		this.sb += ') => ';
		if (isArray(node.body)) {
			this.sb += '{';
			this.newline(Dent.In);
			this.walkNodes(node.body as CodegenAstNode[], NodeSeperator.Newline);
			this.newline(Dent.Out);
			this.sb += '}';
		} else {
			this.walkNode(node.body as CodegenAstNode);
		}
	}

	private walkBody(node: BodyNode) {
		this.walkNodes(node.statements, NodeSeperator.Newline);
	}

	private walkClass(node: ClassNode) {
		if (node.exported) {
			this.sb += 'export ';
		}
		this.sb += 'class ';
		this.sb += node.name;
		if (node.extends) {
			this.sb += ' extends ';
			this.walkNodes(node.extends, NodeSeperator.Comma);
		}
		if (node.implements) {
			this.sb += ' implements ';
			this.walkNodes(node.implements, NodeSeperator.Comma);
		}
		this.sb += ' {';
		this.newline(Dent.In);
		this.walkNodes(node.properties, NodeSeperator.Newline);
		this.newline(Dent.None);
		if (node.constructor_) {
			this.newline();
			this.walkNode(node.constructor_);
		}
		this.newline(Dent.Out);
		this.sb += '}';
		this.newline();
	}

	private walkClassConstructor(node: ClassConstructorNode) {
		this.sb += 'constructor (';
		this.walkNodes(node.parameters, NodeSeperator.Comma);
		this.sb += ') {';
		this.newline(Dent.In);
		this.walkNode(node.body);
		this.newline(Dent.Out);
		this.sb += '}';
		this.newline(Dent.None);
	}

	private processCommonClassProperty(node: ClassConstructorParameterNode | ClassPropertyNode) {
		if (node.visibility) {
			this.sb += node.visibility;
			this.sb += ' ';
		}
		if (node.readonly) {
			this.sb += 'readonly';
			this.sb += ' ';
		}
		this.sb += node.name;
		if (node.optional) {
			this.sb += '?'
		}
		if (node.annotation) {
			this.walkNode(node.annotation);
		}
	}

	private walkClassConstructorParameterNode(node: ClassConstructorParameterNode) {
		this.processCommonClassProperty(node);
		if (node.default_) {
			this.sb += ' = ';
			this.walkNode(node.default_);
		}
	}

	private walkClassProperty(node: ClassPropertyNode) {
		this.processCommonClassProperty(node);
		if (node.expression) {
			this.sb += ' = ';
			this.walkNode(node.expression);
		}
		this.sb += ';';
	}

	private walkComment(node: CommentNode) {
		switch (node.commentType) {
			case "block":
				this.sb += '/* ';
				this.sb += node.text;
				this.sb += ' */';
				break;
			case "line":
				this.sb += '// ';
				this.sb += node.text;
				break;
			default:
				throw assertNever(node.commentType);
		}
	}

	private walkFunctionCall(node: FunctionCallNode) {
		this.walkNode(node.identifier);
		this.sb += '(';
		this.walkNodes(node.arguments_, NodeSeperator.Comma);
		this.sb += ')';
	}

	private walkFunctionExpression(node: FunctionExpressionNode) {
		this.sb += 'function ';
		if (node.name) {
			this.sb += node.name;
		}
		this.sb += '(';
		this.walkNodes(node.parameters, NodeSeperator.Comma);
		this.sb += ') {';
		this.newline(Dent.In);
		this.walkNodes(node.body, NodeSeperator.Newline);
		this.newline(Dent.Out);
		this.sb += '}';
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
		this.sb += 'import ';
		switch (node.importType) {
			case "all":
			case "default":
				if (!node.alias) {
					throw new CodeGeneratorError(`"all" or "default" imports must have an alias`);
				}
				if (node.importType === 'all') { // silly, but TS complains of fallthrough if we rely on switch/case
					this.sb += '* as ';
				}
				this.sb += node.alias;
				break;
			case "named":
				if (!node.namedItems || node.namedItems.length === 0) {
					throw new CodeGeneratorError(`"named" imports must have at least one named item`);
				}
				this.sb += '{ ';
				this.walkNodes(node.namedItems, NodeSeperator.Comma);
				this.sb += ' }';
				break;
			default:
				throw assertNever(node.importType);
		}
		this.sb += ' from \'';
		this.sb += node.from;
		this.sb += '\';';
	}

	private walkInterface(node: InterfaceNode) {
		if (node.exported) {
			this.sb += 'export ';
		}
		this.sb += 'interface ';
		this.sb += node.name;
		if (node.extends_ && node.extends_.length > 0) {
			this.sb += node.extends_.join(', ');
		}
		this.sb += ' {';
		this.newline(Dent.In);
		this.walkNodes(node.properties, NodeSeperator.Newline);
		this.newline(Dent.Out);
		this.sb += '}';
		this.newline(Dent.None);
	}

	private walkInterfaceProperty(node: InterfacePropertyNode) {
		this.sb += node.name;
		if (node.optional) {
			this.sb += '?';
		}
		this.walkNode(node.annotation);
		this.sb += ';';
	}

	private walkLiteral(node: LiteralNode) {
		this.sb += node.value;
	}

	private walkModule(node: ModuleNode) {
		if (node.header) {
			this.walkNode(node.header);
			this.newline();
		}
		this.walkNodes(node.imports, NodeSeperator.Newline);
		if (node.imports.length > 0) {
			this.newline();
			this.newline();
		}
		this.walkNode(node.body);
		this.newline();
	}

	private walkNamedImport(node: NamedImportNode) {
		this.sb += node.name;
		if (node.alias) {
			this.sb += ' as ';
			this.sb += node.alias;
		}
	}

	private walkObject(node: ObjectNode) {
		this.sb += '{';
		this.newline(Dent.In);
		this.walkNodes(node.properties, NodeSeperator.Newline);
		this.newline(Dent.Out);
		this.sb += '}';
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
			case NodeType.Class:
			case NodeType.Comment:
			case NodeType.FunctionExpression:
			case NodeType.Interface: // TODO: omit semicolon for type declarations
				break;
			default:
				this.sb += ';';
				break;
		}
	}

	private walkTypeAnnotation(node: TypeAnnotationNode) {
		this.sb += ': ';
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

export function astToString(node: CodegenAstNode) {
	const walker = new CodegenAstWalker(node);
	return walker.walk();
}
