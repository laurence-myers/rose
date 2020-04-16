import { createFunctionNode } from "../common/helpers";
import { FunctionExpressionNode, ParameterOrValueExpressionNode } from "../../../ast";

/**
 * ASCII code of the first character of the argument. For UTF8 returns the Unicode code point of the character. For other multibyte encodings, the argument must be an ASCII character.
 */
export function ascii(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('ascii', string);
}

/**
 * Remove the longest string consisting only of characters in characters (a space by default) from the start and end of string
 */
export function btrim(string: ParameterOrValueExpressionNode, characters? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (characters !== undefined) {
		return createFunctionNode('btrim', string, characters);
	} else {
		return createFunctionNode('btrim', string);
	}
}

/**
 * Character with the given code. For UTF8 the argument is treated as a Unicode code point. For other multibyte encodings the argument must designate an ASCII character. The NULL (0) character is not allowed because text data types cannot store such bytes.
 */
export function chr(int: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('chr', int);
}

/**
 * Convert string to dest_encoding. The original encoding is specified by src_encoding. The string must be valid in this encoding. Conversions can be defined by CREATE CONVERSION. Also there are some predefined conversions. See Table 9-8 for available conversions.
 */
export function convert(string: ParameterOrValueExpressionNode, src_encoding: ParameterOrValueExpressionNode, dest_encoding: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('convert', string, src_encoding, dest_encoding);
}

/**
 * Convert string to the database encoding. The original encoding is specified by src_encoding. The string must be valid in this encoding.
 */
export function convert_from(string: ParameterOrValueExpressionNode, src_encoding: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('convert_from', string, src_encoding);
}

/**
 * Convert string to dest_encoding.
 */
export function convert_to(string: ParameterOrValueExpressionNode, dest_encoding: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('convert_to', string, dest_encoding);
}

/**
 * Decode binary data from textual representation in string. Options for format are same as in encode.
 */
export function decode(string: ParameterOrValueExpressionNode, format: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('decode', string, format);
}

/**
 * Encode binary data into a textual representation. Supported formats are: base64, hex, escape. escape converts zero bytes and high-bit-set bytes to octal sequences (\nnn) and doubles backslashes.
 */
export function encode(data: ParameterOrValueExpressionNode, format: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('encode', data, format);
}

/**
 * Convert the first letter of each word to upper case and the rest to lower case. Words are sequences of alphanumeric characters separated by non-alphanumeric characters.
 */
export function initcap(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('initcap', string);
}

/**
 * Number of characters in string
 * or
 * Number of characters in string in the given encoding. The string must be valid in this encoding.
 */
export function length(string: ParameterOrValueExpressionNode, encoding? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (encoding !== undefined) {
		return createFunctionNode('length', string, encoding);
	} else {
		return createFunctionNode('length', string);
	}
}

/**
 * Fill up the string to length length by prepending the characters fill (a space by default). If the string is already longer than length then it is truncated (on the right).
 */
export function lpad(string: ParameterOrValueExpressionNode, length: ParameterOrValueExpressionNode, fill? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (fill !== undefined) {
		return createFunctionNode('lpad', string, length, fill);
	} else {
		return createFunctionNode('lpad', string, length);
	}
}

/**
 * Remove the longest string containing only characters from characters (a space by default) from the start of string
 */
export function ltrim(string: ParameterOrValueExpressionNode, characters? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (characters !== undefined) {
		return createFunctionNode('ltrim', string, characters);
	} else {
		return createFunctionNode('ltrim', string);
	}
}

/**
 * Calculates the MD5 hash of string, returning the result in hexadecimal
 */
export function md5(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('md5', string);
}

/**
 * Current client encoding name
 */
export function pg_client_encoding(): FunctionExpressionNode {
	return createFunctionNode('pg_client_encoding');
}

/**
 * Return the given string suitably quoted to be used as an identifier in an SQL statement string. Quotes are added only if necessary (i.e., if the string contains non-identifier characters or would be case-folded). Embedded quotes are properly doubled. See also Example 39-1.
 */
export function quote_ident(string: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('quote_ident', string);
}

/**
 * Return the given string suitably quoted to be used as a string literal in an SQL statement string. Embedded single-quotes and backslashes are properly doubled. Note that quote_literal returns null on null input; if the argument might be null, quote_nullable is often more suitable. See also Example 39-1.
 * or
 * Coerce the given value to text and then quote it as a literal. Embedded single-quotes and backslashes are properly doubled.
 */
export function quote_literal(stringOrValue: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('quote_literal', stringOrValue);
}

