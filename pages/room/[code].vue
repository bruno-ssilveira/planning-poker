<script setup lang="ts">
import { CARD_OPTIONS } from "~/types";

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const roomCode = (route.params.code as string).toUpperCase();

// Estados
const showNewTaskModal = ref(false);
const showJoinModal = ref(false);
const isEditingResult = ref(false);
const taskForm = reactive({ title: "", description: "", job: "", figma: "" });
const joinForm = reactive({ name: "", avatar: "Cat1.svg" });
const avatars = [
  "Cat1.svg",
  "Cat2.svg",
  "Cat3.svg",
  "Cat4.svg",
  "Cat5.svg",
  "Cat6.svg",
];

// Inicialização
onMounted(async () => {
  if (!gameStore.currentRoom || gameStore.currentRoom.code !== roomCode) {
    try {
      await gameStore.findRoomByCode(roomCode);
      const restored = await gameStore.tryRestoreSession(
        gameStore.currentRoom!.id
      );
      if (!restored && !gameStore.currentPlayerId) showJoinModal.value = true;
    } catch {
      router.push("/");
    }
  }
  gameStore.subscribeToRoom();
});

// Alternar Bloqueio da Sala
const toggleLock = () => {
  if (!gameStore.isAdmin || !gameStore.currentRoom) return;
  gameStore.toggleRoomLock(!gameStore.currentRoom.is_finished);
};

// Navegação
const goBack = () => {
  gameStore.isAdmin ? router.push("/dashboard") : router.push("/join");
};
const formatLink = (url: string) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

// Edição
const saveManualResult = async (event: any) => {
  const newScore = event.target.value;
  if (newScore) await gameStore.updateTaskScore(newScore);
  isEditingResult.value = false;
};
const enableEditResult = () => {
  if (gameStore.isAdmin) {
    isEditingResult.value = true;
    nextTick(() => document.getElementById("resultInput")?.focus());
  }
};

// Actions
const handleJoinRoom = async () => {
  if (!joinForm.name) return alert("Nome obrigatório");
  try {
    await gameStore.joinRoom(
      gameStore.currentRoom!.id,
      joinForm.name,
      joinForm.avatar
    );
    showJoinModal.value = false;
  } catch (e: any) {
    alert(e.message);
  }
};
const handleCreateTask = async () => {
  await gameStore.createTask(
    taskForm.title,
    taskForm.description,
    taskForm.job,
    taskForm.figma
  );
  showNewTaskModal.value = false;
  taskForm.title = "";
  taskForm.description = "";
  taskForm.job = "";
  taskForm.figma = "";
};
const nextTask = () => {
  if (!gameStore.isAdmin || !gameStore.tasks || !gameStore.activeTask) return;
  const idx = gameStore.tasks.findIndex(
    (t) => t.id === gameStore.activeTask?.id
  );
  if (idx < gameStore.tasks.length - 1)
    gameStore.setActiveTask(gameStore.tasks[idx + 1].id);
};
const prevTask = () => {
  if (!gameStore.isAdmin || !gameStore.tasks || !gameStore.activeTask) return;
  const idx = gameStore.tasks.findIndex(
    (t) => t.id === gameStore.activeTask?.id
  );
  if (idx > 0) gameStore.setActiveTask(gameStore.tasks[idx - 1].id);
};
const vote = (val: string) => gameStore.submitVote(val);
const reveal = () => gameStore.revealCards();
const reset = () => gameStore.resetRound();
const copyCode = () => {
  navigator.clipboard.writeText(window.location.href);
  alert("Copiado!");
};

// Computeds
const getPlayerVote = (pid: string) => gameStore.activeTask?.votes?.[pid];
const myVote = computed(() => gameStore.myLocalVote);
const myself = computed(() =>
  gameStore.players.find((p) => p.id === gameStore.currentPlayerId)
);
const getAvatar = (p: any) =>
  p?.avatar ? `/images/${p.avatar}` : "/images/Cat1.svg";
const hasNext = computed(() => {
  const idx = gameStore.tasks.findIndex(
    (t) => t.id === gameStore.activeTask?.id
  );
  return idx < gameStore.tasks.length - 1;
});
const hasPrev = computed(() => {
  const idx = gameStore.tasks.findIndex(
    (t) => t.id === gameStore.activeTask?.id
  );
  return idx > 0;
});

