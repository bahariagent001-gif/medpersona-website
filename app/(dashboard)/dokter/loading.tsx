export default function DoctorsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-24 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-40 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="mt-1 h-3 w-24 rounded bg-gray-100" />
                <div className="mt-1 h-3 w-28 rounded bg-gray-50" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded-full bg-gray-100" />
                <div className="h-5 w-14 rounded-full bg-gray-100" />
              </div>
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
