module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'unused-imports'
    ],
    parserOptions:  {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },
    // extends: [
    //     'eslint:recommended',
    //     'plugin:@typescript-eslint/eslint-recommended',
    //     'plugin:@typescript-eslint/recommended',
    // ],
    rules: {
        '@typescript-eslint/type-annotation-spacing': 1,
        'unused-imports/no-unused-imports-ts': 1,
        'object-curly-spacing': [
            1,
            'always'
        ],
        'template-curly-spacing': [
            1,
            'always'
        ]
    }
};
