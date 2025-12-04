export interface Task {
  id: string;
  room_id: string;
  title: string;
  description?: string;
  link_job?: string;
  link_figma?: string;
  final_score?: string;
  status: "pending" | "active" | "finished";
  votes: Record<string, string>;
  is_revealed: boolean;
}

export interface Room {
  id: string;
  code: string;
  created_at: string;
  name: string;
  is_revealed: boolean;
  owner_id: string;
  description?: string;
  active_task_id?: string;
}

export interface Player {
  id: string;
  created_at: string;
  room_id: string;
  name: string;
  vote: string | null;
  avatar?: string;
}

export const CARD_OPTIONS = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "?",
  "☕",
];
