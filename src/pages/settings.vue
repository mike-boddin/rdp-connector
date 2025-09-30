<script setup lang="ts">

</script>
<template>
  <Suspense>
    <SettingsOptions />
    <template #fallback>
      <Loading />
    </template>
  </Suspense>
</template>
