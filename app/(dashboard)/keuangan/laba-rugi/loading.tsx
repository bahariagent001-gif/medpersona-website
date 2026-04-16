export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-lg bg-gray-200" />
        <div>
          <div className="h-7 w-48 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-52 rounded bg-gray-100" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="mt-2 h-7 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between py-1">
              <div className="h-4 w-48 rounded bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
