import { defineStore } from "pinia";
import type { Room, Player, Task } from "~/types";

export const useGameStore = defineStore("game", () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const router = useRouter();

  // --- ESTADO ---
  const currentRoom = ref<Room | null>(null);
  const tasks = ref<Task[]>([]);
  const activeTask = ref<Task | null>(null);
  const players = ref<Player[]>([]);
  const currentPlayerId = ref<string | null>(null);
  const myLocalVote = ref<string | null>(null);

  // --- COMPUTED ---
  const isAdmin = computed(() => {
    const userId = user.value?.id || (user.value as any)?.sub;
    return userId === currentRoom.value?.owner_id;
  });

  // --- AÇÕES ---

  const clearState = () => {
    currentRoom.value = null;
    tasks.value = [];
    activeTask.value = null;
    players.value = [];
    currentPlayerId.value = null;
    myLocalVote.value = null;
  };

  const createRoom = async (
    roomName: string,
    playerName: string,
    avatar: string = "Cat1.svg"
  ) => {
    if (!user.value) throw new Error("Você precisa estar logado.");
    const userId = user.value.id || (user.value as any).sub;

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({ name: roomName, owner_id: userId })
      .select()
      .single();
    if (error) throw error;

    clearState();
    currentRoom.value = room;

    await joinRoom(room.id, playerName, avatar);
  };

  // --- JOIN INTELIGENTE ---
  const joinRoom = async (
    roomId: string,
    playerName: string,
    avatar: string
  ) => {
    const userId = user.value?.id || (user.value as any)?.sub;
    const isOwner = userId && currentRoom.value?.owner_id === userId;

    // Bloqueia entrada se fechado (exceto admin)
    if (currentRoom.value?.is_finished && !isOwner) {
      throw new Error("Esta planning foi finalizada pelo administrador.");
    }

    if (userId) {
      const { data: existingPlayer } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .single();

      if (existingPlayer) {
        currentPlayerId.value = existingPlayer.id;
        if (typeof window !== "undefined")
          localStorage.setItem(`player_id_${roomId}`, existingPlayer.id);
        return;
      }
    }

    const { data: player, error } = await supabase
      .from("players")
      .insert({
        room_id: roomId,
        name: playerName,
        avatar: avatar,
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) throw error;
    currentPlayerId.value = player.id;
    if (typeof window !== "undefined")
      localStorage.setItem(`player_id_${roomId}`, player.id);
  };

  const adminQuickJoin = async () => {
    if (!currentRoom.value || !user.value) return false;
    try {
      const adminName = user.value.user_metadata?.full_name || "Admin";
      await joinRoom(currentRoom.value.id, adminName, "Cat1.svg");
      return true;
    } catch (e) {
      return false;
    }
  };

  const tryRestoreSession = async (roomId: string) => {
    if (typeof window === "undefined") return false;
    const savedId = localStorage.getItem(`player_id_${roomId}`);
    if (!savedId) return false;

    const { data } = await supabase
      .from("players")
      .select()
      .eq("id", savedId)
      .eq("room_id", roomId)
      .single();
    if (data) {
      currentPlayerId.value = data.id;
      return true;
    }
    return false;
  };

  const findRoomByCode = async (code: string) => {
    clearState();
    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("code", code.toUpperCase())
      .single();
    if (error) throw error;
    currentRoom.value = data;
    return data;
  };

  const toggleRoomLock = async (isLocked: boolean) => {
    if (!currentRoom.value) return;
    currentRoom.value.is_finished = isLocked;
    await supabase
      .from("rooms")
      .update({ is_finished: isLocked })
      .eq("id", currentRoom.value.id);
  };

  const createTask = async (
    title: string,
    description: string,
    job: string,
    figma: string
  ) => {
    if (!currentRoom.value) return;
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        room_id: currentRoom.value.id,
        title,
        description,
        link_job: job,
        link_figma: figma,
        votes: {},
        is_revealed: false,
      })
      .select()
      .single();
    if (error) throw error;
    if (tasks.value.length === 0) await setActiveTask(task.id);
  };

  const setActiveTask = async (taskId: string) => {
    if (!currentRoom.value) return;
    myLocalVote.value = null;
    await supabase
      .from("rooms")
      .update({ active_task_id: taskId })
      .eq("id", currentRoom.value.id);
  };

  const submitVote = async (voteValue: string) => {
    if (!currentPlayerId.value || !activeTask.value) return;
    myLocalVote.value = voteValue;
    if (!activeTask.value.votes) activeTask.value.votes = {};
    activeTask.value.votes[currentPlayerId.value] = voteValue;
    await supabase.from("task_votes").upsert(
      {
        task_id: activeTask.value.id,
        player_id: currentPlayerId.value,
        value: voteValue,
      },
      { onConflict: "task_id, player_id" }
    );
  };

  const revealCards = async () => {
    if (!activeTask.value) return;
    activeTask.value.is_revealed = true;
    await supabase
      .from("tasks")
      .update({ is_revealed: true })
      .eq("id", activeTask.value.id);
    await fetchRealVotes(activeTask.value.id);
  };

  const fetchRealVotes = async (taskId: string) => {
    const { data: realVotes } = await supabase
      .from("task_votes")
      .select("player_id, value")
      .eq("task_id", taskId);
    if (realVotes && activeTask.value && activeTask.value.id === taskId) {
      const votesMap: Record<string, string> = {};
      realVotes.forEach((v) => (votesMap[v.player_id] = v.value));
      activeTask.value.votes = votesMap;
    }
  };

  const resetRound = async () => {
    if (!activeTask.value) return;
    myLocalVote.value = null;
    activeTask.value.is_revealed = false;
    activeTask.value.votes = {};
    activeTask.value.final_score = undefined;
    await supabase
      .from("tasks")
      .update({ is_revealed: false, votes: {}, final_score: null })
      .eq("id", activeTask.value.id);
    await supabase
      .from("task_votes")
      .delete()
      .eq("task_id", activeTask.value.id);
  };

  const updateTaskScore = async (score: string) => {
    if (!activeTask.value) return;
    activeTask.value.final_score = score;
    await supabase
      .from("tasks")
      .update({ final_score: score })
      .eq("id", activeTask.value.id);
  };

  const subscribeToRoom = async () => {
    if (!currentRoom.value) return;

    const refreshData = async () => {
      const { data: pData } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", currentRoom.value!.id);
      if (pData) players.value = pData;

      const { data: tData } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", currentRoom.value!.id)
        .order("created_at", { ascending: true });
      if (tData) {
        tasks.value = tData as Task[];
        let foundTask = null;
        if (currentRoom.value?.active_task_id) {
          foundTask = tasks.value.find(
            (t) => t.id === currentRoom.value?.active_task_id
          );
        } else if (tasks.value.length > 0) {
          foundTask = tasks.value[0];
        }
        activeTask.value = foundTask || null;
        if (foundTask?.is_revealed) await fetchRealVotes(foundTask.id);
        else if (
          currentPlayerId.value &&
          foundTask?.votes &&
          !foundTask.votes[currentPlayerId.value]
        )
          myLocalVote.value = null;
      }
    };

    await refreshData();

    const channel = supabase.channel(`room_${currentRoom.value.id}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${currentRoom.value.id}`,
        },
        (payload) => {
          currentRoom.value = payload.new as Room;
          if (payload.new.active_task_id) {
            myLocalVote.value = null;
            refreshData();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `room_id=eq.${currentRoom.value.id}`,
        },
        async (payload) => {
          if (
            payload.eventType === "UPDATE" &&
            payload.new.id === activeTask.value?.id
          ) {
            const newVotes = payload.new.votes || {};
            if (Object.keys(newVotes).length === 0) myLocalVote.value = null;
            if (payload.new.is_revealed && !payload.old?.is_revealed)
              await fetchRealVotes(payload.new.id);
          }
          await refreshData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${currentRoom.value.id}`,
        },
        async () => {
          await refreshData();
        }
      )
      .subscribe();
  };

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    if (data.user) user.value = data.user;
    router.push("/dashboard");
  };

  const fetchMyRooms = async () => {
    if (!user.value) return [];
    const userId = user.value.id || (user.value as any).sub;
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  };

  const deleteRoom = async (roomId: string) => {
    await supabase.from("rooms").delete().eq("id", roomId);
    return await fetchMyRooms();
  };

  return {
    user,
    isAdmin,
    currentRoom,
    tasks,
    activeTask,
    players,
    currentPlayerId,
    myLocalVote,
    login,
    createRoom,
    createTask,
    setActiveTask,
    findRoomByCode,
    joinRoom,
    tryRestoreSession,
    toggleRoomLock,
    submitVote,
    revealCards,
    resetRound,
    subscribeToRoom,
    fetchMyRooms,
    deleteRoom,
    updateTaskScore,
    clearState,
    adminQuickJoin,
  };
});
