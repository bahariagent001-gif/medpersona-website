export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-36 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="h-40 bg-gray-100" />
            <div className="p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
              <div className="mt-3 flex justify-between">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
