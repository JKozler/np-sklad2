<!-- src/views/authentication/authForms/AuthLogin.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const email = ref('admin@naturalprotein.cz');
const password = ref('admin123');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const emailRules = [
  (v: string) => !!v || 'Email je povinný',
  (v: string) => /.+@.+\..+/.test(v) || 'Email musí být platný'
];

const passwordRules = [
  (v: string) => !!v || 'Heslo je povinné',
  (v: string) => v.length >= 6 || 'Heslo musí mít alespoň 6 znaků'
];

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;

  try {
    await authStore.login({
      email: email.value,
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
    <!-- Demo credentials info -->
    <v-alert type="info" variant="tonal" class="mb-4">
      <div class="text-subtitle-2">
        <strong>Demo přihlášení:</strong><br>
        Admin: admin@naturalprotein.cz / admin123<br>
        User: user@naturalprotein.cz / user123
      </div>
    </v-alert>

    <v-form @submit.prevent="handleSubmit">
      <v-text-field
        v-model="email"
        :rules="emailRules"
        label="Email"
        type="email"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-email-outline"
        class="mb-4"
        required
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
        :disabled="loading"
      >
        Přihlásit se
      </v-btn>
    </v-form>

    <!--<div class="text-center mt-4">
      <v-divider class="my-4"></v-divider>
      <span class="text-body-2 text-medium-emphasis">
        Nemáte účet?
        <router-link to="/register" class="text-primary text-decoration-none font-weight-medium">
          Zaregistrujte se
        </router-link>
      </span>
    </div>-->
  </div>
</template>

<style scoped>
:deep(.v-input__prepend-inner) {
  padding-right: 8px;
}
</style>