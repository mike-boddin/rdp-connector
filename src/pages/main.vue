<template>
  <Suspense>
    <RdpConnector />
    <template #fallback>
      <Loading />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
//
  import RdpConnector from '@/components/RdpConnector.vue';
</script>
