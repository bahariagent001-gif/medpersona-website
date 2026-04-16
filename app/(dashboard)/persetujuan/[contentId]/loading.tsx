export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-lg bg-gray-200" />
        <div>
          <div className="h-7 w-52 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-36 rounded bg-gray-100" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="h-5 w-28 rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between py-1">
                <div className="h-4 w-28 rounded bg-gray-100" />
                <div className="h-4 w-36 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
