export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@nuxtjs/supabase"],

  // Configuração básica do Supabase (vamos preencher as chaves depois)
  supabase: {
    redirect: false, // Vamos gerenciar o redirecionamento manualmente
  },

  // Habilitar SCSS globalmente se necessário (opcional por enquanto)
  css: ["~/assets/scss/main.scss"],
});
