import vuetify from 'eslint-config-vuetify';
import { globalIgnores } from 'eslint/config';

export default vuetify(globalIgnores(['src-tauri/']), [{
  rules: {
    '@stylistic/semi': [2, 'always'],
    '@stylistic/semi-spacing': [2, { after: true, before: false }],
  },
}]);
