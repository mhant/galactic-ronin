export interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  triggerType: 'PROLOGUE' | 'MISSION_MILESTONE' | 'CHASSIS_UPGRADE' | 'WEAPON_UPGRADE' | 'CUSTOM';
  triggerBadge: string;
  loreText: string[];
  quote: string;
  illustrationIcon: 'SWORD' | 'SHIP' | 'ARMADA' | 'STATION' | 'NEBULA' | 'TITAN' | 'CHRONICLE';
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'ch_01_exile',
    chapterNumber: 1,
    title: 'The Wandering Blade',
    subtitle: 'Awakening in Deep Space Sector-01',
    triggerType: 'PROLOGUE',
    triggerBadge: 'STORY PROLOGUE',
    loreText: [
      'Stripped of rank and ancestral domain after the fall of the Orion Shogunate, you drift through the silent black—a masterless Ronin of the stars.',
      'Your strike-fighter is battered and your fuel reserves are low, but the bushido code of the star-ronin remains etched in your neural core. In this lawless frontier, every credit earned is another step toward reclaiming your destiny.',
      'The automated relays of Sector-01 flicker with pirate chatter and merchant distress beacons. The hyperlanes await your blade.',
    ],
    quote: 'A blade without a master answers only to the stars.',
    illustrationIcon: 'SWORD',
  },
  {
    id: 'ch_02_first_blood',
    chapterNumber: 2,
    title: 'First Blood on the Trade Lanes',
    subtitle: 'The Merchant Guild Takes Notice',
    triggerType: 'MISSION_MILESTONE',
    triggerBadge: 'CONTRACT COMPLETE #1',
    loreText: [
      'Your first mission payload has been delivered and the rogue marauders have learned the price of crosshairs locked on a Ronin vessel.',
      'Sub-space comms across the sector hum with whispers of an elite pilot operating out of the frontier depots. Freight captains and station overseers who once dismissed you now nod with measured respect.',
      'With credits filling your vaults and plasma capacitors calibrated, you realize this sector is only the threshold of a greater cosmic struggle.',
    ],
    quote: 'Trust in the void is purchased with laser fire and flawless execution.',
    illustrationIcon: 'STATION',
  },
  {
    id: 'ch_03_tempered_steel',
    chapterNumber: 3,
    title: 'Tempered in Starfire',
    subtitle: 'Chassis Evolution: Tier 5 Hammerhead',
    triggerType: 'CHASSIS_UPGRADE',
    triggerBadge: 'CHASSIS TIER 5',
    loreText: [
      'Your vessel has undergone radical transformation. Heavy reinforced armor plating now wraps around the cockpit, and twin forward kinetic prow arrays gleam in the starlight.',
      'You recall the lessons of the Shogunate shipyard masters: a true starship is not mere titanium and wires, but the physical armor of the pilot’s soul.',
      'Outlaw interceptors that once dared pursue you now bank hard away upon scanning your energy signature. The hunter has become the sovereign.',
    ],
    quote: 'Steel tempered in nebula plasma never bends, never yields.',
    illustrationIcon: 'SHIP',
  },
  {
    id: 'ch_04_syndicate_shadows',
    chapterNumber: 4,
    title: 'Shadows of the Crimson Syndicate',
    subtitle: 'Decrypted Blackbox Transmissions',
    triggerType: 'MISSION_MILESTONE',
    triggerBadge: 'CONTRACT COMPLETE #3',
    loreText: [
      'Recovered nav-logs from downed outlaw boss vessels paint a grim picture. The pirate raids across Sector-01 are not random banditry—they are coordinated probes by a ruthless galactic cartel.',
      'Local station outposts lack the firepower to withstand a full-scale fleet assault. They look to you—not as a hired mercenary, but as the vanguard of their defense.',
      'You ready your weapons and adjust your neural harness. The Ronin will hold the line.',
    ],
    quote: 'When civilization fractures into anarchy, the Ronin becomes the law.',
    illustrationIcon: 'NEBULA',
  },
  {
    id: 'ch_05_armada_rises',
    chapterNumber: 5,
    title: 'Wings of the Ronin Armada',
    subtitle: 'Chassis Evolution: Tier 10 Trident Battlecruiser',
    triggerType: 'CHASSIS_UPGRADE',
    triggerBadge: 'CHASSIS TIER 10',
    loreText: [
      'You no longer fly alone in the cold dark. Veteran escort fighters and heavy gunships have synchronized their navigation matrices to your command.',
      'Aboard your elongated Battlecruiser, the tactical holographic war-table illuminates multiple patrol vectors. With escort wings maintaining close formation and auto-turrets tracking targets, you command the battlefield.',
      'The pirate cartels realize with growing dread that they are no longer facing a single fugitive, but a disciplined star armada.',
    ],
    quote: 'A single strike pierces; a coordinated armada reshapes the cosmos.',
    illustrationIcon: 'ARMADA',
  },
  {
    id: 'ch_06_carrier_command',
    chapterNumber: 6,
    title: 'The Hyperion Fleet Command',
    subtitle: 'Chassis Evolution: Tier 15 Hyperion Fleet Carrier',
    triggerType: 'CHASSIS_UPGRADE',
    triggerBadge: 'CHASSIS TIER 15',
    loreText: [
      'Behold the supreme naval fortress under your control. Dual flight runway decks, side hangar launch bays, and quantum phaser lance emitters hum with cataclysmic energy.',
      'Fighter squadrons launch continuously from your catapult decks, and photon torpedo salvos decimate hostile armadas before they can enter weapon range.',
      'From the central observation bridge, you gaze upon the shimmering accretion disc of the sector. The Shogunate is gone, but from its ashes, you have forged something greater.',
    ],
    quote: 'True power is not destruction, but the discipline to guard the defenseless.',
    illustrationIcon: 'TITAN',
  },
  {
    id: 'ch_07_celestial_master',
    chapterNumber: 7,
    title: 'The Celestial Ronin',
    subtitle: 'Ascension to Cosmic Apex Hegemony',
    triggerType: 'MISSION_MILESTONE',
    triggerBadge: 'CONTRACT COMPLETE #7',
    loreText: [
      'Songs of your odyssey echo across every spaceport from the core industrial hubs to the perilous fringes of the Dark Matter Abyss.',
      'You have brought order to the chaotic frontiers, avenged the fallen, and established an enduring sanctuary for wanderers and free pilots alike.',
      'As your titan flagship folds space-time and engages the hyperjump vortex toward uncharted galaxies, your name is forever etched among the stars: The Galactic Ronin.',
    ],
    quote: 'The path of the Ronin has no final destination—only infinite horizons across eternity.',
    illustrationIcon: 'CHRONICLE',
  },
];

