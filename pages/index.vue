<script setup lang="ts">
const email = ref("");
const password = ref("");
const loading = ref(false);
const gameStore = useGameStore();
const router = useRouter();

onMounted(() => {
  if (gameStore.user) {
    router.push("/dashboard");
  }
});

const handleLogin = async () => {
  loading.value = true;
  try {
    await gameStore.login(email.value, password.value);
  } catch (error: any) {
    alert("Erro ao logar: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-[#EEF2FF] font-inter flex flex-col items-center justify-center p-4 relative overflow-hidden"
  >
    <div
      class="absolute top-0 left-0 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    ></div>
    <div
      class="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"
    ></div>

    <div
      class="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-white w-full max-w-sm z-10 relative"
    >
      <div class="text-center mb-10">
        <div
          class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-200 mx-auto mb-4 text-white"
        >
          🚀
        </div>
        <h1 class="text-3xl font-extrabold text-[#312E81] mb-2 tracking-tight">
          Planning Poker
        </h1>
        <p class="text-[#6366F1] font-medium text-sm">
          Acesse o painel administrativo
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label
            class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1"
            >Email</label
          >
          <input
            v-model="email"
            type="email"
            class="input-modern"
            placeholder="admin@empresa.com"
          />
        </div>

        <div>
          <label
            class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1"
            >Senha</label
          >
          <input
            v-model="password"
            type="password"
            class="input-modern"
            placeholder="******"
          />
        </div>

        <button
          :disabled="loading"
          class="btn-primary mt-4 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
        >
          {{ loading ? "Entrando..." : "Acessar Painel" }}
        </button>
      </form>

      <div class="relative my-8">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-100"></div>
        </div>
        <div
          class="relative flex justify-center text-xs uppercase font-bold tracking-widest text-slate-300"
        >
          <span class="bg-white px-3">Ou</span>
        </div>
      </div>

      <NuxtLink
        to="/join"
        class="block w-full text-center py-3.5 rounded-xl border-2 border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50 transition font-bold text-sm"
      >
        Entrar como Convidado
      </NuxtLink>
    </div>

    <p class="absolute bottom-6 text-slate-400 text-xs font-medium">
      Desenvolvido com Nuxt 3 & Supabase
    </p>
  </div>
</template>

<style scoped>
.input-modern {
  @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-300 font-medium;
}
.btn-primary {
  @apply w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