/**
 * Return the given string suitably quoted to be used as a string literal in an SQL statement string; or, if the argument is null, return NULL. Embedded single-quotes and backslashes are properly doubled. See also Example 39-1.
 * or
 * Coerce the given value to text and then quote it as a literal; or, if the argument is null, return NULL. Embedded single-quotes and backslashes are properly doubled.
 */
export function quote_nullable(stringOrValue: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('quote_nullable', stringOrValue);
}

/**
 * Return all captured substrings resulting from matching a POSIX regular expression against the string. See Section 9.7.3 for more information.
 */
export function regexp_matches(string: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, flags? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (flags !== undefined) {
		return createFunctionNode('regexp_matches', string, pattern, flags);
	} else {
		return createFunctionNode('regexp_matches', string, pattern);
	}
}

/**
 * Replace substring(s) matching a POSIX regular expression. See Section 9.7.3 for more information.
 */
export function regexp_replace(string: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, replacement: ParameterOrValueExpressionNode, flags? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (flags !== undefined) {
		return createFunctionNode('regexp_replace', string, pattern, replacement, flags);
	} else {
		return createFunctionNode('regexp_replace', string, pattern);
	}

}

/**
 * Split string using a POSIX regular expression as the delimiter. See Section 9.7.3 for more information.
 */
export function regexp_split_to_array(string: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, flags? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (flags !== undefined) {
		return createFunctionNode('regexp_split_to_array', string, pattern, flags);
	} else {
		return createFunctionNode('regexp_split_to_array', string, pattern);
	}
}

/**
 * Split string using a POSIX regular expression as the delimiter. See Section 9.7.3 for more information.
 */
export function regexp_split_to_table(string: ParameterOrValueExpressionNode, pattern: ParameterOrValueExpressionNode, flags? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (flags !== undefined) {
		return createFunctionNode('regexp_split_to_table', string, pattern, flags);
	} else {
		return createFunctionNode('regexp_split_to_table', string, pattern);
	}
}

/**
 * Repeat string the specified number of times
 */
export function repeat(string: ParameterOrValueExpressionNode, number: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('repeat', string, number);
}

/**
 * Replace all occurrences in string of substring from with substring to
 */
export function replace(string: ParameterOrValueExpressionNode, from: ParameterOrValueExpressionNode, to: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('replace', string, from, to);
}

/**
 * Fill up the string to length length by appending the characters fill (a space by default). If the string is already longer than length then it is truncated.
 */
export function rpad(string: ParameterOrValueExpressionNode, length: ParameterOrValueExpressionNode, fill? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (fill !== undefined) {
		return createFunctionNode('rpad', string, length, fill);
	} else {
		return createFunctionNode('rpad', string, length);
	}
}

/**
 * Remove the longest string containing only characters from characters (a space by default) from the end of string
 */
export function rtrim(string: ParameterOrValueExpressionNode, characters? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (characters !== undefined) {
		return createFunctionNode('rtrim', string, characters);
	} else {
		return createFunctionNode('rtrim', string);
	}
}

/**
 * Split string on delimiter and return the given field (counting from one)
 */
export function split_part(string: ParameterOrValueExpressionNode, delimiter: ParameterOrValueExpressionNode, field: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('split_part', string, delimiter, field);
}

/**
 * Location of specified substring (same as position(substring in string), but note the reversed argument order)
 */
export function strpos(string: ParameterOrValueExpressionNode, substring: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('strpos', string, substring);
}

/**
 * Extract substring (same as substring(string from from for count))
 */
export function substr(string: ParameterOrValueExpressionNode, from: ParameterOrValueExpressionNode, count? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (count !== undefined) {
		return createFunctionNode('substr', string, from, count);
	} else {
		return createFunctionNode('substr', string, from);
	}
}

/**
 * Convert string to ASCII from another encoding (only supports conversion from LATIN1, LATIN2, LATIN9, and WIN1250 encodings)
 */
export function to_ascii(string: ParameterOrValueExpressionNode, encoding? : ParameterOrValueExpressionNode): FunctionExpressionNode {
	if (encoding !== undefined) {
		return createFunctionNode('to_ascii', string, encoding);
	} else {
		return createFunctionNode('to_ascii', string);
	}
}

/**
 * Convert number to its equivalent hexadecimal representation
 */
export function to_hex(number: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('to_hex', number);
}

/**
 * Any character in string that matches a character in the from set is replaced by the corresponding character in the to set
 */
export function translate(string: ParameterOrValueExpressionNode, from: ParameterOrValueExpressionNode, to: ParameterOrValueExpressionNode): FunctionExpressionNode {
	return createFunctionNode('translate', string, from, to);
}
