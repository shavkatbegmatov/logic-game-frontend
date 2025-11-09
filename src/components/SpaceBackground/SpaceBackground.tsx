import React, { useEffect, useRef } from 'react';
import './SpaceBackground.css';

const SpaceBackground = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const nebulaRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize stars
    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < 200; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          speed: Math.random() * 0.5 + 0.1,
          brightness: Math.random(),
        });
      }
    };

    // Initialize nebula clouds
    const initNebula = () => {
      nebulaRef.current = [];
      for (let i = 0; i < 5; i++) {
        nebulaRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 200 + 100,
          color: i % 2 === 0 ? 'rgba(138, 43, 226, 0.1)' : 'rgba(0, 191, 255, 0.1)',
          speed: Math.random() * 0.2 + 0.05,
        });
      }
    };

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula clouds
      nebulaRef.current.forEach((nebula) => {
        const gradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.radius
        );
        gradient.addColorStop(0, nebula.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        nebula.x -= nebula.speed;
        if (nebula.x + nebula.radius < 0) {
          nebula.x = canvas.width + nebula.radius;
        }
      });

      // Draw and animate stars
      starsRef.current.forEach((star) => {
        star.brightness += (Math.random() - 0.5) * 0.1;
        star.brightness = Math.max(0.3, Math.min(1, star.brightness));

        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect for bright stars
        if (star.brightness > 0.8) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'white';
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }
      });

      requestAnimationFrame(animate);
    };

    initStars();
    initNebula();
    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      initNebula();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-background">
      <canvas ref={canvasRef} className="space-canvas" />
      <div className="space-overlay" />
      <div className="scanline" />
      <div className="space-grid" />
    </div>
  );
};

export default SpaceBackground;