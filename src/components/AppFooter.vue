<template>
  <v-footer
    app
    height="40"
  >
    <a
      v-for="item in items"
      :key="item.title"
      class="d-inline-block mx-2 social-link"
      :href="item.href"
      rel="noopener noreferrer"
      target="_blank"
      :title="item.title"
    >
      <v-icon
        :icon="item.icon"
        :size="item.icon === '$vuetify' ? 24 : 16"
      />
    </a>

    <div
      class="text-caption text-disabled"
      style="position: absolute; right: 16px;"
    >
      v{{ version }} &copy; 2025-{{ (new Date()).getFullYear() }} <span class="d-none d-sm-inline-block">mike-boddin</span>
      —
      <a
        class="text-decoration-none on-surface"
        href="https://github.com/mike-boddin/rdp-connector/blob/main/LICENSE"
        rel="noopener noreferrer"
        target="_blank"
      >
        MIT License
      </a>
    </div>
  </v-footer>
</template>

<script setup lang="ts">
  import { getVersion } from '@tauri-apps/api/app';
  import { log } from '@/types/logger.ts';

  onMounted(async () => {
    version.value = await getVersion();
    log('version', version);
  });

  const version = ref('');

  const items = [
    {
      title: 'RDP Connector GitHub',
      icon: `mdi-github`,
      href: 'https://github.com/mike-boddin/rdp-connector',
    }, {
      title: 'tauri.app',
      icon: `mdi-language-rust`,
      href: 'https://tauri.app/',
    },
  ];
</script>

<style scoped lang="sass">
  .social-link :deep(.v-icon)
    color: rgba(var(--v-theme-on-background), var(--v-disabled-opacity))
    text-decoration: none
    transition: .2s ease-in-out

    &:hover
      color: rgba(25, 118, 210, 1)
</style>
