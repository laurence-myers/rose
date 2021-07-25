module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "unused-imports"],
	parserOptions: {
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		project: "tsconfig.json",
		sourceType: "module", // Allows for the use of imports
	},
	extends: [
		//     'eslint:recommended',
		//     'plugin:@typescript-eslint/eslint-recommended',
		//     'plugin:@typescript-eslint/recommended',
		"prettier",
	],
	rules: {
		"@typescript-eslint/no-for-in-array": "error",
		"unused-imports/no-unused-imports-ts": "warn",
	},
};
