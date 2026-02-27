"use client"

import { useState, useEffect } from "react"
import { BigHead } from "@bigheads/core"

// ── Types ─────────────────────────────────────────────────────────────────────

export type BigHeadConfig = {
  body:          "chest" | "breasts"
  skinTone:      "light" | "yellow" | "brown" | "dark" | "red" | "black"
  eyes:          "normal" | "leftTwitch" | "happy" | "content" | "squint" | "simple" | "dizzy" | "wink" | "heart"
  eyebrows:      "raised" | "leftLowered" | "serious" | "angry" | "concerned"
  mouth:         "grin" | "sad" | "openSmile" | "lips" | "open" | "serious" | "tongue"
  hair:          "none" | "long" | "bun" | "short" | "pixie" | "balding" | "buzz" | "afro" | "bob"
  hairColor:     "blonde" | "orange" | "black" | "white" | "brown" | "blue" | "pink"
  hat:           "none" | "beanie" | "turban"
  hatColor:      "white" | "blue" | "black" | "green" | "red"
  clothing:      "naked" | "shirt" | "dressShirt" | "vneck" | "tankTop" | "dress"
  clothingColor: "white" | "blue" | "black" | "green" | "red"
  accessory:     "none" | "roundGlasses" | "tinyGlasses" | "shades"
  facialHair:    "none" | "stubble" | "mediumBeard"
  lipColor:      "red" | "purple" | "pink" | "turqoise" | "green"
}

export const DEFAULT_BIGHEAD_CONFIG: BigHeadConfig = {
  body:          "chest",
  skinTone:      "light",
  eyes:          "normal",
  eyebrows:      "raised",
  mouth:         "grin",
  hair:          "short",
  hairColor:     "black",
  hat:           "none",
  hatColor:      "blue",
  clothing:      "shirt",
  clothingColor: "blue",
  accessory:     "none",
  facialHair:    "none",
  lipColor:      "pink",
}

// ── Editor categories ─────────────────────────────────────────────────────────

type Option = { value: string; label: string }

export type EditorCategory = {
  key: keyof BigHeadConfig
  label: string
  emoji: string
  options: Option[]
}

export const EDITOR_CATEGORIES: EditorCategory[] = [
  {
    key: "body",
    label: "Style",
    emoji: "🧑",
    options: [
      { value: "chest",   label: "Boy"  },
      { value: "breasts", label: "Girl" },
    ],
  },
  {
    key: "skinTone",
    label: "Skin",
    emoji: "✋",
    options: [
      { value: "light",  label: "Light"  },
      { value: "yellow", label: "Yellow" },
      { value: "brown",  label: "Brown"  },
      { value: "dark",   label: "Dark"   },
      { value: "red",    label: "Red"    },
      { value: "black",  label: "Black"  },
    ],
  },
  {
    key: "eyes",
    label: "Eyes",
    emoji: "👀",
    options: [
      { value: "normal",     label: "Normal"    },
      { value: "happy",      label: "Happy 😊"  },
      { value: "wink",       label: "Wink 😉"   },
      { value: "heart",      label: "Heart 😍"  },
      { value: "content",    label: "Cozy 😌"   },
      { value: "squint",     label: "Squint 😏" },
      { value: "dizzy",      label: "Dizzy 😵"  },
      { value: "simple",     label: "Simple"    },
      { value: "leftTwitch", label: "Twitch"    },
    ],
  },
  {
    key: "mouth",
    label: "Mouth",
    emoji: "😄",
    options: [
      { value: "grin",      label: "Grin 😁"    },
      { value: "openSmile", label: "Smile 😀"   },
      { value: "tongue",    label: "Tongue 😛"  },
      { value: "lips",      label: "Lips 💋"    },
      { value: "open",      label: "Open 😮"    },
      { value: "serious",   label: "Serious 😐" },
      { value: "sad",       label: "Sad ☹️"     },
    ],
  },
  {
    key: "hair",
    label: "Hair",
    emoji: "💇",
    options: [
      { value: "short",   label: "Short"   },
      { value: "long",    label: "Long"    },
      { value: "bun",     label: "Bun"     },
      { value: "pixie",   label: "Pixie"   },
      { value: "bob",     label: "Bob"     },
      { value: "afro",    label: "Afro"    },
      { value: "buzz",    label: "Buzz"    },
      { value: "balding", label: "Balding" },
      { value: "none",    label: "None"    },
    ],
  },
  {
    key: "hairColor",
    label: "Hair Color",
    emoji: "🎨",
    options: [
      { value: "black",  label: "Black ⚫"  },
      { value: "brown",  label: "Brown 🤎"  },
      { value: "blonde", label: "Blonde 💛" },
      { value: "orange", label: "Orange 🟠" },
      { value: "white",  label: "White ⚪"  },
      { value: "blue",   label: "Blue 💙"   },
      { value: "pink",   label: "Pink 💗"   },
    ],
  },
  {
    key: "hat",
    label: "Hat",
    emoji: "🎩",
    options: [
      { value: "none",   label: "No Hat"    },
      { value: "beanie", label: "Beanie 🧢" },
      { value: "turban", label: "Turban"    },
    ],
  },
  {
    key: "clothing",
    label: "Outfit",
    emoji: "👕",
    options: [
      { value: "shirt",      label: "T-Shirt"     },
      { value: "vneck",      label: "V-Neck"      },
      { value: "tankTop",    label: "Tank Top"    },
      { value: "dress",      label: "Dress 👗"    },
      { value: "dressShirt", label: "Dress Shirt" },
      { value: "naked",      label: "None"        },
    ],
  },
  {
    key: "clothingColor",
    label: "Outfit Color",
    emoji: "🌈",
    options: [
      { value: "blue",  label: "Blue 💙"  },
      { value: "red",   label: "Red ❤️"   },
      { value: "green", label: "Green 💚" },
      { value: "white", label: "White ⚪" },
      { value: "black", label: "Black ⚫" },
    ],
  },
  {
    key: "accessory",
    label: "Extras",
    emoji: "🕶️",
    options: [
      { value: "none",         label: "None"         },
      { value: "roundGlasses", label: "Round 🔵"     },
      { value: "tinyGlasses",  label: "Tiny Glasses" },
      { value: "shades",       label: "Shades 😎"    },
    ],
  },
  {
    key: "facialHair",
    label: "Facial Hair",
    emoji: "🧔",
    options: [
      { value: "none",        label: "None"   },
      { value: "stubble",     label: "Stubble"},
      { value: "mediumBeard", label: "Beard"  },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function BigHeadAvatar({
  config,
  size = 80,
}: {
  config: BigHeadConfig
  size?: number
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div style={{ width: size, height: size, display: "inline-block" }}>
      {!mounted ? (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.4,
          }}
          aria-hidden
        >
          👤
        </div>
      ) : (
        <BigHead
          body={config.body}
          skinTone={config.skinTone}
          eyes={config.eyes}
          eyebrows={config.eyebrows}
          mouth={config.mouth}
          hair={config.hair}
          hairColor={config.hairColor}
          hat={config.hat}
          hatColor={config.hatColor}
          clothing={config.clothing}
          clothingColor={config.clothingColor}
          accessory={config.accessory}
          facialHair={config.facialHair}
          lipColor={config.lipColor}
          mask={false}
          graphic="none"
        />
      )}
    </div>
  )
}
