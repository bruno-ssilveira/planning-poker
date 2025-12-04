<script setup lang="ts">
const gameStore = useGameStore();
const router = useRouter();

onMounted(() => {
  if (!gameStore.user) {
    router.push("/");
  } else {
    loadRooms();
  }
});

// Estados - Criar Planning
const newRoomName = ref("");
const adminName = ref("");
const selectedAvatarAdmin = ref("Cat1.svg");
const isLoading = ref(false);
const avatars = [
  "Cat1.svg",
  "Cat2.svg",
  "Cat3.svg",
  "Cat4.svg",
  "Cat5.svg",
  "Cat6.svg",
];
const myRooms = ref<any[]>([]);

const loadRooms = async () => {
  try {
    myRooms.value = await gameStore.fetchMyRooms();
  } catch (e) {
    console.error(e);
  }
};

const handleCreateRoom = async () => {
  if (!newRoomName.value || !adminName.value) return alert("Preencha tudo!");
  isLoading.value = true;
  try {
    await gameStore.createRoom(
      newRoomName.value,
      adminName.value,
      selectedAvatarAdmin.value
    );
    if (gameStore.currentRoom) {
      router.push(`/room/${gameStore.currentRoom.code}`);
    }
  } catch (e: any) {
    alert("Erro: " + (e.message || e));
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (roomId: string) => {
  if (confirm("Tem certeza? Isso apagará todas as tasks e votos.")) {
    try {
      myRooms.value = await gameStore.deleteRoom(roomId);
    } catch (e) {
      alert("Erro ao excluir.");
    }
  }
};

const logout = async () => {
  const supabase = useSupabaseClient();
  await supabase.auth.signOut();
  router.push("/");
};
</script>

<template>
  <div
    class="min-h-screen bg-[#EEF2FF] font-inter flex flex-col items-center py-12 px-4"
  >
    <div class="w-full max-w-6xl flex justify-between items-center mb-12">
      <div>
        <h1 class="text-3xl font-extrabold text-[#312E81]">Painel do Admin</h1>
        <p class="text-[#6366F1] font-medium">Gerencie suas plannings</p>
      </div>
      <button
        @click="logout"
        class="text-sm text-slate-500 hover:text-red-500 border border-slate-300 px-4 py-2 rounded-lg bg-white"
      >
        Sair
      </button>
    </div>

    <div
      class="w-full max-w-2xl bg-white p-10 rounded-[2rem] shadow-xl shadow-purple-100/50 border border-white relative overflow-hidden mb-16"
    >
      <div
        class="absolute top-0 right-0 w-40 h-40 bg-purple-50 rounded-full -mr-10 -mt-10 opacity-50"
      ></div>

      <div class="flex items-center gap-3 mb-8 relative">
        <span class="p-3 bg-purple-100 text-purple-600 rounded-2xl text-xl"
          >👑</span
        >
        <h2 class="text-2xl font-bold text-slate-800">Criar Nova Planning</h2>
      </div>

      <div class="space-y-6 relative">
        <div>
          <label
            class="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block"
            >Seu Avatar de Admin</label
          >
          <div class="flex gap-3">
            <img
              v-for="cat in avatars"
              :key="'admin-' + cat"
              :src="`/images/${cat}`"
              @click="selectedAvatarAdmin = cat"
              class="w-12 h-12 rounded-full border-2 cursor-pointer transition-all hover:scale-110 bg-slate-50"
              :class="
                selectedAvatarAdmin === cat
                  ? 'border-purple-600 ring-2 ring-purple-200 scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              "
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="text-sm font-semibold text-slate-500 ml-1 mb-1 block"
              >Nome da Planning</label
            >
            <input
              v-model="newRoomName"
              placeholder="Ex: Sprint 32"
              class="input-modern py-3"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-500 ml-1 mb-1 block"
              >Seu Nome</label
            >
            <input
              v-model="adminName"
              placeholder="Ex: Amanda"
              class="input-modern py-3"
            />
          </div>
        </div>

        <button
          @click="handleCreateRoom"
          :disabled="isLoading"
          class="btn-primary bg-[#4F46E5] hover:bg-[#4338ca] mt-2"
        >
          Criar e Entrar
        </button>
      </div>
    </div>

    <div v-if="myRooms.length > 0" class="w-full max-w-6xl pb-12">
      <h3 class="text-xl font-bold text-[#312E81] mb-6 flex items-center gap-2">
        📂 Plannings Anteriores
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="room in myRooms"
          :key="room.id"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group relative cursor-pointer"
          @click="router.push(`/room/${room.code}`)"
        >
          <button
            @click.stop="handleDelete(room.id)"
            class="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition z-10"
            title="Excluir"
          >
            🗑️
          </button>

          <div class="flex items-center justify-between mb-3 pr-8">
            <span
              class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
              >{{ room.code }}</span
            >
            <span class="text-xs text-slate-400">{{
              new Date(room.created_at).toLocaleDateString()
            }}</span>
          </div>
          <h4
            class="font-bold text-slate-800 text-xl mb-1 group-hover:text-indigo-600 transition truncate"
          >
            {{ room.name }}
          </h4>
          <p class="text-sm text-slate-400">Clique para continuar a votação</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-modern {
  @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400;
}
.btn-primary {
  @apply w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
