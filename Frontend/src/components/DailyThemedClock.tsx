import { motion } from "framer-motion";

interface DailyThemedClockProps {
  currentTime: Date;
}

export const DailyThemedClock = ({ currentTime }: DailyThemedClockProps) => {
  const currentDayOfWeek = currentTime.getDay();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      className="flex-shrink-0"
    >
      <div className="relative w-28 h-28 sm:w-36 sm:h-36">
        
        {/* SUNDAY (0) - Ancient Mystical Clock */}
        {currentDayOfWeek === 0 && (
        <>
          {/* Outer mystical aura - pulsing ethereal glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/40 via-purple-500/40 to-cyan-500/40 blur-2xl"
          ></motion.div>

          {/* Ancient ornate frame - outer decorative ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="url(#grad1)" strokeWidth="0.5" opacity="0.6" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="url(#grad2)" strokeWidth="0.3" opacity="0.4" strokeDasharray="2,3" />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(var(--secondary))" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Main clock face - vintage aged paper look */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-amber-50/10 via-purple-50/5 to-slate-50/10 backdrop-blur-sm border-2 border-amber-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
            {/* Aged paper texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.1),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(147,51,234,0.1),transparent_70%)]"></div>
            
            {/* Slow rotating mystical symbols background */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10"
            >
              <div className="absolute inset-0 text-primary/50 flex items-center justify-center text-4xl font-serif">
                ✦
              </div>
            </motion.div>

            {/* Roman numeral markers */}
            <div className="absolute inset-0">
              {['XII', 'III', 'VI', 'IX'].map((numeral, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full flex items-center justify-center"
                  style={{ transform: `rotate(${i * 90}deg)` }}
                >
                  <div 
                    className="text-[10px] sm:text-xs font-serif font-bold text-amber-600/70 dark:text-amber-400/70"
                    style={{ transform: `rotate(${-i * 90}deg) translateY(-${i === 0 ? '32' : '32'}px)` }}
                  >
                    {numeral}
                  </div>
                </div>
              ))}
            </div>

            {/* Ornate hour markers */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="w-1 h-1.5 sm:h-2 mx-auto bg-gradient-to-b from-amber-600 to-purple-600 opacity-60" 
                       style={{ 
                         clipPath: i % 3 === 0 ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none',
                         width: i % 3 === 0 ? '6px' : '2px'
                       }}
                  ></div>
                </div>
              ))}
            </div>

            {/* Center time display with mystical glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Glowing effect behind time */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-500/20 blur-lg rounded-full scale-150"></div>
                
                {/* Time display */}
                <div className="relative text-center px-2">
                  <motion.div 
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(251,191,36,0.5)",
                        "0 0 20px rgba(147,51,234,0.5)",
                        "0 0 10px rgba(251,191,36,0.5)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-br from-amber-600 via-purple-600 to-amber-600 bg-clip-text text-transparent tracking-tight leading-none"
                  >
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </motion.div>
                  <div className="text-[9px] sm:text-[11px] text-amber-700/70 dark:text-amber-400/70 mt-0.5 font-serif tracking-widest uppercase">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating mystical particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -10, 0],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"
              ></motion.div>
              <motion.div
                animate={{ 
                  x: [0, -10, 0],
                  y: [0, 10, 0],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"
              ></motion.div>
              <motion.div
                animate={{ 
                  x: [0, 5, 0],
                  y: [0, -5, 0],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                className="absolute top-1/2 right-1/3 w-0.5 h-0.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
              ></motion.div>
            </div>

            {/* Center ornate decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="w-2 h-2 rounded-full border-2 border-amber-500/40"
              ></motion.div>
            </div>
          </div>

          {/* Outermost decorative ring with ancient symbols */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-30"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 text-xs">✧</div>
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-purple-500 text-xs">✦</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-cyan-500 text-xs">✧</div>
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 text-xs">✦</div>
          </motion.div>
        </>
        )}

        {/* MONDAY (1) - Horror Gothic Dark Clock */}
        {currentDayOfWeek === 1 && (
        <>
          {/* Eerie dark aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-red-900/50 via-gray-900/50 to-black/50 blur-2xl"
          ></motion.div>

          {/* Cracked outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-red-900/40 shadow-2xl shadow-red-900/50">
            <div className="absolute inset-0 rounded-full" style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(139, 0, 0, 0.3) 10%, transparent 20%, rgba(139, 0, 0, 0.3) 30%, transparent 40%)'
            }}></div>
          </div>

          {/* Main clock face - dark gothic */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-gray-900/90 via-black/90 to-red-950/90 backdrop-blur-sm border-2 border-red-900/60 shadow-2xl shadow-red-900/30 overflow-hidden">
            {/* Blood drip effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-red-600/50 to-transparent"></div>
            <div className="absolute top-0 left-1/3 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-red-700/40 to-transparent"></div>
            
            {/* Flickering shadows */}
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent"
            ></motion.div>

            {/* Gothic cross markers */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="w-1 h-2 mx-auto bg-gradient-to-b from-red-600 to-gray-600 opacity-70" 
                       style={{ 
                         clipPath: i % 3 === 0 ? 'polygon(50% 0%, 60% 100%, 40% 100%)' : 'polygon(50% 0%, 55% 100%, 45% 100%)'
                       }}
                  ></div>
                </div>
              ))}
            </div>

            {/* Time display with horror glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-center">
                <motion.div 
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(220, 38, 38, 0.8)",
                      "0 0 30px rgba(139, 0, 0, 0.8)",
                      "0 0 20px rgba(220, 38, 38, 0.8)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl sm:text-3xl font-mono font-bold text-red-500 tracking-tight leading-none"
                >
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </motion.div>
                <div className="text-[9px] sm:text-[11px] text-red-700/70 mt-0.5 font-mono tracking-widest uppercase">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            </div>

            {/* Floating skulls/crosses */}
            <motion.div
              animate={{ y: [0, -5, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 text-red-600/40 text-xs"
            >☠</motion.div>
            <motion.div
              animate={{ y: [0, 5, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 right-1/4 text-gray-500/40 text-xs"
            >✝</motion.div>
          </div>

          {/* Outer decay ring */}
          <div className="absolute inset-0 rounded-full border border-red-950/40"></div>
        </>
        )}

        {/* TUESDAY (2) - Futuristic Neon Cyberpunk Clock */}
        {currentDayOfWeek === 2 && (
        <>
          {/* Neon glow aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/50 via-purple-500/50 to-pink-500/50 blur-2xl"
          ></motion.div>

          {/* Rotating tech rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="cyan" strokeWidth="0.5" opacity="0.6" strokeDasharray="5,5" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="magenta" strokeWidth="0.3" opacity="0.4" strokeDasharray="3,7" />
            </svg>
          </motion.div>

          {/* Main digital display */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-sm border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/50 overflow-hidden">
            {/* Scanline effect */}
            <motion.div
              animate={{ y: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-1"
            ></motion.div>

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
              backgroundSize: '10px 10px'
            }}></div>

            {/* Digital markers */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="w-1 h-2 mx-auto bg-gradient-to-b from-cyan-400 to-pink-500 shadow-lg shadow-cyan-500/50"></div>
                </motion.div>
              ))}
            </div>

            {/* Time display - digital glitch */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-center">
                <motion.div 
                  animate={{ 
                    textShadow: [
                      "0 0 10px rgba(6, 182, 212, 1), 0 0 20px rgba(236, 72, 153, 0.5)",
                      "0 0 20px rgba(236, 72, 153, 1), 0 0 30px rgba(6, 182, 212, 0.5)",
                      "0 0 10px rgba(6, 182, 212, 1), 0 0 20px rgba(236, 72, 153, 0.5)"
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-xl sm:text-3xl font-mono font-bold text-cyan-400 tracking-wider leading-none"
                >
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </motion.div>
                <div className="text-[9px] sm:text-[11px] text-pink-500 mt-0.5 font-mono tracking-widest uppercase">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            </div>

            {/* Digital particles */}
            <motion.div
              animate={{ x: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400"
            ></motion.div>
            <motion.div
              animate={{ x: [0, -10, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-pink-500 rounded-full shadow-lg shadow-pink-500"
            ></motion.div>
          </div>

          {/* Outer neon ring */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/30"></div>
        </>
        )}

        {/* WEDNESDAY (3) - Nature Zen Peaceful Clock */}
        {currentDayOfWeek === 3 && (
        <>
          {/* Soft nature aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/40 via-teal-500/40 to-blue-500/40 blur-2xl"
          ></motion.div>

          {/* Flowing water rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.5" strokeDasharray="10,5" />
            </svg>
          </motion.div>

          {/* Main zen clock face */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-50/20 via-teal-50/15 to-green-50/20 backdrop-blur-md border-2 border-green-500/30 shadow-2xl shadow-green-500/20 overflow-hidden">
            {/* Bamboo texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]"></div>
            
            {/* Gentle leaf pattern */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10"
            >
              <div className="absolute inset-0 text-green-600 flex items-center justify-center text-3xl">🍃</div>
            </motion.div>

            {/* Natural markers - stones */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className={`mx-auto rounded-full ${i % 3 === 0 ? 'w-2 h-2' : 'w-1 h-1'} bg-gradient-to-b from-green-600 to-teal-600 opacity-50`}></div>
                </div>
              ))}
            </div>

            {/* Peaceful time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-center">
                <div className="text-xl sm:text-3xl font-light text-green-700 dark:text-green-400 tracking-wide leading-none">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-[9px] sm:text-[11px] text-teal-600 dark:text-teal-400 mt-0.5 font-light tracking-widest uppercase">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            </div>

            {/* Floating leaves */}
            <motion.div
              animate={{ y: [0, -8, 0], x: [0, 3, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 text-green-500/40 text-sm"
            >🍃</motion.div>
            <motion.div
              animate={{ y: [0, 8, 0], x: [0, -3, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute bottom-1/4 right-1/4 text-teal-500/40 text-sm"
            >🌿</motion.div>
          </div>

          {/* Outer peaceful ring */}
          <div className="absolute inset-0 rounded-full border border-green-500/20"></div>
        </>
        )}

        {/* THURSDAY (4) - Motivational Energetic Sunrise Clock */}
        {currentDayOfWeek === 4 && (
        <>
          {/* Energetic sunrise aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/60 via-yellow-500/60 to-red-500/60 blur-2xl"
          ></motion.div>

          {/* Radiating energy rays */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${i * 45}deg)` }}
              >
                <div className="w-1 h-full mx-auto bg-gradient-to-b from-transparent via-orange-500/20 to-transparent"></div>
              </div>
            ))}
          </motion.div>

          {/* Main motivational clock face */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-orange-400/30 via-yellow-400/20 to-red-400/30 backdrop-blur-sm border-2 border-orange-500/50 shadow-2xl shadow-orange-500/40 overflow-hidden">
            {/* Pulsing energy core */}
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full"
            ></motion.div>

            {/* Explosive markers */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="w-2 h-2 mx-auto rounded-full bg-gradient-to-b from-orange-500 to-red-500 shadow-lg shadow-orange-500"></div>
                </motion.div>
              ))}
            </div>

            {/* Bold time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-center">
                <motion.div 
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(249, 115, 22, 1)",
                      "0 0 30px rgba(234, 179, 8, 1)",
                      "0 0 20px rgba(249, 115, 22, 1)"
                    ],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xl sm:text-3xl font-black text-orange-500 tracking-tight leading-none"
                >
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </motion.div>
                <div className="text-[9px] sm:text-[11px] text-yellow-600 font-bold mt-0.5 tracking-widest uppercase">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            </div>

            {/* Energy sparks */}
            <motion.div
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full"
            ></motion.div>
            <motion.div
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-orange-500 rounded-full"
            ></motion.div>
          </div>

          {/* Outer energy ring */}
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/40"></div>
        </>
        )}

        {/* FRIDAY (5) - Cosmic Space Galaxy Clock */}
        {currentDayOfWeek === 5 && (
        <>
          {/* Cosmic nebula aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600/50 via-purple-600/50 to-pink-600/50 blur-2xl"
          ></motion.div>

          {/* Orbiting planets */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400"></div>
          </motion.div>

          {/* Main cosmic clock face */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-black/90 backdrop-blur-sm border-2 border-purple-500/40 shadow-2xl shadow-purple-500/40 overflow-hidden">
            {/* Starfield */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2 + i * 0.1, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute w-0.5 h-0.5 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`
                  }}
                ></motion.div>
              ))}
            </div>

            {/* Galaxy swirl */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            </motion.div>

            {/* Constellation markers */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="w-1 h-1 mx-auto rounded-full bg-gradient-to-b from-blue-400 to-purple-400 shadow-lg shadow-purple-400"></div>
                </motion.div>
              ))}
            </div>

            {/* Time display - cosmic glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-center">
                <motion.div 
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(168, 85, 247, 0.8)",
                      "0 0 30px rgba(59, 130, 246, 0.8)",
                      "0 0 20px rgba(168, 85, 247, 0.8)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight leading-none"
                >
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </motion.div>
                <div className="text-[9px] sm:text-[11px] text-purple-400 mt-0.5 font-light tracking-widest uppercase">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            </div>

            {/* Floating asteroids */}
            <motion.div
              animate={{ x: [0, 8, 0], y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-400 rounded-full"
            ></motion.div>
            <motion.div
              animate={{ x: [0, -8, 0], y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-gray-300 rounded-full"
            ></motion.div>
          </div>

          {/* Outer space ring */}
          <div className="absolute inset-0 rounded-full border border-purple-500/30"></div>
        </>
        )}

        {/* SATURDAY (6) - Steampunk Mechanical Clock */}
        {currentDayOfWeek === 6 && (
        <>
          {/* Steam glow aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-700/40 via-orange-800/40 to-gray-700/40 blur-2xl"
          ></motion.div>

          {/* Mechanical gears outer */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {[...Array(8)].map((_, i) => (
                <line
                  key={i}
                  x1="50" y1="50"
                  x2="50" y2="10"
                  stroke="rgba(180, 83, 9, 0.3)"
                  strokeWidth="1"
                  transform={`rotate(${i * 45} 50 50)`}
                />
              ))}
            </svg>
          </motion.div>

          {/* Main steampunk clock face */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-amber-900/40 via-orange-950/50 to-gray-900/60 backdrop-blur-sm border-2 border-amber-700/60 shadow-2xl shadow-amber-900/40 overflow-hidden">
            {/* Brass texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(217,119,6,0.2),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_60%,rgba(120,53,15,0.2),transparent_60%)]"></div>
            
            {/* Rotating inner gear */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-20"
            >
              <div className="absolute inset-0 flex items-center justify-center text-amber-600/50 text-4xl">⚙</div>
            </motion.div>

            {/* Mechanical rivets as markers */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className={`mx-auto rounded-full ${i % 3 === 0 ? 'w-2 h-2 border-2' : 'w-1.5 h-1.5 border'} border-amber-600 bg-amber-800/50`}></div>
                </div>
              ))}
            </div>

            {/* Mechanical time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-center">
                <div className="text-xl sm:text-3xl font-bold text-amber-600 tracking-tight leading-none font-mono"
                     style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-[9px] sm:text-[11px] text-orange-700 mt-0.5 font-mono tracking-widest uppercase">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            </div>

            {/* Steam puffs */}
            <motion.div
              animate={{ y: [0, -20], opacity: [0.5, 0], scale: [0.5, 1.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-gray-400/30 rounded-full blur-sm"
            ></motion.div>
            <motion.div
              animate={{ y: [0, -20], opacity: [0.5, 0], scale: [0.5, 1.5] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-gray-300/30 rounded-full blur-sm"
            ></motion.div>

            {/* Center brass bolt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-amber-700 bg-amber-900/50"></div>
            </div>
          </div>

          {/* Outer metallic ring with screws */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-800/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-amber-700 bg-amber-900"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full border border-amber-700 bg-amber-900"></div>
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-amber-700 bg-amber-900"></div>
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-amber-700 bg-amber-900"></div>
          </div>
        </>
        )}
        
      </div>
    </motion.div>
  );
};

