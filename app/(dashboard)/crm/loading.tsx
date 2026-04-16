export default function CRMLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-28 rounded bg-gray-100" />
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "1960px" }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <div className="rounded-t-lg bg-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-5 w-6 rounded-full bg-white" />
                </div>
              </div>
              <div className="space-y-3 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50/50 p-3" style={{ minHeight: "200px" }}>
                {Array.from({ length: i < 3 ? 2 : 1 }).map((_, j) => (
                  <div key={j} className="rounded-xl border border-gray-100 bg-white p-3">
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
                    <div className="mt-2 flex gap-1">
                      <div className="h-4 w-12 rounded-full bg-gray-100" />
                      <div className="h-4 w-12 rounded-full bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
