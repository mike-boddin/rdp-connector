import { withBase } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';

export default {
  extends: DefaultTheme,
  Layout () {
    return h(DefaultTheme.Layout, null, {
      '_sidebar-nav-before': () => h('div', { style: 'padding: 32px; display: flex; justify-content: left;' }, [
        h('img', { src: withBase('/assets/rdp-connector-icon.svg'), style: 'width: 100px;' }),
      ]),
    });
  },
};