const taskResult = computed(() => {
  if (!gameStore.activeTask) return null;
  if (gameStore.activeTask.final_score) return gameStore.activeTask.final_score;
  if (!gameStore.activeTask.votes) return null;

  const votes = Object.values(gameStore.activeTask.votes)
    .filter((v) => v !== "☕" && v !== "?" && v !== "hidden")
    .map((v) => Number(v))
    .sort((a, b) => a - b);

  if (votes.length === 0) {
    const rawVotes = Object.values(gameStore.activeTask.votes);
    if (rawVotes.includes("☕")) return "☕";
    if (rawVotes.includes("?")) return "?";
    return null;
  }

  const counts: Record<number, number> = {};
  let maxFreq = 0,
    mode = votes[0];
  votes.forEach((num) => {
    counts[num] = (counts[num] || 0) + 1;
    if (counts[num] > maxFreq) {
      maxFreq = counts[num];
      mode = num;
    }
  });

  if (maxFreq >= 2) return mode.toString();
  return votes[Math.floor(votes.length / 2)].toString();
});
</script>

<template>
  <div class="min-h-screen bg-[#F3F5FF] flex flex-col font-inter relative">
    <header
      class="h-20 px-6 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm z-10"
    >
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="text-slate-400 hover:text-indigo-600 transition text-sm flex items-center gap-1"
        >
          <span>←</span> Voltar
        </button>
        <div
          class="hidden md:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-100 transition"
          @click="copyCode"
        >
          <span class="text-xs font-bold text-indigo-400">CÓDIGO:</span>
          <span class="text-lg font-black text-indigo-700">{{ roomCode }}</span>
        </div>

        <div
          v-if="gameStore.currentRoom"
          @click="toggleLock"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition select-none"
          :class="[
            gameStore.currentRoom.is_finished
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100',
          ]"
          :style="{ cursor: gameStore.isAdmin ? 'pointer' : 'default' }"
          :title="
            gameStore.isAdmin
              ? 'Clique para Encerrar/Abrir Planning'
              : 'Status da Planning'
          "
        >
          <span>{{
            gameStore.currentRoom.is_finished ? "🔒 Encerrada" : "🔓 Aberta"
          }}</span>
        </div>
      </div>
      <div class="absolute left-1/2 -translate-x-1/2 hidden md:block">
        <h2 class="text-slate-500 font-semibold">
          {{ gameStore.currentRoom?.name }}
        </h2>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-bold text-slate-700">
            {{ myself?.name || "Visitante" }}
          </p>
          <p class="text-xs text-slate-400">
            {{ gameStore.isAdmin ? "Admin" : "Membro" }}
          </p>
        </div>
        <img
          :src="getAvatar(myself)"
          class="w-10 h-10 rounded-full border border-slate-200 bg-white object-cover"
        />
      </div>
    </header>

    <main
      class="flex-1 flex flex-col items-center pt-8 px-4 pb-48 overflow-y-auto"
    >
      <div v-if="gameStore.tasks.length === 0" class="mt-20 text-center">
        <div class="bg-white p-10 rounded-3xl shadow-sm max-w-md mx-auto">
          <h3 class="text-xl font-bold text-slate-800 mb-2">Nenhuma tarefa</h3>
          <button
            v-if="gameStore.isAdmin"
            @click="showNewTaskModal = true"
            class="btn-primary w-full mt-4"
          >
            + Criar Tarefa
          </button>
          <p v-else class="text-sm text-slate-400 mt-2">Aguardando admin...</p>
        </div>
      </div>

      <div
        v-else-if="gameStore.activeTask"
        class="w-full max-w-5xl flex items-center gap-4"
      >
        <button
          v-if="gameStore.isAdmin"
          @click="prevTask"
          :disabled="!hasPrev"
          class="hidden md:flex p-4 rounded-full bg-white shadow-sm text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition"
        >
          ◀
        </button>

        <div
          class="bg-white flex-1 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white relative min-h-[280px]"
        >
          <div
            v-if="gameStore.activeTask.is_revealed && taskResult"
            class="absolute top-8 right-8 flex flex-col items-center animate-bounce-in z-20"
          >
            <input
              v-if="isEditingResult"
              id="resultInput"
              :value="taskResult"
              @blur="saveManualResult"
              @keydown.enter="saveManualResult"
              class="w-20 h-12 bg-indigo-100 text-indigo-700 text-center text-2xl font-black rounded-xl border-2 border-indigo-500 outline-none"
            />
            <div
              v-else
              @click="enableEditResult"
              class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-2xl font-black shadow-sm border border-indigo-200 cursor-pointer hover:bg-indigo-200 transition select-none min-w-[60px] text-center flex items-center justify-center"
              :title="gameStore.isAdmin ? 'Clique para editar' : ''"
            >
              <img
                v-if="taskResult === '☕'"
                src="/images/Coffee.svg"
                class="w-8 h-8 drop-shadow-sm"
                alt="Café"
              />
              <span v-else>{{ taskResult }}</span>
            </div>
            <span
              class="text-[10px] uppercase font-bold text-indigo-400 mt-1 tracking-wider"
              >Resultado</span
            >
          </div>

          <div
            v-if="gameStore.isAdmin"
            class="absolute bottom-8 right-8 flex gap-2 z-20"
          >
            <button
              @click="reveal"
              :disabled="gameStore.activeTask.is_revealed"
              class="px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg"
              :class="
                gameStore.activeTask.is_revealed
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#1F2937] text-white hover:bg-black'
              "
            >
              {{ gameStore.activeTask.is_revealed ? "Revelado" : "Revelar" }}
            </button>
            <button
              @click="reset"
              class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition"
            >
              Reiniciar
            </button>
            <button
              @click="showNewTaskModal = true"
              class="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition ml-2"
            >
              + Task
            </button>
          </div>

          <div class="w-full pr-4 md:pr-32">
            <div class="flex justify-between items-center mb-3">
              <h1
                class="text-2xl md:text-3xl font-bold text-slate-800 break-words"
              >
                {{ gameStore.activeTask.title }}
              </h1>
            </div>
            <div class="max-h-40 overflow-y-auto pr-2 mb-6 scrollbar-thin">
              <p
                class="text-slate-500 font-medium whitespace-pre-wrap leading-relaxed text-sm md:text-base"
              >
                {{
                  gameStore.activeTask.description || "Sem descrição detalhada."
                }}
              </p>
            </div>
            <div class="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <div
                v-if="gameStore.activeTask.link_job"
                class="flex items-start gap-2 text-sm group"
              >
                <span class="text-slate-400 font-bold min-w-[60px]"
                  >🔗 Job:</span
                >
                <a
                  :href="formatLink(gameStore.activeTask.link_job)"
                  target="_blank"
                  class="text-indigo-600 font-medium hover:text-indigo-800 hover:underline break-all transition-colors"
                  >{{ gameStore.activeTask.link_job }}</a
                >
              </div>
              <div
                v-if="gameStore.activeTask.link_figma"
                class="flex items-start gap-2 text-sm group"
              >
                <span class="text-slate-400 font-bold min-w-[60px]"
                  >🎨 Figma:</span
                >
                <a
                  :href="formatLink(gameStore.activeTask.link_figma)"
                  target="_blank"
                  class="text-purple-600 font-medium hover:text-purple-800 hover:underline break-all transition-colors"
                  >{{ gameStore.activeTask.link_figma }}</a
                >
              </div>
              <div
                v-if="
                  !gameStore.activeTask.link_job &&
                  !gameStore.activeTask.link_figma
                "
                class="text-xs text-slate-300 italic"
              >
                Nenhum link anexado.
              </div>
            </div>
          </div>
        </div>

        <button
          v-if="gameStore.isAdmin"
          @click="nextTask"
          :disabled="!hasNext"
          class="hidden md:flex p-4 rounded-full bg-white shadow-sm text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition"
        >
          ▶
        </button>
      </div>

      <div
        v-if="gameStore.tasks.length > 0"
        class="flex flex-wrap justify-center gap-8 w-full max-w-6xl mt-16 mb-8"
      >
        <div
          v-for="player in gameStore.players"
          :key="player.id"
          class="flex flex-col items-center gap-3"
        >
          <div
            class="w-24 h-36 rounded-xl flex items-center justify-center text-4xl font-bold transition-all duration-500 relative shadow-sm"
            :class="[
              gameStore.activeTask?.is_revealed
                ? 'bg-white border-2 border-slate-200 text-slate-800'
                : getPlayerVote(player.id)
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white -translate-y-2 shadow-lg shadow-indigo-500/40'
                : 'bg-white border-2 border-dashed border-slate-300 opacity-60',
            ]"
          >
            <template v-if="gameStore.activeTask?.is_revealed">
              <span v-if="getPlayerVote(player.id) === 'hidden'">...</span>
              <img
                v-else-if="getPlayerVote(player.id) === '☕'"
                src="/images/Coffee.svg"
                class="w-10 h-10 drop-shadow-sm"
                alt="Café"
              />
              <span v-else>{{ getPlayerVote(player.id) }}</span>
            </template>
            <span
              v-else-if="getPlayerVote(player.id)"
              class="text-3xl text-white/90"
              >♠️</span
            >
          </div>
          <div class="flex flex-col items-center">
            <img
              :src="getAvatar(player)"
              class="w-12 h-12 rounded-full border-2 border-white shadow-md bg-slate-100 mb-1 object-cover"
            />
            <span class="text-sm font-semibold text-slate-600">{{
              player.name
            }}</span>
          </div>
        </div>
      </div>
    </main>

    <footer
      v-if="gameStore.tasks.length > 0"
      class="fixed bottom-0 w-full bg-[#E0E7FF]/90 backdrop-blur-md border-t border-white/50 flex flex-col items-center z-50 transition-all duration-500 pb-2"
      :class="{
        'translate-y-full opacity-0': gameStore.activeTask?.is_revealed,
      }"
    >
      <span
        class="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-2 mb-1"
        >Escolha sua estimativa</span
      >
      <div
        class="flex gap-3 overflow-x-auto max-w-full px-6 pb-4 pt-6 scrollbar-hide w-full justify-center"
      >
        <button
          v-for="card in CARD_OPTIONS"
          :key="card"
          @click="vote(card)"
          :disabled="gameStore.activeTask?.is_revealed"
          class="relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300 shadow-md border-b-[6px] active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
          :class="[
            myVote === card
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-900 -translate-y-4 shadow-xl shadow-indigo-500/40 ring-2 ring-white/50'
              : 'bg-white text-slate-700 border-slate-200 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-lg',
          ]"
        >
          <img
            v-if="card === '☕'"
            src="/images/Coffee.svg"
            class="w-8 h-8 drop-shadow-sm"
            alt="Café"
          />
          <span v-else class="drop-shadow-sm">{{ card }}</span>
          <span
            v-if="card !== '☕'"
            class="absolute top-1.5 left-1.5 text-[10px] transition-opacity duration-300"
            :class="
              myVote === card
                ? 'text-white/60 opacity-100'
                : 'text-slate-300 opacity-40 group-hover:opacity-100'
            "
          ></span>
        </button>
      </div>
    </footer>

    <div
      v-if="showNewTaskModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4"
    >
      <div class="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Nova Task</h2>
        <div class="space-y-4">
          <input
            v-model="taskForm.title"
            placeholder="Título"
            class="input-modern"
          />
          <textarea
            v-model="taskForm.description"
            placeholder="Descrição..."
            class="input-modern h-32 resize-none"
          ></textarea>
          <div class="grid grid-cols-2 gap-4">
            <input
              v-model="taskForm.job"
              placeholder="Link Job"
              class="input-modern"
            /><input
              v-model="taskForm.figma"
              placeholder="Link Figma"
              class="input-modern"
            />
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button
              @click="showNewTaskModal = false"
              class="text-slate-500 font-bold px-4 py-3 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar</button
            ><button @click="handleCreateTask" class="btn-primary w-auto px-8">
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showJoinModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
    >
      <div
        class="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white"
      >
        <div class="flex items-center gap-3 mb-6">
          <span class="p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xl"
            >👋</span
          >
          <div>
            <h2 class="text-2xl font-bold text-slate-800">Bem-vindo!</h2>
            <p class="text-xs text-slate-400">Configure seu perfil.</p>
          </div>
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
                :key="'join-' + cat"
                :src="`/images/${cat}`"
                @click="joinForm.avatar = cat"
                class="w-10 h-10 rounded-full border-2 cursor-pointer transition-all hover:scale-110 bg-slate-50"
                :class="
                  joinForm.avatar === cat
                    ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                "
              />
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-500 ml-1 mb-1 block"
              >Seu Nome</label
            ><input
              v-model="joinForm.name"
              placeholder="Como vão te chamar?"
              class="input-modern py-3"
            />
          </div>
          <button @click="handleJoinRoom" class="btn-primary w-full mt-2">
            Entrar na Planning
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-modern {
  @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder-slate-400;
}
.btn-primary {
  @apply w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes bounceIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
