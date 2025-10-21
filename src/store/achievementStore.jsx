import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import soundManager from '../utils/SoundManager';

const ACHIEVEMENTS = {
  FIRST_GATE: {
    id: 'first_gate',
    name: 'First Contact',
    description: 'Place your first gate',
    icon: '🚀',
    xp: 10,
  },
  FIRST_CIRCUIT: {
    id: 'first_circuit',
    name: 'Circuit Builder',
    description: 'Complete your first circuit',
    icon: '⚡',
    xp: 25,
  },
  WIRE_MASTER: {
    id: 'wire_master',
    name: 'Wire Master',
    description: 'Connect 10 wires',
    icon: '🔌',
    xp: 50,
  },
  GATE_COLLECTOR: {
    id: 'gate_collector',
    name: 'Gate Collector',
    description: 'Use all gate types',
    icon: '🎯',
    xp: 100,
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a level in under 30 seconds',
    icon: '⚡',
    xp: 75,
  },
  PERFECT_CIRCUIT: {
    id: 'perfect_circuit',
    name: 'Perfect Circuit',
    description: 'Complete a circuit with no errors',
    icon: '✨',
    xp: 150,
  },
  LOGIC_MASTER: {
    id: 'logic_master',
    name: 'Logic Master',
    description: 'Complete 10 levels',
    icon: '🧠',
    xp: 200,
  },
  SPACE_ENGINEER: {
    id: 'space_engineer',
    name: 'Space Engineer',
    description: 'Reach Commander Rank',
    icon: '👨‍🚀',
    xp: 500,
  },
};

const RANKS = [
  { name: 'Cadet', minXP: 0, color: '#9CA3AF' },
  { name: 'Technician', minXP: 100, color: '#3B82F6' },
  { name: 'Engineer', minXP: 250, color: '#10B981' },
  { name: 'Senior Engineer', minXP: 500, color: '#8B5CF6' },
  { name: 'Chief Engineer', minXP: 1000, color: '#F59E0B' },
  { name: 'Commander', minXP: 2000, color: '#EF4444' },
  { name: 'Admiral', minXP: 5000, color: '#FFD700' },
];

const useAchievementStore = create(
  persist(
    (set, get) => ({
      achievements: [],
      totalXP: 0,
      currentRank: RANKS[0],
      statistics: {
        gatesPlaced: 0,
        wiresConnected: 0,
        circuitsCompleted: 0,
        levelsCompleted: 0,
        totalPlayTime: 0,
        gateTypesUsed: new Set(),
      },

      // Unlock achievement
      unlockAchievement: (achievementId) => {
        const state = get();

        // Check if already unlocked
        if (state.achievements.find(a => a.id === achievementId)) {
          return;
        }

        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return;

        // Add achievement
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: Date.now(),
        };

        set(state => ({
          achievements: [...state.achievements, unlockedAchievement],
          totalXP: state.totalXP + achievement.xp,
        }));

        // Update rank
        const newXP = state.totalXP + achievement.xp;
        const newRank = RANKS.slice().reverse().find(rank => newXP >= rank.minXP);

        if (newRank && newRank.name !== state.currentRank.name) {
          set({ currentRank: newRank });

          // Show rank up notification
          toast.success(
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎖️</span>
              <div>
                <div className="font-bold">Rank Up!</div>
                <div className="text-sm opacity-80">You are now a {newRank.name}</div>
              </div>
            </div>,
            { duration: 5000 }
          );
        }

        // Show achievement notification
        toast.success(
          <div className="flex items-center gap-3">
            <span className="text-2xl">{achievement.icon}</span>
            <div>
              <div className="font-bold">{achievement.name}</div>
              <div className="text-sm opacity-80">{achievement.description}</div>
              <div className="text-xs mt-1">+{achievement.xp} XP</div>
            </div>
          </div>,
          { duration: 4000 }
        );

        // Play achievement sound
        soundManager.play('achievement');
      },

      // Update statistics
      updateStats: (statName, value) => {
        set(state => ({
          statistics: {
            ...state.statistics,
            [statName]: typeof value === 'function'
              ? value(state.statistics[statName])
              : value,
          },
        }));

        // Check for achievement triggers
        const stats = get().statistics;

        if (stats.gatesPlaced === 1) {
          get().unlockAchievement('FIRST_GATE');
        }

        if (stats.circuitsCompleted === 1) {
          get().unlockAchievement('FIRST_CIRCUIT');
        }

        if (stats.wiresConnected >= 10) {
          get().unlockAchievement('WIRE_MASTER');
        }

        if (stats.gateTypesUsed.size >= 9) {
          get().unlockAchievement('GATE_COLLECTOR');
        }

        if (stats.levelsCompleted >= 10) {
          get().unlockAchievement('LOGIC_MASTER');
        }

        if (get().currentRank.name === 'Commander') {
          get().unlockAchievement('SPACE_ENGINEER');
        }
      },

      // Get progress to next rank
      getProgressToNextRank: () => {
        const state = get();
        const currentRankIndex = RANKS.findIndex(r => r.name === state.currentRank.name);

        if (currentRankIndex === RANKS.length - 1) {
          return { percentage: 100, xpNeeded: 0, nextRank: null };
        }

        const nextRank = RANKS[currentRankIndex + 1];
        const currentRankXP = state.currentRank.minXP;
        const nextRankXP = nextRank.minXP;
        const progress = state.totalXP - currentRankXP;
        const needed = nextRankXP - currentRankXP;

        return {
          percentage: Math.floor((progress / needed) * 100),
          xpNeeded: nextRankXP - state.totalXP,
          nextRank,
        };
      },

      // Reset achievements (for testing)
      resetAchievements: () => {
        set({
          achievements: [],
          totalXP: 0,
          currentRank: RANKS[0],
          statistics: {
            gatesPlaced: 0,
            wiresConnected: 0,
            circuitsCompleted: 0,
            levelsCompleted: 0,
            totalPlayTime: 0,
            gateTypesUsed: new Set(),
          },
        });
      },
    }),
    {
      name: 'achievement-storage',
      partialize: (state) => ({
        achievements: state.achievements,
        totalXP: state.totalXP,
        currentRank: state.currentRank,
        statistics: {
          ...state.statistics,
          gateTypesUsed: Array.from(state.statistics.gateTypesUsed),
        },
      }),
      onRehydrateStorage: () => (state) => {
        // Convert gateTypesUsed array back to Set
        if (state && state.statistics && Array.isArray(state.statistics.gateTypesUsed)) {
          state.statistics.gateTypesUsed = new Set(state.statistics.gateTypesUsed);
        }
      },
    }
  )
);

export default useAchievementStore;