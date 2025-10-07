<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const usernameRules = [
  (v: string) => !!v || 'Uživatelské jméno je povinné'
];

const passwordRules = [
  (v: string) => !!v || 'Heslo je povinné'
];

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;

  try {
    await authStore.login({
      username: username.value,
      password: password.value
    });
  } catch (error: any) {
    errorMessage.value = error.message || 'Neplatné přihlašovací údaje';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="mt-5">
    <v-form @submit.prevent="handleSubmit">
      <v-text-field
        v-model="username"
        :rules="usernameRules"
        label="Uživatelské jméno"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-account-outline"
        class="mb-4"
        required
        autocomplete="username"
      ></v-text-field>

      <v-text-field
        v-model="password"
        :rules="passwordRules"
        label="Heslo"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        class="mb-2"
        required
        autocomplete="current-password"
      ></v-text-field>

      <div class="d-flex align-center justify-space-between mb-4">
        <v-checkbox
          v-model="rememberMe"
          label="Zapamatovat si mě"
          color="primary"
          hide-details
        ></v-checkbox>
        
        <a href="javascript:void(0)" class="text-primary text-decoration-none">
          Zapomenuté heslo?
        </a>
      </div>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-btn
        type="submit"
        color="primary"
        size="large"
        block
        :loading="loading"
        :disabled="loading || !username || !password"
      >
        Přihlásit se
      </v-btn>
    </v-form>

    <div class="text-center mt-6">
      <div class="text-caption text-medium-emphasis">
        Natural Protein CRM System
      </div>
      <div class="text-caption text-medium-emphasis mt-1">
        Powered by EspoCRM
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.v-input__prepend-inner) {
  padding-right: 8px;
}
</style>