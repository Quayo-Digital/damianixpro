export const PropertyDetailLoading = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* Back button skeleton */}
        <div className="mb-6 h-9 w-48 rounded bg-gray-200"></div>

        {/* Main content grid - matches the actual layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - matches lg:col-span-2 */}
          <div className="space-y-6 lg:col-span-2">
            {/* Header skeleton */}
            <div className="space-y-3">
              <div className="h-8 w-3/4 rounded bg-gray-200"></div>
              <div className="h-5 w-1/2 rounded bg-gray-200"></div>
              <div className="h-5 w-2/3 rounded bg-gray-200"></div>
            </div>

            {/* Image skeleton */}
            <div className="h-96 rounded-lg bg-gray-200"></div>

            {/* Tabs skeleton */}
            <div className="space-y-4">
              <div className="h-10 w-full rounded bg-gray-200"></div>
              <div className="h-32 rounded bg-gray-200"></div>
            </div>
          </div>

          {/* Right column - matches lg:col-span-1 */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="h-40 rounded-lg bg-gray-200"></div>
              <div className="h-12 rounded bg-gray-200"></div>
              <div className="h-12 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
