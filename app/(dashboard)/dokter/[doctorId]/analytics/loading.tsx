export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-lg bg-gray-200" />
        <div>
          <div className="h-7 w-44 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-48 rounded bg-gray-100" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-36 rounded bg-gray-200" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-gray-50 py-2">
              <div className="h-4 w-48 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
