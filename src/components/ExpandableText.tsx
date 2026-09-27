import { useLayoutEffect, useRef, useState } from 'react'

interface Props {
  text: string
  className?: string
}

// Clamps to 2 lines and only offers "show all" when the text actually
// overflows - a short message never shows a pointless expand link.
export default function ExpandableText({ text, className = '' }: Props) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  useLayoutEffect(() => {
    if (expanded) return
    const el = ref.current
    if (!el) return
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded])

  return (
    <div>
      <p ref={ref} className={`${className} ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className="mt-0.5 text-[11px] font-semibold text-brand-600"
        >
          {expanded ? 'הצג פחות' : 'הצג הכל'}
        </button>
      )}
    </div>
  )
}
