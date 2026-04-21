/**
 * Minimal markdown renderer — handles the brief_{date}.md output from WF02:
 *   - H1/H2/H3 headers
 *   - Bold (**text**) and italic (*text*)
 *   - Inline code (`code`)
 *   - Links [text](url)
 *   - Unordered lists (- item)
 *   - Blockquotes (> text)
 *   - Horizontal rules (---)
 *   - Paragraph breaks (blank lines)
 *
 * Does NOT handle: tables, code fences, ordered lists, images. Brief format
 * doesn't use those — if WF02 output changes, extend this renderer.
 */

import React from "react"

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let buf = ""
  let i = 0
  let k = 0
  const flush = () => {
    if (buf) {
      nodes.push(buf)
      buf = ""
    }
  }
  while (i < text.length) {
    const rest = text.slice(i)

    // [text](url)
    const linkM = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkM) {
      flush()
      nodes.push(
        <a key={`${keyPrefix}-l${k++}`} href={linkM[2]} target="_blank" rel="noopener noreferrer" className="text-teal-dark underline hover:text-teal">
          {linkM[1]}
        </a>
      )
      i += linkM[0].length
      continue
    }
    // **bold**
    if (rest.startsWith("**")) {
      const end = rest.indexOf("**", 2)
      if (end > 2) {
        flush()
        nodes.push(<strong key={`${keyPrefix}-b${k++}`} className="font-semibold text-navy-dark">{rest.slice(2, end)}</strong>)
        i += end + 2
        continue
      }
    }
    // *italic* (guard against ** already handled)
    if (rest[0] === "*" && rest[1] !== "*") {
      const end = rest.indexOf("*", 1)
      if (end > 1) {
        flush()
        nodes.push(<em key={`${keyPrefix}-i${k++}`}>{rest.slice(1, end)}</em>)
        i += end + 1
        continue
      }
    }
    // `code`
    if (rest[0] === "`") {
      const end = rest.indexOf("`", 1)
      if (end > 1) {
        flush()
        nodes.push(
          <code key={`${keyPrefix}-c${k++}`} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
            {rest.slice(1, end)}
          </code>
        )
        i += end + 1
        continue
      }
    }
    buf += rest[0]
    i++
  }
  flush()
  return nodes
}

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  const lines = children.split("\n")
  const blocks: React.ReactNode[] = []
  let listBuf: string[] = []
  let paraBuf: string[] = []
  let quoteBuf: string[] = []
  let blockIdx = 0

  const flushList = () => {
    if (listBuf.length === 0) return
    const items = [...listBuf]
    listBuf = []
    blocks.push(
      <ul key={`l${blockIdx++}`} className="my-3 ml-5 list-disc space-y-1 text-gray-700">
        {items.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li${blockIdx}-${idx}`)}</li>
        ))}
      </ul>
    )
  }
  const flushPara = () => {
    if (paraBuf.length === 0) return
    const text = paraBuf.join(" ")
    paraBuf = []
    blocks.push(
      <p key={`p${blockIdx++}`} className="my-2 leading-relaxed text-gray-700">
        {renderInline(text, `p${blockIdx}`)}
      </p>
    )
  }
  const flushQuote = () => {
    if (quoteBuf.length === 0) return
    const text = quoteBuf.join(" ")
    quoteBuf = []
    blocks.push(
      <blockquote key={`q${blockIdx++}`} className="my-3 border-l-4 border-teal-light bg-teal-light/20 px-4 py-2 italic text-navy-dark">
        {renderInline(text, `q${blockIdx}`)}
      </blockquote>
    )
  }
  const flushAll = () => { flushList(); flushPara(); flushQuote() }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) { flushAll(); continue }

    if (/^---+$/.test(line.trim())) {
      flushAll()
      blocks.push(<hr key={`h${blockIdx++}`} className="my-4 border-gray-200" />)
      continue
    }
    const h1 = line.match(/^# (.+)/)
    if (h1) {
      flushAll()
      blocks.push(<h1 key={`H1${blockIdx++}`} className="mb-3 mt-5 text-2xl font-bold text-navy-dark">{renderInline(h1[1], `h1${blockIdx}`)}</h1>)
      continue
    }
    const h2 = line.match(/^## (.+)/)
    if (h2) {
      flushAll()
      blocks.push(<h2 key={`H2${blockIdx++}`} className="mb-2 mt-5 text-xl font-semibold text-navy-dark">{renderInline(h2[1], `h2${blockIdx}`)}</h2>)
      continue
    }
    const h3 = line.match(/^### (.+)/)
    if (h3) {
      flushAll()
      blocks.push(<h3 key={`H3${blockIdx++}`} className="mb-2 mt-4 text-base font-semibold text-teal-dark">{renderInline(h3[1], `h3${blockIdx}`)}</h3>)
      continue
    }
    const li = line.match(/^\s*[-*] (.+)/)
    if (li) {
      flushPara(); flushQuote()
      listBuf.push(li[1])
      continue
    }
    const bq = line.match(/^> (.+)/)
    if (bq) {
      flushList(); flushPara()
      quoteBuf.push(bq[1])
      continue
    }
    flushList(); flushQuote()
    paraBuf.push(line)
  }
  flushAll()

  return <div className={className}>{blocks}</div>
}
