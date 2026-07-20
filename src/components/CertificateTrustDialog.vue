<template>
  <v-dialog v-model="rdpStore.showCertificateDialog" persistent width="600">
    <v-card>
      <v-card-title class="bg-warning text-white">
        <v-icon class="mr-2">mdi-shield-alert</v-icon>
        Certificate Trust Needed
      </v-card-title>

      <v-card-text class="pt-4">
        <p class="mb-4">The remote host's TLS certificate cannot be verified. Do you trust this certificate?</p>

        <v-textarea
          v-model="rdpStore.certificateDetails"
          auto-grow
          class="certificate-details-area"
          hide-details
          label="Certificate Details"
          readonly
          variant="outlined"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn color="error" variant="text" @click="rdpStore.respondToCertificateTrust('N')">Reject</v-btn>
        <v-btn color="warning" variant="text" @click="rdpStore.respondToCertificateTrust('T')">Trust Temporarily</v-btn>
        <v-btn color="primary" variant="text" @click="rdpStore.respondToCertificateTrust('Y')">Trust Always</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { useRdpConnectionStore } from '@/stores/rdp-connection.ts';

  const rdpStore = useRdpConnectionStore();
</script>

<style scoped>
.certificate-details-area :deep(textarea) {
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.2;
}
</style>
