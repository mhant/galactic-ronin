import { GameMode, SaveSlotData, PlayerStats, ShipStats, Mission } from '../types/game';

const SAVE_KEY_PREFIX = 'galactic_ronin_slot';

export function getSlotStorageKey(slotIndex: number, _mode: GameMode = 'STORY'): string {
  return `${SAVE_KEY_PREFIX}_${slotIndex}`;
}

export function getAllSaveSlots(_mode: GameMode = 'STORY'): (SaveSlotData | null)[] {
  const slots: (SaveSlotData | null)[] = [null, null, null];
  for (let i = 0; i < 3; i++) {
    try {
      // Check primary unified key first
      let raw = localStorage.getItem(getSlotStorageKey(i));
      // Fallback check legacy mode-specific keys if not found
      if (!raw) {
        raw = localStorage.getItem(`${SAVE_KEY_PREFIX}_story_${i}`) ||
              localStorage.getItem(`${SAVE_KEY_PREFIX}_free_play_${i}`);
      }
      if (raw) {
        const parsed = JSON.parse(raw) as SaveSlotData;
        slots[i] = parsed;
      }
    } catch (e) {
      console.error(`Failed to parse save slot ${i}:`, e);
      slots[i] = null;
    }
  }
  return slots;
}

export function saveToSlot(
  slotIndex: number,
  mode: GameMode = 'STORY',
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
    const json = JSON.stringify(data);
    localStorage.setItem(getSlotStorageKey(slotIndex), json);
    // Also save legacy key for backward compatibility
    localStorage.setItem(`${SAVE_KEY_PREFIX}_story_${slotIndex}`, json);
    return true;
  } catch (e) {
    console.error(`Failed to write save slot ${slotIndex}:`, e);
    return false;
  }
}

export function loadFromSlot(_mode: GameMode = 'STORY', slotIndex: number): SaveSlotData | null {
  try {
    let raw = localStorage.getItem(getSlotStorageKey(slotIndex));
    if (!raw) {
      raw = localStorage.getItem(`${SAVE_KEY_PREFIX}_story_${slotIndex}`) ||
            localStorage.getItem(`${SAVE_KEY_PREFIX}_free_play_${slotIndex}`);
    }
    if (!raw) return null;
    return JSON.parse(raw) as SaveSlotData;
  } catch (e) {
    console.error(`Failed to read save slot ${slotIndex}:`, e);
    return null;
  }
}

export function deleteSlot(_mode: GameMode = 'STORY', slotIndex: number): boolean {
  try {
    localStorage.removeItem(getSlotStorageKey(slotIndex));
    localStorage.removeItem(`${SAVE_KEY_PREFIX}_story_${slotIndex}`);
    localStorage.removeItem(`${SAVE_KEY_PREFIX}_free_play_${slotIndex}`);
    return true;
  } catch (e) {
    console.error(`Failed to delete save slot ${slotIndex}:`, e);
    return false;
  }
}

export function exportSlotToJson(slotIndex: number): string | null {
  const slotData = loadFromSlot('STORY', slotIndex);
  if (!slotData) return null;
  return JSON.stringify(slotData, null, 2);
}

export function importSlotFromJson(
  slotIndex: number,
  jsonString: string
): { success: boolean; error?: string; data?: SaveSlotData } {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, error: 'Empty JSON payload provided.' };
    }

    const trimmed = jsonString.trim();
    const parsed = JSON.parse(trimmed) as Partial<SaveSlotData>;

    // Validate essential schema properties
    if (!parsed.player || typeof parsed.player !== 'object') {
      return { success: false, error: 'Invalid save data: missing player telemetry.' };
    }
    if (!parsed.ship || typeof parsed.ship !== 'object') {
      return { success: false, error: 'Invalid save data: missing starship specifications.' };
    }
    if (typeof parsed.player.credits !== 'number') {
      return { success: false, error: 'Invalid save data: corrupted player credits.' };
    }

    const sanitizedData: SaveSlotData = {
      slotIndex,
      mode: parsed.mode || 'STORY',
      timestamp: Date.now(),
      player: {
        credits: Math.max(0, parsed.player.credits || 0),
        hull: Math.max(10, parsed.player.hull || 100),
        maxHull: Math.max(10, parsed.player.maxHull || 100),
        fuel: Math.max(0, parsed.player.fuel || 100),
        maxFuel: Math.max(50, parsed.player.maxFuel || 100),
        cargoCapacity: Math.max(10, parsed.player.cargoCapacity || 30),
        inventory: Array.isArray(parsed.player.inventory) ? parsed.player.inventory : [],
      },
      ship: {
        x: parsed.ship.x || 0,
        y: parsed.ship.y || 0,
        vx: 0,
        vy: 0,
        rotation: parsed.ship.rotation || -Math.PI / 2,
        weaponPower: parsed.ship.weaponPower || 3,
        shieldPower: parsed.ship.shieldPower || 3,
        enginePower: parsed.ship.enginePower || 4,
        weaponLevel: parsed.ship.weaponLevel || 1,
        shieldLevel: parsed.ship.shieldLevel || 1,
        engineLevel: parsed.ship.engineLevel || 1,
        shipTier: Math.max(1, Math.min(100, parsed.ship.shipTier || 1)),
        shield: parsed.ship.shield || 100,
        maxShield: parsed.ship.maxShield || 100,
        isThrusting: false,
        isMining: false,
        hasTorpedoLauncher: !!parsed.ship.hasTorpedoLauncher,
        torpedoes: parsed.ship.torpedoes || 0,
        maxTorpedoes: parsed.ship.maxTorpedoes || 5,
        hasEmpGenerator: !!parsed.ship.hasEmpGenerator,
        empCooldown: 0,
        maxEmpCooldown: parsed.ship.maxEmpCooldown || 8,
        hasAutoTurrets: !!parsed.ship.hasAutoTurrets,
        turretCooldown: 0,
        drones: parsed.ship.drones || 3,
        maxDrones: parsed.ship.maxDrones || 5,
        droneCooldown: 0,
        hasBeamWeapon: !!parsed.ship.hasBeamWeapon,
        beamTargetId: null,
        armadaStance: parsed.ship.armadaStance || 'DEFEND',
        escorts: Array.isArray(parsed.ship.escorts) ? parsed.ship.escorts : [],
        maxEscorts: parsed.ship.maxEscorts || 0,
      },
      currentSectorId: parsed.currentSectorId || 'Sector-01',
      activeMission: parsed.activeMission || null,
      completedMissionsCount: parsed.completedMissionsCount || 0,
      storyProgress: parsed.storyProgress || 0,
      unlockedStoryChapterIds: Array.isArray(parsed.unlockedStoryChapterIds)
        ? parsed.unlockedStoryChapterIds
        : [],
    };

    const json = JSON.stringify(sanitizedData);
    localStorage.setItem(getSlotStorageKey(slotIndex), json);
    localStorage.setItem(`${SAVE_KEY_PREFIX}_story_${slotIndex}`, json);

    return { success: true, data: sanitizedData };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Malformed JSON format.' };
  }
}

export function formatSaveDate(timestamp: number): string {
  if (!timestamp) return 'Unknown Date';
  const d = new Date(timestamp);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
