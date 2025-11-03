<!-- src/views/utilities/settings/UserProfilePage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { userService } from '@/services/userService';
import type { User, UpdateUserData, ChangePasswordData } from '@/services/userService';

const page = ref({ title: 'Můj profil' });
const breadcrumbs = ref([
  { title: 'Nastavení', disabled: false, href: '#' },
  { title: 'Můj profil', disabled: true, href: '#' }
]);

const user = ref<User | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Edit mode
const editMode = ref(false);
const editData = ref<UpdateUserData>({});

// Password dialog
const showPasswordDialog = ref(false);
const passwordData = ref<ChangePasswordData>({
  password: '',
  currentPassword: ''
});
const confirmPassword = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Avatar
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);

// Computed
const fullName = computed(() => {
  if (!user.value) return '';
  return `${user.value.firstName} ${user.value.lastName}`;
});

const initials = computed(() => {
  if (!user.value) return '';
  return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`;
});

const userTypeLabel = computed(() => {
  if (!user.value) return '';
  switch (user.value.type) {
    case 'admin': return 'Administrátor';
    case 'regular': return 'Uživatel';
    case 'portal': return 'Portálový uživatel';
    default: return user.value.type;
  }
});

const userTypeColor = computed(() => {
  if (!user.value) return 'default';
  switch (user.value.type) {
    case 'admin': return 'error';
    case 'regular': return 'primary';
    case 'portal': return 'secondary';
    default: return 'default';
  }
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('cs-CZ');
};

/**
 * Načte uživatelský profil
 */
const loadUserProfile = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    user.value = await userService.getCurrentUser();
    console.log('✅ User profile loaded:', user.value);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání profilu';
    console.error('❌ Error loading profile:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Zapne edit mode
 */
const toggleEditMode = () => {
  if (editMode.value && user.value) {
    // Zrušení - obnovit data
    editData.value = {
      firstName: user.value.firstName,
      lastName: user.value.lastName,
      emailAddress: user.value.emailAddress || undefined,
      phoneNumber: user.value.phoneNumber || undefined,
      title: user.value.title || undefined,
      middleName: user.value.middleName || undefined,
      gender: user.value.gender || undefined
    };
  } else if (user.value) {
    // Zahájení editace
    editData.value = {
      firstName: user.value.firstName,
      lastName: user.value.lastName,
      emailAddress: user.value.emailAddress || undefined,
      phoneNumber: user.value.phoneNumber || undefined,
      title: user.value.title || undefined,
      middleName: user.value.middleName || undefined,
      gender: user.value.gender || undefined
    };
  }
  editMode.value = !editMode.value;
};

/**
 * Uloží změny profilu
 */
const saveProfile = async () => {
  if (!user.value) return;
  
  saving.value = true;
  error.value = null;
  successMessage.value = null;
  
  try {
    const updated = await userService.updateProfile(user.value.id, editData.value);
    user.value = updated;
    editMode.value = false;
    successMessage.value = 'Profil byl úspěšně aktualizován';
    
    // Skrýt zprávu po 3 sekundách
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání profilu';
    console.error('❌ Error saving profile:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Otevře dialog pro změnu hesla
 */
const openPasswordDialog = () => {
  passwordData.value = {
    password: '',
    currentPassword: ''
  };
  confirmPassword.value = '';
  showPasswordDialog.value = true;
};

/**
 * Změní heslo
 */
const changePassword = async () => {
  if (!user.value) return;
  
  // Validace
  if (!passwordData.value.currentPassword) {
    error.value = 'Zadejte současné heslo';
    return;
  }
  
  if (!passwordData.value.password) {
    error.value = 'Zadejte nové heslo';
    return;
  }
  
  if (passwordData.value.password !== confirmPassword.value) {
    error.value = 'Hesla se neshodují';
    return;
  }
  
  if (passwordData.value.password.length < 6) {
    error.value = 'Heslo musí mít alespoň 6 znaků';
    return;
  }
  
  saving.value = true;
  error.value = null;
  successMessage.value = null;
  
  try {
    await userService.changePassword(user.value.id, passwordData.value);
    showPasswordDialog.value = false;
    successMessage.value = 'Heslo bylo úspěšně změněno';
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při změně hesla';
    console.error('❌ Error changing password:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Obsluha výběru avataru
 */
const handleAvatarSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    avatarFile.value = file;
    
    // Vytvoř preview
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

/**
 * Nahraje avatar
 */
const uploadAvatar = async () => {
  if (!user.value || !avatarFile.value) return;
  
  saving.value = true;
  error.value = null;
  successMessage.value = null;
  
  try {
    const updated = await userService.uploadAvatar(user.value.id, avatarFile.value);
    user.value = updated;
    avatarFile.value = null;
    avatarPreview.value = null;
    successMessage.value = 'Avatar byl úspěšně nahrán';
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při nahrávání avataru';
    console.error('❌ Error uploading avatar:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Smaže avatar
 */
const deleteAvatar = async () => {
  if (!user.value || !user.value.avatarId) return;
  
  if (!confirm('Opravdu chcete odstranit avatar?')) return;
  
  saving.value = true;
  error.value = null;
  
  try {
    await userService.deleteAvatar(user.value.id);
    await loadUserProfile(); // Reload
    successMessage.value = 'Avatar byl odstraněn';
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání avataru';
    console.error('❌ Error deleting avatar:', err);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadUserProfile();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <!-- Loading state -->
  <v-row v-if="loading">
    <v-col cols="12">
      <v-card>
        <v-card-text class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="text-h6 mt-4">Načítání profilu...</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Error state -->
  <v-row v-else-if="error && !user">
    <v-col cols="12">
      <v-alert type="error" variant="tonal">
        <strong>Chyba:</strong> {{ error }}
      </v-alert>
      <v-btn color="primary" @click="loadUserProfile" class="mt-4">
        <v-icon start>mdi-refresh</v-icon>
        Zkusit znovu
      </v-btn>
    </v-col>
  </v-row>

  <!-- Profile content -->
  <v-row v-else-if="user">
    <v-col cols="12">
      <!-- Success message -->
      <v-alert
        v-if="successMessage"
        type="success"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="successMessage = null"
      >
        {{ successMessage }}
      </v-alert>

      <!-- Error message -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        <strong>Chyba:</strong> {{ error }}
      </v-alert>

      <!-- Action buttons -->
      <div class="d-flex justify-end gap-2 mb-4">
        <v-btn
          v-if="!editMode"
          color="primary"
          prepend-icon="mdi-pencil"
          @click="toggleEditMode"
        >
          Upravit profil
        </v-btn>
        
        <template v-else>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-close"
            @click="toggleEditMode"
          >
            Zrušit
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            @click="saveProfile"
            :loading="saving"
          >
            Uložit změny
          </v-btn>
        </template>
      </div>

      <v-row>
        <!-- Main profile info -->
        <v-col cols="12" md="8">
          <UiParentCard title="Základní informace">
            <v-row>
              <!-- Avatar section -->
              <v-col cols="12" class="text-center mb-4">
                <v-avatar 
                  :color="user.avatarColor || 'primary'" 
                  size="120"
                  class="mb-4"
                >
                  <v-img 
                    v-if="avatarPreview" 
                    :src="avatarPreview"
                    cover
                  ></v-img>
                  <v-img 
                    v-else-if="user.avatarId" 
                    :src="userService.getAvatarUrl(user.id, 'medium')"
                    cover
                  ></v-img>
                  <span v-else class="text-h3 text-white">{{ initials }}</span>
                </v-avatar>

                <div class="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    style="display: none"
                    ref="avatarInput"
                    @change="handleAvatarSelect"
                  />
                  
                  <v-btn
                    v-if="avatarFile"
                    color="primary"
                    size="small"
                    @click="uploadAvatar"
                    :loading="saving"
                    class="mr-2"
                  >
                    Nahrát
                  </v-btn>
                  
                  <v-btn
                    v-if="avatarFile"
                    variant="outlined"
                    size="small"
                    @click="avatarFile = null; avatarPreview = null"
                    class="mr-2"
                  >
                    Zrušit
                  </v-btn>
                  
                  <v-btn
                    v-else
                    variant="outlined"
                    size="small"
                    @click="($refs.avatarInput as HTMLInputElement).click()"
                    prepend-icon="mdi-camera"
                    class="mr-2"
                  >
                    Změnit avatar
                  </v-btn>
                  
                  <v-btn
                    v-if="user.avatarId && !avatarFile"
                    variant="outlined"
                    size="small"
                    color="error"
                    @click="deleteAvatar"
                    prepend-icon="mdi-delete"
                  >
                    Odstranit
                  </v-btn>
                </div>
              </v-col>

              <!-- Personal info -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.firstName"
                  label="Jméno *"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Jméno</div>
                  <div class="text-h6 font-weight-bold">{{ user.firstName }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.lastName"
                  label="Příjmení *"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Příjmení</div>
                  <div class="text-h6 font-weight-bold">{{ user.lastName }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.emailAddress"
                  label="Email"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Email</div>
                  <div class="text-body-1 mt-2">{{ user.emailAddress || '—' }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.phoneNumber"
                  label="Telefon"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Telefon</div>
                  <div class="text-body-1 mt-2">{{ user.phoneNumber || '—' }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.title"
                  label="Titul"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Titul</div>
                  <div class="text-body-1 mt-2">{{ user.title || '—' }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-if="editMode"
                  v-model="editData.gender"
                  :items="[
                    { title: 'Muž', value: 'Male' },
                    { title: 'Žena', value: 'Female' },
                    { title: 'Neuvedeno', value: null }
                  ]"
                  label="Pohlaví"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Pohlaví</div>
                  <div class="text-body-1 mt-2">
                    {{ user.gender === 'Male' ? 'Muž' : user.gender === 'Female' ? 'Žena' : '—' }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Uživatelské jméno</div>
                  <v-chip color="primary" class="mt-2">{{ user.userName }}</v-chip>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>

          <!-- Password section -->
          <UiParentCard title="Bezpečnost" class="mt-4">
            <v-row>
              <v-col cols="12">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-lock-reset"
                  @click="openPasswordDialog"
                >
                  Změnit heslo
                </v-btn>
              </v-col>
            </v-row>
          </UiParentCard>
        </v-col>

        <!-- Sidebar -->
        <v-col cols="12" md="4">
          <!-- User info card -->
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-4">Informace o účtu</div>
              
              <div class="mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">Typ účtu</div>
                <v-chip :color="userTypeColor" class="mt-1" size="small">
                  {{ userTypeLabel }}
                </v-chip>
              </div>

              <div class="mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">Status</div>
                <v-chip 
                  :color="user.isActive ? 'success' : 'error'" 
                  class="mt-1"
                  size="small"
                >
                  {{ user.isActive ? 'Aktivní' : 'Neaktivní' }}
                </v-chip>
              </div>

              <v-divider class="my-3"></v-divider>

              <div class="mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">Vytvořen</div>
                <div class="text-caption mt-1">{{ formatDate(user.createdAt) }}</div>
                <div class="text-caption text-medium-emphasis">{{ user.createdByName }}</div>
              </div>

              <div v-if="user.modifiedAt">
                <div class="text-subtitle-2 text-medium-emphasis">Naposledy upraven</div>
                <div class="text-caption mt-1">{{ formatDate(user.modifiedAt) }}</div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Teams card -->
          <v-card variant="outlined" class="mt-4" v-if="user.teamsIds.length > 0">
            <v-card-text>
              <div class="text-h6 mb-4">Týmy</div>
              
              <v-chip-group column>
                <v-chip 
                  v-for="teamId in user.teamsIds" 
                  :key="teamId"
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  {{ user.teamsNames[teamId] }}
                </v-chip>
              </v-chip-group>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <!-- Password dialog -->
  <v-dialog v-model="showPasswordDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Změna hesla</span>
        <v-btn icon variant="text" @click="showPasswordDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-form @submit.prevent="changePassword">
          <v-text-field
            v-model="passwordData.currentPassword"
            label="Současné heslo *"
            :type="showCurrentPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showCurrentPassword = !showCurrentPassword"
          ></v-text-field>

          <v-text-field
            v-model="passwordData.password"
            label="Nové heslo *"
            :type="showNewPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showNewPassword = !showNewPassword"
            hint="Minimálně 6 znaků"
            persistent-hint
          ></v-text-field>

          <v-text-field
            v-model="confirmPassword"
            label="Potvrzení hesla *"
            :type="showConfirmPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="showPasswordDialog = false">
          Zrušit
        </v-btn>
        <v-btn 
          color="primary" 
          @click="changePassword"
          :loading="saving"
        >
          Změnit heslo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

:deep(.v-card) {
  border-radius: 8px;
}
</style>