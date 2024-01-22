// eslint-disable-next-line no-undef
module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  "settings": {
    "react": {
      "version": "detect",
    },
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
    },
    "ecmaVersion": "latest",
    "sourceType": "module",
  },
  "plugins": [
    "react",
    "@typescript-eslint",
  ],
  "ignorePatterns": [".eslintrc.js", "dist/**/*"],
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "varsIgnorePattern": "^_",
      "argsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_",
    }],
    // we have a lot of any to be compatible with Solid api, where they're also used
    "@typescript-eslint/no-explicit-any": "off",
    quotes: ["error", "double"],
    semi: ["error", "always", { "omitLastInOneLineBlock": true }],
    "comma-dangle": "off",
    "@typescript-eslint/comma-dangle": ["warn", "always-multiline"],
  },
};
