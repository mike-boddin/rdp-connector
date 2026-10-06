import vuetify from 'eslint-config-vuetify';
import { globalIgnores } from 'eslint/config';

export default vuetify(globalIgnores(['src-tauri/']), [{
  rules: {
    'unicorn/no-this-outside-of-class': 0, // Pinia option stores use `this`
    '@stylistic/semi': [2, 'always'],
    '@stylistic/semi-spacing': [2, { after: true, before: false }],
  },
}]);
