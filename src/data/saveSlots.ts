import { GameMode, SaveSlotData, PlayerStats, ShipStats, Mission } from '../types/game';

const SAVE_KEY_PREFIX = 'galactic_ronin_slot';

export function getSlotStorageKey(mode: GameMode, slotIndex: number): string {
  return `${SAVE_KEY_PREFIX}_${mode.toLowerCase()}_${slotIndex}`;
}

export function getAllSaveSlots(mode: GameMode): (SaveSlotData | null)[] {
  const slots: (SaveSlotData | null)[] = [null, null, null];
  for (let i = 0; i < 3; i++) {
    try {
      const raw = localStorage.getItem(getSlotStorageKey(mode, i));
      if (raw) {
        slots[i] = JSON.parse(raw) as SaveSlotData;
      }
    } catch (e) {
      console.error(`Failed to parse save slot ${i} for mode ${mode}:`, e);
      slots[i] = null;
    }
  }
  return slots;
}

export function saveToSlot(
  slotIndex: number,
  mode: GameMode,
  player: PlayerStats,
  ship: ShipStats,
  currentSectorId: string,
  activeMission: Mission | null,
  completedMissionsCount: number,
  storyProgress = 0,
  unlockedStoryChapterIds: string[] = []
): boolean {
  try {
    const data: SaveSlotData = {
      slotIndex,
      mode,
      timestamp: Date.now(),
      player: JSON.parse(JSON.stringify(player)),
      ship: JSON.parse(JSON.stringify(ship)),
      currentSectorId,
      activeMission: activeMission ? JSON.parse(JSON.stringify(activeMission)) : null,
      completedMissionsCount,
      storyProgress,
      unlockedStoryChapterIds,
    };
    localStorage.setItem(getSlotStorageKey(mode, slotIndex), JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Failed to write save slot ${slotIndex}:`, e);
    return false;
  }
}

export function loadFromSlot(mode: GameMode, slotIndex: number): SaveSlotData | null {
  try {
    const raw = localStorage.getItem(getSlotStorageKey(mode, slotIndex));
    if (!raw) return null;
    return JSON.parse(raw) as SaveSlotData;
  } catch (e) {
    console.error(`Failed to read save slot ${slotIndex}:`, e);
    return null;
  }
}

export function deleteSlot(mode: GameMode, slotIndex: number): boolean {
  try {
    localStorage.removeItem(getSlotStorageKey(mode, slotIndex));
    return true;
  } catch (e) {
    console.error(`Failed to delete save slot ${slotIndex}:`, e);
    return false;
  }
}

export function formatSaveDate(timestamp: number): string {
  if (!timestamp) return 'Unknown Date';
  const d = new Date(timestamp);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
