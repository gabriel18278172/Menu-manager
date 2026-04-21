import { useEffect, useMemo, useRef, useState } from 'react';

const LEVELS_TOTAL = 500;
const STORAGE_LEVEL = 'nonogram_level';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const createSeededRandom = (seed) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const makeEmptyBoard = (size) => Array.from({ length: size }, () => Array(size).fill(0));

const getClueRuns = (line) => {
  const runs = [];
  let run = 0;
  line.forEach((cell) => {
    if (cell) run += 1;
    else if (run) {
      runs.push(run);
      run = 0;
    }
  });
  if (run) runs.push(run);
  return runs.length ? runs : [0];
};

const buildLevel = (levelIndex) => {
  const lvl = levelIndex + 1;
  const size = clamp(5 + Math.floor(levelIndex / 45), 5, 15);
  const density = clamp(0.3 + levelIndex / 1500, 0.3, 0.62);
  const random = createSeededRandom(lvl * 97);
  const solution = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => random() < density)
  );

  if (solution.every((row) => row.every((cell) => !cell))) solution[0][0] = true;

  const rowClues = solution.map(getClueRuns);
  const colClues = Array.from({ length: size }, (_, c) =>
    getClueRuns(Array.from({ length: size }, (_, r) => solution[r][c]))
  );

  return {
    id: lvl,
    size,
    difficulty:
      lvl < 100 ? 'Easy' : lvl < 240 ? 'Normal' : lvl < 380 ? 'Hard' : lvl < 470 ? 'Expert' : 'Master',
    solution,
    rowClues,
    colClues,
  };
};

export default function App() {
  const [levelIndex, setLevelIndex] = useState(() => {
    const raw = Number(localStorage.getItem(STORAGE_LEVEL));
    return Number.isInteger(raw) ? clamp(raw, 0, LEVELS_TOTAL - 1) : 0;
  });
  const [mode, setMode] = useState('fill');
  const [mistakes, setMistakes] = useState(0);
  const audioRef = useRef(null);

  const level = useMemo(() => buildLevel(levelIndex), [levelIndex]);
  const [board, setBoard] = useState(() => makeEmptyBoard(level.size));

  useEffect(() => {
    localStorage.setItem(STORAGE_LEVEL, String(levelIndex));
  }, [levelIndex]);

  const completed = useMemo(
    () => level.solution.every((row, r) =>
      row.every((isFilled, c) => (isFilled ? board[r][c] === 1 : board[r][c] !== 1))
    ),
    [board, level]
  );

  const playTone = (frequency, duration, type, volume) => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioRef.current) audioRef.current = new Ctx();
    const ctx = audioRef.current;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  };

  const playRightSound = () => {
    playTone(900, 0.05, 'triangle', 0.08);
    setTimeout(() => playTone(1120, 0.04, 'triangle', 0.05), 30);
  };

  const playWrongSound = () => {
    playTone(170, 0.12, 'sine', 0.12);
  };

  const applyCell = (r, c, forceMode) => {
    if (completed) return;
    const activeMode = forceMode ?? mode;
    setBoard((prev) => {
      const next = prev.map((row) => [...row]);
      const current = next[r][c];
      const shouldFill = level.solution[r][c];

      if (activeMode === 'mark') {
        if (current !== 1) next[r][c] = current === -1 ? 0 : -1;
        return next;
      }

      if (current === 1) {
        next[r][c] = 0;
        return next;
      }

      if (shouldFill) {
        next[r][c] = 1;
        playRightSound();
      } else {
        next[r][c] = -1;
        playWrongSound();
        setMistakes((m) => m + 1);
      }
      return next;
    });
  };

  const goToLevel = (nextIndex) => {
    const clamped = clamp(nextIndex, 0, LEVELS_TOTAL - 1);
    const nextLevelData = buildLevel(clamped);
    setLevelIndex(clamped);
    setBoard(makeEmptyBoard(nextLevelData.size));
    setMistakes(0);
  };

  const nextLevel = () => goToLevel(levelIndex + 1);
  const prevLevel = () => goToLevel(levelIndex - 1);
  const resetLevel = () => {
    setBoard(makeEmptyBoard(level.size));
    setMistakes(0);
  };

  const maxColClue = Math.max(...level.colClues.map((c) => c.length));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto card p-5 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Ultra Nonogram</p>
            <h1 className="text-2xl md:text-4xl font-black">500 Levels Challenge</h1>
            <p className="text-slate-400">Correct fill = click sound • Wrong fill = knock + X mark</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Difficulty</p>
            <p className="text-xl font-extrabold text-violet-300">{level.difficulty}</p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-[1fr_auto] items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={prevLevel} disabled={level.id === 1}>Prev</button>
            <button className="btn-secondary" onClick={nextLevel} disabled={level.id === LEVELS_TOTAL}>Next</button>
            <button className="btn-secondary" onClick={resetLevel}>Restart</button>
            <button
              className={mode === 'fill' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setMode('fill')}
            >
              Fill Mode
            </button>
            <button
              className={mode === 'mark' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setMode('mark')}
            >
              Mark Mode
            </button>
          </div>
          <div className="text-sm md:text-right">
            <p>Level <span className="font-bold text-violet-300">{level.id}</span> / {LEVELS_TOTAL}</p>
            <p>Mistakes: <span className="font-bold text-rose-300">{mistakes}</span></p>
          </div>
        </section>

        <input
          type="range"
          min={1}
          max={LEVELS_TOTAL}
          value={level.id}
          onChange={(e) => goToLevel(Number(e.target.value) - 1)}
          className="w-full accent-violet-400"
        />

        {completed && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
            <p className="font-bold text-emerald-300">Puzzle solved! Great job.</p>
          </div>
        )}

        <div className="overflow-auto rounded-2xl border border-slate-700/70 p-3 bg-slate-900/80">
          <div className="w-max mx-auto">
            <table className="border-separate border-spacing-1">
              <tbody>
                <tr>
                  <td className="align-bottom pr-2 text-slate-500 text-xs">Clues</td>
                  {Array.from({ length: level.size }, (_, c) => (
                    <td key={`top-${c}`} className="align-bottom">
                      <div
                        className="grid gap-0.5 justify-items-center min-w-7"
                        style={{ gridTemplateRows: `repeat(${maxColClue}, 1rem)` }}
                      >
                        {Array.from({ length: maxColClue }, (_, i) => {
                          const clue = level.colClues[c][level.colClues[c].length - maxColClue + i];
                          return (
                            <span key={`col-${c}-${i}`} className="text-xs text-slate-200 font-semibold">
                              {clue ?? ''}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
                {board.map((row, r) => (
                  <tr key={`row-${r}`}>
                    <td className="pr-2 whitespace-nowrap text-xs text-slate-300 font-semibold">
                      {level.rowClues[r].join(' ')}
                    </td>
                    {row.map((cell, c) => (
                      <td key={`cell-${r}-${c}`}>
                        <button
                          onClick={() => applyCell(r, c)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            applyCell(r, c, 'mark');
                          }}
                          className={`h-7 w-7 border border-slate-700 rounded-sm text-sm font-black transition
                            ${cell === 1 ? 'bg-slate-100 border-slate-200 text-slate-900' : ''}
                            ${cell === -1 ? 'bg-rose-500/20 border-rose-400/60 text-rose-300' : ''}
                            ${cell === 0 ? 'bg-slate-800 hover:bg-slate-700' : ''}`}
                          aria-label={`cell-${r}-${c}`}
                        >
                          {cell === -1 ? '✕' : ''}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Tip: Left click for current mode. Right click always toggles an X mark.
        </p>
      </div>
    </div>
  );
}
