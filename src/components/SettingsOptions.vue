<template>
  <v-container>
    <v-text-field v-model="rdpFile" label="Path to rdp(x) File" :type="'text'" @input="configChanged" />
    <v-text-field v-model="freerdpPath" label="Path to freerdp" :type="'text'" @input="configChanged" />
    <v-text-field v-model="username" label="username" :type="'text'" @input="configChanged" />
  </v-container>
</template>

<script setup lang="ts">
  import type { IConnectionConfig } from '@/types/connection-config.ts'
  import { Store } from '@tauri-apps/plugin-store'

  const store = await Store.load('settings1.json')
  const username = ref('hu')
  const freerdpPath = ref('ha')
  const rdpFile = ref('ho')
  let config: IConnectionConfig

  onMounted(async () => {
    console.log('on mounted settings')
    config = (await store.get('config')) || { rdpFile: '', freerdpPath: '', username: '' }
    console.log('loaded conf', config)
    username.value = config.username
    freerdpPath.value = config.freerdpPath
    rdpFile.value = config.rdpFile
  })

  async function configChanged () {
    if (!store) {
      return
    }
    config.username = username.value
    config.freerdpPath = freerdpPath.value
    config.rdpFile = rdpFile.value
    console.log('save store', config)
    await store.set('config', config)
    await store.save()
  }
</script>
