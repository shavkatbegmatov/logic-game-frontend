import React, { useEffect, useState } from 'react';
import { Group, Circle, Ring } from 'react-konva';
import { SPACE_COLORS } from '@/constants/spaceTheme';

const GateParticleEffect = ({ x, y, trigger, type = 'click' }) => {
  const [particles, setParticles] = useState([]);
  const [rings, setRings] = useState([]);

  useEffect(() => {
    if (!trigger) return;

    // Generate particles
    const newParticles = [];
    const particleCount = type === 'click' ? 15 : 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = Math.random() * 3 + 2;
      const size = Math.random() * 3 + 1;
      const color = SPACE_COLORS.effects.particleColors[
        Math.floor(Math.random() * SPACE_COLORS.effects.particleColors.length)
      ];

      newParticles.push({
        id: Date.now() + i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: 1,
      });
    }

    // Generate expanding rings
    const newRings = [];
    if (type === 'click') {
      for (let i = 0; i < 3; i++) {
        newRings.push({
          id: Date.now() + 100 + i,
          radius: 0,
          opacity: 0.8,
          delay: i * 100,
        });
      }
    }

    setParticles(newParticles);
    setRings(newRings);

    // Animation loop
    const interval = setInterval(() => {
      setParticles(prev => {
        return prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx * 0.98,
          vy: p.vy * 0.98,
          life: p.life - 0.02,
        })).filter(p => p.life > 0);
      });

      setRings(prev => {
        return prev.map(r => ({
          ...r,
          radius: r.radius < 50 ? r.radius + 2 : r.radius,
          opacity: r.opacity > 0 ? r.opacity - 0.02 : 0,
        })).filter(r => r.opacity > 0);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [trigger, type]);

  return (
    <Group x={x} y={y}>
      {/* Expanding rings */}
      {rings.map(ring => (
        <Ring
          key={ring.id}
          x={0}
          y={0}
          innerRadius={ring.radius}
          outerRadius={ring.radius + 2}
          stroke={SPACE_COLORS.effects.glowColor}
          strokeWidth={1}
          opacity={ring.opacity}
        />
      ))}

      {/* Particles */}
      {particles.map(particle => (
        <Group key={particle.id}>
          {/* Particle glow */}
          <Circle
            x={particle.x}
            y={particle.y}
            radius={particle.size * 2}
            fill={particle.color}
            opacity={particle.life * 0.3}
            shadowBlur={10}
            shadowColor={particle.color}
          />
          {/* Particle core */}
          <Circle
            x={particle.x}
            y={particle.y}
            radius={particle.size}
            fill={SPACE_COLORS.effects.sparkColor}
            opacity={particle.life}
          />
        </Group>
      ))}
    </Group>
  );
};

export default GateParticleEffect;