export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-44 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-56 rounded bg-gray-100" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
        <div className="h-6 w-36 rounded bg-gray-200" />
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
      </div>
      <div className="rounded-xl border border-gray-100 bg-white">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-2 py-3 text-center">
              <div className="mx-auto h-3 w-8 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] border-b border-r p-2">
              <div className="h-4 w-4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
