<script setup lang="ts">
const gameStore = useGameStore();
const router = useRouter();

const roomCode = ref("");
const playerName = ref("");
const selectedAvatar = ref("Cat1.svg");
const isLoading = ref(false);
const avatars = [
  "Cat1.svg",
  "Cat2.svg",
  "Cat3.svg",
  "Cat4.svg",
  "Cat5.svg",
  "Cat6.svg",
];

const enterRoom = async () => {
  if (!roomCode.value || !playerName.value) return alert("Preencha os campos!");
  isLoading.value = true;
  try {
    const room = await gameStore.findRoomByCode(roomCode.value);
    if (room) {
      await gameStore.joinRoom(room.id, playerName.value, selectedAvatar.value);
      router.push(`/room/${room.code}`);
    }
  } catch (e) {
    alert("Sala não encontrada!");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-[#EEF2FF] font-inter flex flex-col items-center justify-center p-4"
  >
    <h1 class="text-3xl font-extrabold text-[#312E81] mb-8">Planning Poker</h1>

    <div
      class="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-white relative z-10"
    >
      <div class="flex items-center gap-3 mb-6">
        <span class="p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xl"
          >🚀</span
        >
        <h2 class="text-2xl font-bold text-slate-800">Acesse uma sala</h2>
      </div>

      <div class="space-y-6">
        <div>
          <label
            class="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block"
            >Escolha seu Avatar</label
          >
          <div class="flex gap-2 justify-between">
            <img
              v-for="cat in avatars"
              :key="cat"
              :src="`/images/${cat}`"
              @click="selectedAvatar = cat"
              class="w-10 h-10 rounded-full border-2 cursor-pointer transition-all hover:scale-110 bg-slate-50"
              :class="
                selectedAvatar === cat
                  ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              "
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-500 ml-1 mb-1 block"
            >Código da Sala</label
          >
          <input
            v-model="roomCode"
            placeholder="Ex: X9Y2"
            class="input-modern uppercase font-mono tracking-widest text-center text-xl py-3"
            maxlength="4"
          />
        </div>
        <div>
          <label class="text-sm font-semibold text-slate-500 ml-1 mb-1 block"
            >Seu Codinome</label
          >
          <input
            v-model="playerName"
            placeholder="Digite seu nome"
            class="input-modern py-3"
          />
        </div>

        <button
          @click="enterRoom"
          :disabled="isLoading"
          class="btn-primary mt-2 shadow-lg shadow-indigo-500/30"
        >
          Entrar na Sala
        </button>

        <div class="relative my-6">
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
          to="/"
          class="block w-full text-center py-3.5 rounded-xl border-2 border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50 transition font-bold text-sm"
        >
          Sou Admin (Ir para Login)
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-modern {
  @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400;
}
.btn-primary {
  @apply w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
