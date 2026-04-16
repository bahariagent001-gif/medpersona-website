export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-28 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-40 rounded bg-gray-100" />
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded bg-gray-100" />
              <div className="mt-2 h-4 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="mt-4 h-4 w-48 rounded bg-gray-100" />
        <div className="mt-2 h-5 w-36 rounded bg-gray-200" />
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-16 rounded bg-gray-200" />
        <div className="mt-4 h-4 w-40 rounded bg-gray-100" />
        <div className="mt-4 h-9 w-36 rounded-lg bg-gray-100" />
      </div>
    </div>
  )
}
