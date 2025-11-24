import React from 'react';
import useAchievementStore from '../../store/achievementStore';
import { Trophy, Star, Zap } from 'lucide-react';

const AchievementDisplay = () => {
  const { totalXP, currentRank, getProgressToNextRank, statistics } = useAchievementStore();
  const progress = getProgressToNextRank();

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 rounded-lg p-4 space-y-4">
      {/* Rank Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
            style={{
              background: `linear-gradient(135deg, ${currentRank.color}40, ${currentRank.color}80)`,
              border: `2px solid ${currentRank.color}`,
              boxShadow: `0 0 20px ${currentRank.color}50`,
            }}
          >
            <Star className="w-6 h-6" style={{ color: currentRank.color }} />
          </div>
          <div>
            <div className="text-sm text-cyan-400 font-orbitron">RANK</div>
            <div className="text-lg font-bold" style={{ color: currentRank.color }}>
              {currentRank.name}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">TOTAL XP</div>
          <div className="text-xl font-bold text-cyan-400">{totalXP}</div>
        </div>
      </div>

      {/* XP Progress Bar */}
      {progress.nextRank && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress to {progress.nextRank.name}</span>
            <span>{progress.xpNeeded} XP needed</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
              style={{
                width: `${progress.percentage}%`,
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              }}
            />
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-cyan-400/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <div className="text-sm">
            <span className="text-gray-400">Gates:</span>
            <span className="ml-2 font-bold">{statistics.gatesPlaced}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-green-400" />
          <div className="text-sm">
            <span className="text-gray-400">Circuits:</span>
            <span className="ml-2 font-bold">{statistics.circuitsCompleted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementDisplay;