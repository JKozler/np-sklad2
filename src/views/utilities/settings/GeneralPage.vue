<script setup lang="ts">
import { ref } from 'vue';

const page = ref({ title: 'Obecné nastavení' });
const breadcrumbs = ref([
  { title: 'Nastavení', disabled: false, href: '#' },
  { title: 'Obecné', disabled: true, href: '#' }
]);

const companyName = ref('Natural Protein s.r.o.');
const companyEmail = ref('info@naturalprotein.cz');
const companyPhone = ref('+420 776 877 148');
const companyAddress = ref('');
const companyCity = ref('Praha');
const companyPostalCode = ref('');
const companyVat = ref('');

const currency = ref('CZK');
const language = ref('cs');
const timezone = ref('Europe/Prague');

const emailNotifications = ref(true);
const orderNotifications = ref(true);
const lowStockAlerts = ref(true);
</script>

<template>
  <v-row class="page-breadcrumb mb-1 mt-1">
    <v-col cols="12" md="12">
      <v-card variant="flat" class="px-4 py-3">
        <v-row no-gutters class="align-center">
          <v-col md="5">
            <h3 class="text-h3">{{ page.title }}</h3>
          </v-col>
          <v-col md="7" sm="12" cols="12">
            <v-breadcrumbs :items="breadcrumbs" class="text-h5 justify-md-end pa-1">
              <template v-slot:divider>
                <v-icon size="17">mdi-chevron-right</v-icon>
              </template>
              <template v-slot:prepend>
                <v-icon size="small" icon="mdi-home" class="text-secondary mr-2"></v-icon>
                <v-icon size="17">mdi-chevron-right</v-icon>
              </template>
            </v-breadcrumbs>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12" md="8">
      <v-card variant="flat">
        <v-card-item>
          <v-card-title>Informace o společnosti</v-card-title>
        </v-card-item>
        <v-divider></v-divider>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="companyName"
                  label="Název společnosti"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="companyEmail"
                  label="Email"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="companyPhone"
                  label="Telefon"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="companyAddress"
                  label="Adresa"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="companyCity"
                  label="Město"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="companyPostalCode"
                  label="PSČ"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="companyVat"
                  label="IČO / DIČ"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>

      <v-card variant="flat" class="mt-4">
        <v-card-item>
          <v-card-title>Regionální nastavení</v-card-title>
        </v-card-item>
        <v-divider></v-divider>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="currency"
                  :items="[
                    { title: 'CZK - Koruna česká', value: 'CZK' },
                    { title: 'EUR - Euro', value: 'EUR' },
                    { title: 'USD - Americký dolar', value: 'USD' }
                  ]"
                  label="Měna"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="language"
                  :items="[
                    { title: 'Čeština', value: 'cs' },
                    { title: 'English', value: 'en' },
                    { title: 'Slovenčina', value: 'sk' }
                  ]"
                  label="Jazyk"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="timezone"
                  :items="[
                    { title: 'Europe/Prague', value: 'Europe/Prague' },
                    { title: 'Europe/London', value: 'Europe/London' },
                    { title: 'America/New_York', value: 'America/New_York' }
                  ]"
                  label="Časové pásmo"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card variant="flat">
        <v-card-item>
          <v-card-title>Notifikace</v-card-title>
        </v-card-item>
        <v-divider></v-divider>
        <v-card-text>
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-checkbox v-model="emailNotifications" hide-details></v-checkbox>
              </template>
              <v-list-item-title>Emailové notifikace</v-list-item-title>
              <v-list-item-subtitle>Zasílat důležité aktualizace emailem</v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <v-checkbox v-model="orderNotifications" hide-details></v-checkbox>
              </template>
              <v-list-item-title>Notifikace objednávek</v-list-item-title>
              <v-list-item-subtitle>Upozornění na nové objednávky</v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <v-checkbox v-model="lowStockAlerts" hide-details></v-checkbox>
              </template>
              <v-list-item-title>Upozornění na nízký stav</v-list-item-title>
              <v-list-item-subtitle>Varování při nízkém stavu zásob</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <div class="mt-4">
        <v-btn color="primary" block size="large">
          Uložit změny
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>