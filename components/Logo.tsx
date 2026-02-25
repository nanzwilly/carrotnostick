/**
 * LogoText — renders "CarrotNoStick" with a small green leaf tuft above the 'C'.
 * Styling (size, weight, colour) is controlled entirely by the parent element.
 */
export default function LogoText() {
  return (
    <>
      <span className="relative inline-block">
        {/* Three-strand carrot-leaf tuft floating above the 'C' */}
        <svg
          viewBox="0 0 20 16"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 w-[0.7em] h-[0.55em]"
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left leaf — fans upper-left */}
          <path d="M10 16 Q4 10 1 1 Q7 7 10 16 Z" fill="#22c55e" />
          {/* Centre leaf — goes straight up, tallest */}
          <path d="M10 16 Q9 7 10 0 Q11 7 10 16 Z" fill="#16a34a" />
          {/* Right leaf — fans upper-right */}
          <path d="M10 16 Q16 10 19 1 Q13 7 10 16 Z" fill="#22c55e" />
        </svg>
        C
      </span>
      arrotNoStick
    </>
  )
}
