"use client"

import { useState, useCallback } from "react"

// Kid-friendly words organized by category
const WORD_LISTS: Record<string, string[]> = {
  animals: ["cat", "dog", "fish", "bird", "frog", "duck", "bear", "lion", "deer", "goat", "panda", "tiger", "bunny", "horse", "sheep", "whale", "eagle", "hippo", "koala", "otter"],
  food: ["cake", "rice", "corn", "plum", "pear", "milk", "soup", "taco", "wrap", "grape", "mango", "pizza", "bread", "pasta", "melon", "peach", "berry", "apple", "candy", "toast"],
  nature: ["tree", "rain", "snow", "leaf", "moon", "star", "sand", "hill", "pond", "wave", "rock", "lake", "rose", "seed", "wind", "cave", "reef", "dawn", "mist", "clay"],
}

const CATEGORIES = Object.keys(WORD_LISTS)

function pickWord(): { word: string; category: string } {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  const words = WORD_LISTS[category]
  return { word: words[Math.floor(Math.random() * words.length)], category }
}

const MAX_WRONG = 6

const HANGMAN_PARTS = [
  // 1: head
  (color: string) => <circle key="head" cx="150" cy="70" r="20" stroke={color} strokeWidth="3" fill="none" />,
  // 2: body
  (color: string) => <line key="body" x1="150" y1="90" x2="150" y2="140" stroke={color} strokeWidth="3" />,
  // 3: left arm
  (color: string) => <line key="larm" x1="150" y1="105" x2="120" y2="125" stroke={color} strokeWidth="3" />,
  // 4: right arm
  (color: string) => <line key="rarm" x1="150" y1="105" x2="180" y2="125" stroke={color} strokeWidth="3" />,
  // 5: left leg
  (color: string) => <line key="lleg" x1="150" y1="140" x2="125" y2="175" stroke={color} strokeWidth="3" />,
  // 6: right leg
  (color: string) => <line key="rleg" x1="150" y1="140" x2="175" y2="175" stroke={color} strokeWidth="3" />,
]

// Sad face on the hangman when game is lost
function SadFace() {
  return (
    <g>
      <circle cx="143" cy="65" r="2" fill="#666" />
      <circle cx="157" cy="65" r="2" fill="#666" />
      <path d="M 140 78 Q 150 72, 160 78" stroke="#666" strokeWidth="1.5" fill="none" />
    </g>
  )
}

function HappyFace() {
  return (
    <g>
      <circle cx="143" cy="65" r="2" fill="#22c55e" />
      <circle cx="157" cy="65" r="2" fill="#22c55e" />
      <path d="M 140 75 Q 150 82, 160 75" stroke="#22c55e" strokeWidth="1.5" fill="none" />
    </g>
  )
}

export default function HangmanGame({ color, onClose }: { color: string; onClose: () => void }) {
  const [{ word, category }, setWordData] = useState(pickWord)
  const [guessed, setGuessed] = useState<Set<string>>(new Set())

  const wrongCount = [...guessed].filter((l) => !word.includes(l)).length
  const won = word.split("").every((l) => guessed.has(l))
  const lost = wrongCount >= MAX_WRONG
  const gameOver = won || lost

  const guess = useCallback(
    (letter: string) => {
      if (gameOver || guessed.has(letter)) return
      setGuessed((prev) => new Set([...prev, letter]))
    },
    [gameOver, guessed]
  )

  const resetGame = () => {
    setWordData(pickWord())
    setGuessed(new Set())
  }

  const ALPHABET = "abcdefghijklmnopqrstuvwxyz"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-0">
      <div className="bg-white rounded-t-3xl w-full max-w-sm flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">🎮 Hangman</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 space-y-4">
          {/* Category hint */}
          <p className="text-center text-sm text-gray-400">
            Hint: <span className="font-semibold text-gray-600 capitalize">{category}</span>
          </p>

          {/* Hangman SVG */}
          <div className="flex justify-center">
            <svg viewBox="0 0 220 200" className="w-40 h-32">
              {/* Gallows */}
              <line x1="40" y1="190" x2="180" y2="190" stroke="#d1d5db" strokeWidth="3" />
              <line x1="80" y1="190" x2="80" y2="20" stroke="#d1d5db" strokeWidth="3" />
              <line x1="80" y1="20" x2="150" y2="20" stroke="#d1d5db" strokeWidth="3" />
              <line x1="150" y1="20" x2="150" y2="50" stroke="#d1d5db" strokeWidth="3" />
              {/* Body parts */}
              {HANGMAN_PARTS.slice(0, wrongCount).map((part) => part(lost ? "#ef4444" : color))}
              {/* Face */}
              {lost && wrongCount >= 1 && <SadFace />}
              {won && wrongCount >= 1 && <HappyFace />}
            </svg>
          </div>

          {/* Word display */}
          <div className="flex justify-center gap-2">
            {word.split("").map((letter, i) => (
              <span
                key={i}
                className="w-8 h-10 flex items-center justify-center text-xl font-black border-b-3 transition-all"
                style={{
                  borderBottomWidth: "3px",
                  borderBottomColor: guessed.has(letter) ? color : "#d1d5db",
                  color: lost && !guessed.has(letter) ? "#ef4444" : color,
                }}
              >
                {guessed.has(letter) || lost ? letter.toUpperCase() : ""}
              </span>
            ))}
          </div>

          {/* Wrong guesses counter */}
          <p className="text-center text-xs text-gray-400">
            {wrongCount} / {MAX_WRONG} wrong
          </p>

          {/* Game over message */}
          {gameOver && (
            <div
              className={`rounded-2xl px-4 py-3 text-center ${
                won ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              {won ? (
                <>
                  <p className="font-black text-green-700 text-lg">🎉 You got it!</p>
                  <p className="text-green-600 text-sm">The word was &quot;{word}&quot;</p>
                </>
              ) : (
                <>
                  <p className="font-black text-red-700 text-lg">Oh no!</p>
                  <p className="text-red-600 text-sm">The word was &quot;{word}&quot;</p>
                </>
              )}
              <button
                onClick={resetGame}
                className="mt-2 text-white font-bold rounded-full px-5 py-2 text-sm transition-colors"
                style={{ backgroundColor: color }}
              >
                Play again
              </button>
            </div>
          )}

          {/* Keyboard */}
          {!gameOver && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {ALPHABET.split("").map((letter) => {
                const isGuessed = guessed.has(letter)
                const isCorrect = isGuessed && word.includes(letter)
                const isWrong = isGuessed && !word.includes(letter)

                return (
                  <button
                    key={letter}
                    onClick={() => guess(letter)}
                    disabled={isGuessed}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                      isCorrect
                        ? "bg-green-100 text-green-600 cursor-default"
                        : isWrong
                        ? "bg-red-100 text-red-400 cursor-default"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                    }`}
                  >
                    {letter.toUpperCase()}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
