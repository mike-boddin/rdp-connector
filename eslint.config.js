import vuetify from 'eslint-config-vuetify'
import { globalIgnores } from 'eslint/config'

export default vuetify(globalIgnores(['src-tauri/']))
