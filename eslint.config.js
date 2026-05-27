import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'src/app/v1/**', '**/*.spec.ts']
    },
    {
        files: ['**/*.ts'],
        extends: [
            js.configs.recommended, //
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended
        ],
        processor: angular.processInlineTemplates,
        rules: {
            'no-useless-escape': 'off',
            'no-control-regex': 'off',
            'no-prototype-builtins': 'warn',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-async-promise-executor': 'warn',
            'no-useless-assignment': 'off',

            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true
                }
            ],
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/ban-tslint-comment': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-this-alias': 'warn',
            '@typescript-eslint/class-literal-property-style': 'warn',

            '@angular-eslint/component-class-suffix': 'warn',
            '@angular-eslint/directive-class-suffix': 'warn',
            '@angular-eslint/no-output-on-prefix': 'warn',
            '@angular-eslint/prefer-standalone': 'warn',
            '@angular-eslint/no-output-rename': 'warn',
            '@angular-eslint/no-input-rename': 'warn',
            '@angular-eslint/no-output-native': 'warn'
        }
    },
    {
        files: ['**/*.html'],
        extends: [...angular.configs.templateRecommended],
        rules: {
            '@angular-eslint/template/no-negated-async': 'warn'
        }
    }
);
