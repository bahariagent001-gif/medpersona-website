export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
    </div>
  )
}
