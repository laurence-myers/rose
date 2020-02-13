module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'unused-imports'
    ],
    parserOptions:  {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        project: 'tsconfig.json',
        sourceType: 'module', // Allows for the use of imports
    },
    // extends: [
    //     'eslint:recommended',
    //     'plugin:@typescript-eslint/eslint-recommended',
    //     'plugin:@typescript-eslint/recommended',
    // ],
    rules: {
        '@typescript-eslint/type-annotation-spacing': 'warn',
        '@typescript-eslint/no-for-in-array': 'error',
        'no-multiple-empty-lines': 'warn',
        'no-multi-spaces': 'warn',
        'object-curly-spacing': [
            'warn',
            'always'
        ],
        'template-curly-spacing': [
            'warn',
            'always'
        ],
        'unused-imports/no-unused-imports-ts': 'warn',
    }
};
