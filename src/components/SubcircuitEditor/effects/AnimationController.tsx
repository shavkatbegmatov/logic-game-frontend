import React, { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const AnimationController = () => {
  const backgroundGlow = useMotionValue(0)
  const springGlow = useSpring(backgroundGlow, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const interval = setInterval(() => {
      backgroundGlow.set(Math.random())
    }, 3000)

    return () => clearInterval(interval)
  }, [backgroundGlow])

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, ${springGlow.get() * 0.05}) 0%, transparent 70%)`
      }}
    />
  )
}

export default AnimationController