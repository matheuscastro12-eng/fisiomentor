export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-surface-container-low rounded-2xl animate-pulse"
          />
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="h-12 bg-surface-container-low rounded-xl animate-pulse" />

      {/* Table skeleton */}
      <div className="bg-surface-container-low rounded-2xl animate-pulse">
        <div className="h-12 bg-surface-container rounded-t-2xl" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 border-t border-surface-container" />
        ))}
      </div>
    </div>
  );
}
