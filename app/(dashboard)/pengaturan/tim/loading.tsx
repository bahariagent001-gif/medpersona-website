export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-56 rounded bg-gray-100" />
      </div>
      <div className="rounded-xl border border-gray-100 bg-white">
        <div className="border-b px-6 py-4">
          <div className="h-5 w-32 rounded bg-gray-200" />
        </div>
        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-20 rounded bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
              <div className="h-4 w-36 rounded bg-gray-100" />
              <div className="h-4 w-48 rounded bg-gray-100" />
              <div className="h-5 w-16 rounded-full bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
