import { findMatch } from '../lib/text'

export function Highlight({ text, query }: { text: string; query: string }) {
  const match = findMatch(text, query)
  if (!match) return <>{text}</>
  const [start, end] = match
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  )
}
