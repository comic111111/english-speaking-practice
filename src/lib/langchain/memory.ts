interface MemoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface FeedbackEntry {
  round: number;
  feedback: string;
  timestamp: number;
}

interface SessionMemory {
  messages: MemoryEntry[];
  feedbacks: FeedbackEntry[];
  roundCount: number;
}

const memoryStore = new Map<string, SessionMemory>();

export function getOrCreateMemory(sessionId: string): SessionMemory {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, {
      messages: [],
      feedbacks: [],
      roundCount: 0,
    });
  }
  return memoryStore.get(sessionId)!;
}

export async function addMessageToMemory(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const memory = getOrCreateMemory(sessionId);
  memory.messages.push({ role, content });
  
  if (role === 'user') {
    memory.roundCount++;
  }
}

export async function getHistoryFromMemory(sessionId: string): Promise<Array<{ role: string; content: string }>> {
  const memory = getOrCreateMemory(sessionId);
  return memory.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function addFeedbackToMemory(
  sessionId: string,
  feedback: string
): Promise<void> {
  const memory = getOrCreateMemory(sessionId);
  memory.feedbacks.push({
    round: memory.roundCount,
    feedback,
    timestamp: Date.now(),
  });
}

export async function getFeedbacksFromMemory(sessionId: string): Promise<FeedbackEntry[]> {
  const memory = getOrCreateMemory(sessionId);
  return memory.feedbacks;
}

export function getRoundCount(sessionId: string): number {
  const memory = getOrCreateMemory(sessionId);
  return memory.roundCount;
}

export function clearMemory(sessionId: string): void {
  memoryStore.delete(sessionId);
}

export function clearAllMemories(): void {
  memoryStore.clear();
}