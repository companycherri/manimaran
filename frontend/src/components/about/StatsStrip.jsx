import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// Parse number and suffix from strings like "50+", "10K+", "100%"
function parseStatNumber(str) {
  const match = String(str).match(/^(\d+\.?\d*)(.*)$/);
  if (!match) return { num: 0, suffix: str };
  return { num: parseFloat(match[1]), suffix: match[2] };
}

function useCountUp(target, active, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active) {
      if (!hasAnimated.current) {
        setCount(0);
      }
      return;
    }
    // Cancel any previous animation
    cancelAnimationFrame(rafRef.current);
    hasAnimated.current = false;
    setCount(0);

    let start = null;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCount(target);
        hasAnimated.current = true;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);

  return count;
}

function StatBox({ stat, index, isLast }) {
  const [hovered, setHovered] = useState(false);
  const { num, suffix } = parseStatNumber(stat.number);
  const count = useCountUp(num, hovered);

  return (
    <React.Fragment>
      <motion.div
        className="flex flex-col items-center justify-center text-center px-6 py-4 rounded-xl cursor-default"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 18px 4px rgba(254,216,0,0.45)',
        }}
        style={{ border: '1px solid transparent', minWidth: 140 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="relative flex items-center justify-center mb-3">
          <svg width="100" height="88" viewBox="0 0 100 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon
              points="50,3 97,25 97,63 50,85 3,63 3,25"
              stroke="#FED800"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
          </svg>
          <span
            className="absolute text-white font-black"
            style={{ fontSize: '2rem', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            {hovered ? `${count}${suffix}` : stat.number}
          </span>
        </div>
        <p className="text-[#FED800] font-semibold text-sm leading-tight whitespace-nowrap">
          {stat.label}
        </p>
      </motion.div>
      {!isLast && (
        <div
          className="hidden md:block flex-shrink-0"
          style={{
            width: '1px',
            height: '80px',
            background: 'linear-gradient(to bottom, transparent, rgba(255,215,0,0.4), transparent)'
          }}
        />
      )}
    </React.Fragment>
  );
}

export default function StatsStrip() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    base44.entities.AboutStat.filter({ active: true }, 'order').then(setStats).catch(() => {});
  }, []);

  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full mb-12"
    >
      <div
        className="w-full"
        style={{ background: 'linear-gradient(135deg, #5C2A1E 0%, #7A3B2E 50%, #5C2A1E 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-wrap md:flex-nowrap items-center justify-around">
            {stats.map((stat, index) => (
              <StatBox key={stat.id} stat={stat} index={index} isLast={index === stats.length - 1} />
            ))}
          </div>
        </div>
        {/* Bottom gold accent line */}
        <div
          className="h-1"
          style={{ background: 'linear-gradient(to right, transparent, #FED800 30%, #FED800 70%, transparent)' }}
        />
      </div>
    </motion.div>
  );
}