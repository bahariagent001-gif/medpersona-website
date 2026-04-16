export default function ApprovalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-36 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-56 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-16 rounded-full bg-gray-100" />
              <div className="h-5 w-20 rounded-full bg-gray-100" />
            </div>
            <div className="mt-4 h-4 w-24 rounded bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  )
}