export function getStoryChapterForEvent(
  event: {
    type: 'MISSION_COMPLETE' | 'CHASSIS_UPGRADE' | 'WEAPON_UPGRADE';
    completedMissionsCount: number;
    shipTier: number;
    weaponLevel: number;
    missionTitle?: string;
    missionRewardCredits?: number;
  },
  alreadyUnlockedIds: string[]
): StoryChapter | null {
  const unlockedSet = new Set(alreadyUnlockedIds);

  // Check specific milestone story chapters first
  if (event.type === 'MISSION_COMPLETE') {
    if (event.completedMissionsCount === 1 && !unlockedSet.has('ch_02_first_blood')) {
      return STORY_CHAPTERS.find((c) => c.id === 'ch_02_first_blood') || null;
    }
    if (event.completedMissionsCount === 3 && !unlockedSet.has('ch_04_syndicate_shadows')) {
      return STORY_CHAPTERS.find((c) => c.id === 'ch_04_syndicate_shadows') || null;
    }
    if (event.completedMissionsCount === 7 && !unlockedSet.has('ch_07_celestial_master')) {
      return STORY_CHAPTERS.find((c) => c.id === 'ch_07_celestial_master') || null;
    }

    // Dynamic Mission Chapter for subsequent completions
    return {
      id: `dyn_mission_${Date.now()}`,
      chapterNumber: event.completedMissionsCount + 1,
      title: `Contract Fulfilled: ${event.missionTitle || 'Frontier Assignment'}`,
      subtitle: `Log Entry • Mission #${event.completedMissionsCount} Completed`,
      triggerType: 'MISSION_MILESTONE',
      triggerBadge: `MISSION #${event.completedMissionsCount}`,
      loreText: [
        `Another high-stakes contract has been executed with flawless precision. Your reputation grows with each completed assignment.`,
        `The client transferred +${(event.missionRewardCredits || 1000).toLocaleString()} Credits directly into your escrow vaults. Station merchants across the sector have noted your reliability.`,
        `You inspect your vessel's telemetry diagnostics. Every skirmish sharpens your reflexes, and every delivery expands your reach.`,
      ],
      quote: 'Duty fulfilled without hesitation. The code of the Ronin endures.',
      illustrationIcon: 'STATION',
    };
  }

  if (event.type === 'CHASSIS_UPGRADE') {
    if (event.shipTier >= 5 && event.shipTier < 10 && !unlockedSet.has('ch_03_tempered_steel')) {
      return STORY_CHAPTERS.find((c) => c.id === 'ch_03_tempered_steel') || null;
    }
    if (event.shipTier >= 10 && event.shipTier < 15 && !unlockedSet.has('ch_05_armada_rises')) {
      return STORY_CHAPTERS.find((c) => c.id === 'ch_05_armada_rises') || null;
    }
    if (event.shipTier >= 15 && !unlockedSet.has('ch_06_carrier_command')) {
      return STORY_CHAPTERS.find((c) => c.id === 'ch_06_carrier_command') || null;
    }

    // Dynamic Chassis Evolution Chapter for milestone tier upgrades (e.g. 2, 8, 12, 18, 20, 25, 30, etc.)
    if (event.shipTier % 5 === 0 || event.shipTier === 2 || event.shipTier === 8 || event.shipTier >= 20) {
      return {
        id: `dyn_chassis_${event.shipTier}_${Date.now()}`,
        chapterNumber: event.shipTier,
        title: `Chassis Evolution: Tier ${event.shipTier} Flagship`,
        subtitle: `Naval Architecture Milestone Upgrade`,
        triggerType: 'CHASSIS_UPGRADE',
        triggerBadge: `TIER ${event.shipTier} CHASSIS`,
        loreText: [
          `Your shipyard engineers have finished structural retrofits, reinforcing the hull frame with advanced composite titanium alloy and high-density armor plates.`,
          `This Tier ${event.shipTier} chassis unlocks expanded cargo bays, enhanced deflector shield hardpoints, and formidable kinetic ramming mass.`,
          `As your vessel clears the station docking gantry, nearby civilian transports marvel at the majestic warship cutting through the starlight.`,
        ],
        quote: 'A warrior’s vessel is a temple of iron, plasma, and iron will.',
        illustrationIcon: event.shipTier >= 15 ? 'TITAN' : event.shipTier >= 10 ? 'ARMADA' : 'SHIP',
      };
    }
  }

  if (event.type === 'WEAPON_UPGRADE') {
    if (event.weaponLevel === 2 || event.weaponLevel === 5 || event.weaponLevel === 8 || event.weaponLevel === 10) {
      return {
        id: `dyn_weapon_${event.weaponLevel}_${Date.now()}`,
        chapterNumber: event.weaponLevel,
        title: `Weapon Overhaul: Level ${event.weaponLevel} Battery`,
        subtitle: `Plasma Harmonic Emitter Refit`,
        triggerType: 'WEAPON_UPGRADE',
        triggerBadge: `LASER LVL ${event.weaponLevel}`,
        loreText: [
          `Your plasma cannons have been recalibrated to Level ${event.weaponLevel}, channeling overcharged magnetic containment coils.`,
          `Direct energy output and bolt coherence are dramatically increased, slicing through hardened outlaw shields with surgical ease.`,
          `In the harsh frontier, superior firepower is the ultimate guarantor of survival.`,
        ],
        quote: 'Let your fire be as swift and decisive as a flash of lightning.',
        illustrationIcon: 'SWORD',
      };
    }
  }

  return null;
}
