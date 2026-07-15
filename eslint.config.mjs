import globals from 'globals'

import pluginJs from '@eslint/js'
import pluginStylistic from '@stylistic/eslint-plugin'
import pluginTs from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'

import dependencies from '@omnicajs/eslint-plugin-dependencies'

export default [
    {
        ignores: [
            'artifacts/**/*',
            'dist/**/*',
            'fixtures/*/dist/**/*',
            'fixtures/*/src/omnica-icons.d.ts',
            'fixtures/cli/src/generated/**/*',
            'generated/**/*',
            'showcase/.vitepress/.temp/**/*',
            'showcase/.vitepress/cache/**/*',
            'showcase/.vitepress/dist/**/*',
        ],
    },
    { files: ['**/*.{js,mjs,cjs,ts,vue}'] },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        plugins: {
            dependencies,
            '@stylistic': pluginStylistic,
        },
    },
    pluginJs.configs.recommended,
    ...pluginTs.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    ...pluginVueI18n.configs.recommended,
    {
        settings: {
            'vue-i18n': {
                localeDir: {
                    pattern: './showcase/i18n/locales/*.{json,json5,yaml,yml}',
                    localeKey: 'file',
                },
                messageSyntaxVersion: '^11.0.0',
            },
        },
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: { parser: pluginTs.parser },
        },
    },
    {
        files: ['**/*.{ts,vue}'],
        rules: {
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
                fixStyle: 'separate-type-imports',
                disallowTypeAnnotations: false,
            }],
        },
    },
    {
        files: ['**/*.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,vue}'],
        rules: {
            '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'off',
            '@intlify/vue-i18n/no-dynamic-keys': 'error',
            '@intlify/vue-i18n/no-missing-keys': 'error',
            '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
            '@intlify/vue-i18n/no-raw-text': ['error', {
                ignorePattern: '^[-–—~+#:()&=×%/\\d\\s\u00A0\n,.<>•x]+$',
                ignoreText: ['API', 'OmnicaJS', 'SVG', ''],
            }],

            '@stylistic/comma-dangle': ['error', {
                arrays: 'always-multiline',
                exports: 'always-multiline',
                functions: 'never',
                imports: 'always-multiline',
                objects: 'always-multiline',
            }],
            '@stylistic/generator-star-spacing': 'error',
            '@stylistic/indent': ['error', 4, {
                SwitchCase: 1,
            }],
            '@stylistic/no-multiple-empty-lines': ['error', {
                max: 1,
                maxBOF: 0,
                maxEOF: 1,
            }],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/operator-linebreak': ['error', 'before', {
                overrides: {
                    '=': 'after',
                },
            }],
            '@stylistic/padding-line-between-statements': ['error', {
                blankLine: 'always',
                next: 'return',
                prev: '*',
            }],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/semi': ['error', 'never'],

            'dependencies/import-style': ['error', {
                maxSingleLineLength: 90,
                maxSingleLineSpecifiers: 3,
            }],
            'dependencies/separate-type-imports': 'error',
            'dependencies/separate-type-partitions': 'error',
            'dependencies/sort-named-imports': ['error', {
                type: 'alphabetical',
                ignoreAlias: true,
            }],
            'dependencies/sort-imports': ['error', {
                type: 'alphabetical',
                imports: {
                    orderBy: 'alias',
                    splitDeclarations: true,
                },
                groups: [
                    'side-effect-style',
                    'side-effect',
                    [
                        'type-import',
                        'type-external',
                        'type-omnica',
                        'type-vue-components',
                        'type-internal',
                        'type-parent',
                        'type-sibling',
                        'type-index',
                    ],
                    'builtin',
                    'value-external',
                    'value-omnica',
                    'value-vue-components',
                    'value-internal',
                    ['value-parent', 'value-sibling'],
                    'index',
                    'ts-equals-import',
                    'unknown',
                ],
                customGroups: [{
                    groupName: 'type-omnica',
                    selector: 'type',
                    elementNamePattern: ['^@omnicajs/'],
                }, {
                    groupName: 'value-omnica',
                    elementNamePattern: ['^@omnicajs/'],
                }, {
                    groupName: 'type-vue-components',
                    selector: 'type',
                    elementNamePattern: ['\\.(svg|vue)$'],
                }, {
                    groupName: 'value-vue-components',
                    elementNamePattern: ['\\.(svg|vue)$'],
                }],
                newlinesInside: 1,
                partitions: {
                    orderBy: 'type-first',
                    splitBy: {
                        comments: false,
                        newlines: true,
                    },
                },
            }],

            '@typescript-eslint/naming-convention': 'off',
            '@typescript-eslint/no-unused-vars': 'error',

            'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
            'no-restricted-imports': ['error', {
                paths: [{
                    name: 'lodash',
                    message: 'Import a concrete lodash function instead.',
                }],
            }],
            'require-await': 'error',

            'vue/attribute-hyphenation': ['error', 'always', {
                ignore: ['viewBox'],
            }],
            'vue/attributes-order': 'error',
            'vue/html-closing-bracket-newline': ['error', {
                singleline: 'never',
                multiline: 'always',
            }],
            'vue/html-closing-bracket-spacing': 'error',
            'vue/html-end-tags': 'error',
            'vue/html-indent': ['error', 4, {
                alignAttributesVertically: true,
                attribute: 1,
                closeBracket: 0,
                ignores: [],
            }],
            'vue/html-quotes': 'error',
            'vue/html-self-closing': ['error', {
                html: {
                    void: 'never',
                    normal: 'always',
                    component: 'always',
                },
                svg: 'always',
                math: 'always',
            }],
            'vue/max-attributes-per-line': ['error', {
                singleline: 4,
                multiline: 1,
            }],
            'vue/mustache-interpolation-spacing': 'error',
            'vue/no-multi-spaces': 'error',
            'vue/padding-line-between-blocks': ['error', 'always'],
            'vue/this-in-template': 'error',
            'vue/v-bind-style': 'error',
            'vue/v-on-style': 'error',
        },
    },
]
