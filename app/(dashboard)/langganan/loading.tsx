export default function SubscriptionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-28 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-48 rounded bg-gray-100" />
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="h-7 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-9 w-36 rounded bg-gray-100" />
            <div className="mt-2 h-4 w-32 rounded bg-gray-50" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-gray-100" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <div className="h-3 w-12 rounded bg-gray-100" />
                  <div className="h-3 w-10 rounded bg-gray-100" />
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-36 rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-8">
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-100" />
              <div className="h-4 w-14 rounded-full bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
