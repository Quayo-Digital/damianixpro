import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Smartphone,
  Tablet,
  Monitor,
  Hand,
  Navigation,
  Zap,
  CheckCircle2,
  ArrowRight,
  Heart,
  Share2,
  Filter,
  Plus,
  Minus,
} from 'lucide-react';

// Import mobile utilities and components
import { useDeviceDetection } from '@/utils/mobile';
import {
  MobileButton,
  MobileInput,
  MobileSelect,
  MobilePropertyCard,
  MobileSearchBar,
  MobileQuantitySelector,
  MobileBottomSheet,
  MobileNavBar,
  MobileFloatingActionButton,
} from '@/components/ui/mobile-components';

import {
  useSwipeGestures,
  useSwipeableCarousel,
  useSwipeableTabs,
  usePullToRefresh,
  useSwipeToDismiss,
  useLongPress,
} from '@/hooks/useSwipeGestures';

type DemoNotification = { id: number; message: string };

function SwipeDismissNotificationItem({
  notification,
  onDismiss,
}: {
  notification: DemoNotification;
  onDismiss: (id: number, direction: 'left' | 'right') => void;
}) {
  const { swipeRef } = useSwipeToDismiss((direction) => onDismiss(notification.id, direction), 80);

  return (
    <div ref={swipeRef} className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm">{notification.message}</span>
        <ArrowRight className="h-4 w-4 text-blue-600" />
      </div>
      <p className="mt-1 text-xs text-blue-600">← Swipe left or right to dismiss →</p>
    </div>
  );
}

export const MobileDemo = () => {
  const deviceInfo = useDeviceDetection();
  const [activeDemo, setActiveDemo] = useState('components');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New property match found!' },
    { id: 2, message: 'Payment reminder for Apartment 3B' },
    { id: 3, message: 'Maintenance request approved' },
  ]);

  // Sample data
  const sampleProperties = [
    {
      id: '1',
      title: '3 Bedroom Apartment in Victoria Island',
      price: 2500000,
      location: 'Victoria Island, Lagos',
      bedrooms: 3,
      bathrooms: 2,
      image: '/api/placeholder/400/300/property1',
      type: 'Apartment',
    },
    {
      id: '2',
      title: '4 Bedroom Duplex in Lekki',
      price: 4200000,
      location: 'Lekki Phase 1, Lagos',
      bedrooms: 4,
      bathrooms: 3,
      image: '/api/placeholder/400/300/property2',
      type: 'Duplex',
    },
    {
      id: '3',
      title: '2 Bedroom Flat in Ikeja',
      price: 1800000,
      location: 'Ikeja GRA, Lagos',
      bedrooms: 2,
      bathrooms: 2,
      image: '/api/placeholder/400/300/property3',
      type: 'Flat',
    },
  ];

  const locationOptions = [
    { value: 'lagos', label: 'Lagos' },
    { value: 'abuja', label: 'Abuja' },
    { value: 'port-harcourt', label: 'Port Harcourt' },
    { value: 'kano', label: 'Kano' },
    { value: 'ibadan', label: 'Ibadan' },
  ];

  // Swipeable carousel for properties
  const {
    currentIndex,
    goToNext,
    goToPrevious,
    swipeRef: carouselRef,
  } = useSwipeableCarousel(sampleProperties.length, (index) =>
    console.log('Property carousel index:', index)
  );

  // Swipeable tabs
  const {
    activeTab,
    goToTab,
    swipeRef: tabsRef,
  } = useSwipeableTabs(4, 0, (tabIndex) => {
    const tabs = ['components', 'gestures', 'carousel', 'interactions'];
    setActiveDemo(tabs[tabIndex]);
  });

  // Pull to refresh
  const {
    isPulling,
    isRefreshing,
    pullProgress,
    swipeRef: refreshRef,
  } = usePullToRefresh(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Refreshed!');
  });

  // Swipe to dismiss notifications
  const handleDismissNotification = (id: number, direction: 'left' | 'right') => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    console.log(`Dismissed notification ${id} by swiping ${direction}`);
  };

  // Long press example
  const { elementRef: longPressRef, isPressed } = useLongPress(() => {
    alert('Long press detected! This could open a context menu.');
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation Bar */}
      <MobileNavBar
        title="DamianixPro Mobile Demo"
        showBack={true}
        onBackClick={() => window.history.back()}
        actions={[
          {
            icon: <Heart className="h-5 w-5" />,
            onClick: () => console.log('Favorites clicked'),
            label: 'Favorites',
          },
          {
            icon: <Share2 className="h-5 w-5" />,
            onClick: () => console.log('Share clicked'),
            label: 'Share',
          },
        ]}
      />

      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="fixed left-0 right-0 top-16 z-50 bg-blue-500 py-2 text-center text-white">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {isRefreshing
              ? 'Refreshing...'
              : `Pull to refresh (${Math.round(pullProgress * 100)}%)`}
          </div>
        </div>
      )}

      <div ref={refreshRef} className="pb-20 pt-16">
        {/* Device Info Header */}
        <div className="border-b border-border bg-card p-4 text-card-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {deviceInfo.isMobile ? (
                <Smartphone className="h-6 w-6 text-blue-600" />
              ) : deviceInfo.isTablet ? (
                <Tablet className="h-6 w-6 text-green-600" />
              ) : (
                <Monitor className="h-6 w-6 text-gray-600" />
              )}
              <div>
                <h1 className="text-lg font-semibold">Mobile Demo</h1>
                <p className="text-sm capitalize text-gray-600">
                  {String(deviceInfo.deviceType)} •{' '}
                  {deviceInfo.isTouchDevice ? 'Touch' : 'No Touch'} •
                  {deviceInfo.isLandscape ? ' Landscape' : ' Portrait'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {String(deviceInfo.pixelRatio)}x DPR
            </Badge>
          </div>
        </div>

        {/* Demo Content */}
        <div className="space-y-6 p-4">
          {/* Demo Navigation Tabs */}
          <div ref={tabsRef}>
            <Tabs value={activeDemo} onValueChange={setActiveDemo}>
              <TabsList className="mb-6 grid w-full grid-cols-4">
                <TabsTrigger value="components" className="text-xs">
                  Components
                </TabsTrigger>
                <TabsTrigger value="gestures" className="text-xs">
                  Gestures
                </TabsTrigger>
                <TabsTrigger value="carousel" className="text-xs">
                  Carousel
                </TabsTrigger>
                <TabsTrigger value="interactions" className="text-xs">
                  Interactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="space-y-6">
                {/* Mobile Components Demo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hand className="h-5 w-5" />
                      Touch-Optimized Components
                    </CardTitle>
                    <CardDescription>
                      All components meet 44px minimum touch target requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mobile Buttons */}
                    <div>
                      <h4 className="mb-3 font-medium">Mobile Buttons</h4>
                      <div className="flex flex-wrap gap-3">
                        <MobileButton size="sm" variant="default">
                          Small
                        </MobileButton>
                        <MobileButton size="md" variant="outline">
                          Medium
                        </MobileButton>
                        <MobileButton size="lg" variant="secondary">
                          Large
                        </MobileButton>
                        <MobileButton size="xl" variant="destructive">
                          Extra Large
                        </MobileButton>
                      </div>
                    </div>

                    {/* Mobile Search */}
                    <div>
                      <h4 className="mb-3 font-medium">Mobile Search</h4>
                      <MobileSearchBar
                        placeholder="Search properties in Lagos..."
                        showFilter={true}
                        onFilterClick={() => setShowBottomSheet(true)}
                      />
                    </div>

                    {/* Mobile Form Inputs */}
                    <div>
                      <h4 className="mb-3 font-medium">Mobile Form Inputs</h4>
                      <div className="space-y-4">
                        <MobileInput
                          label="Property Name"
                          placeholder="Enter property name"
                          helpText="16px font prevents iOS zoom"
                        />
                        <MobileInput
                          label="Price"
                          placeholder="0"
                          currency={true}
                          helpText="Nigerian Naira currency input"
                        />
                        <MobileSelect
                          label="Location"
                          placeholder="Select location"
                          options={locationOptions}
                        />
                        <MobileQuantitySelector
                          label="Bedrooms"
                          value={3}
                          onChange={(value) => console.log('Bedrooms:', value)}
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gestures" className="space-y-6">
                {/* Gesture Demos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="h-5 w-5" />
                      Gesture Recognition
                    </CardTitle>
                    <CardDescription>Swipe, tap, and long press interactions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Swipe to Dismiss Notifications */}
                    <div>
                      <h4 className="mb-3 font-medium">Swipe to Dismiss Notifications</h4>
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <SwipeDismissNotificationItem
                            key={notification.id}
                            notification={notification}
                            onDismiss={handleDismissNotification}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Long Press Demo */}
                    <div>
                      <h4 className="mb-3 font-medium">Long Press Interaction</h4>
                      <div
                        ref={longPressRef}
                        className={`cursor-pointer rounded-lg border-2 bg-purple-50 p-6 text-center transition-colors ${
                          isPressed ? 'border-purple-500 bg-purple-100' : 'border-purple-200'
                        }`}
                      >
                        <div className="text-purple-600">
                          <Hand className="mx-auto mb-2 h-8 w-8" />
                          <p className="font-medium">Long Press Me</p>
                          <p className="text-sm opacity-75">Hold for 500ms to trigger action</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="carousel" className="space-y-6">
                {/* Property Carousel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Swipeable Property Carousel
                    </CardTitle>
                    <CardDescription>Swipe left/right to browse properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div ref={carouselRef} className="relative">
                      <MobilePropertyCard
                        property={sampleProperties[currentIndex]}
                        onFavorite={(id) => console.log('Favorited:', id)}
                        onShare={(id) => console.log('Shared:', id)}
                        onClick={(id) => console.log('Clicked:', id)}
                      />

                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevious}
                          disabled={currentIndex === 0}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-2">
                          {sampleProperties.map((_, index) => (
                            <div
                              key={index}
                              className={`h-2 w-2 rounded-full ${
                                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNext}
                          disabled={currentIndex === sampleProperties.length - 1}
                        >
                          Next
                        </Button>
                      </div>

                      <p className="mt-2 text-center text-sm text-gray-600">
                        Property {String(currentIndex + 1)} of {String(sampleProperties.length)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interactions" className="space-y-6">
                {/* Interactive Elements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Mobile Elements</CardTitle>
                    <CardDescription>
                      Bottom sheets, floating buttons, and mobile-specific UI patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MobileButton onClick={() => setShowBottomSheet(true)} className="w-full">
                      Open Bottom Sheet
                    </MobileButton>

                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Mobile Responsiveness Complete!</AlertTitle>
                      <AlertDescription>
                        All mobile optimizations are now implemented and ready for production use.
                        The platform supports touch gestures, proper sizing, and Nigerian market
                        optimizations.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <MobileFloatingActionButton
        icon={<Plus className="h-6 w-6" />}
        onClick={() => console.log('FAB clicked')}
        className="fixed bottom-24 right-4"
      />

      {/* Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Filter Properties"
      >
        <div className="space-y-4">
          <MobileSelect
            label="Property Type"
            placeholder="Select type"
            options={[
              { value: 'apartment', label: 'Apartment' },
              { value: 'duplex', label: 'Duplex' },
              { value: 'flat', label: 'Flat' },
              { value: 'house', label: 'House' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <MobileQuantitySelector
              label="Min Bedrooms"
              value={1}
              onChange={(value) => console.log('Min bedrooms:', value)}
              min={1}
              max={10}
            />
            <MobileQuantitySelector
              label="Max Bedrooms"
              value={5}
              onChange={(value) => console.log('Max bedrooms:', value)}
              min={1}
              max={10}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setShowBottomSheet(false)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              className="flex-1"
              onClick={() => {
                console.log('Apply filters');
                setShowBottomSheet(false);
              }}
            >
              Apply Filters
            </MobileButton>
          </div>
        </div>
      </MobileBottomSheet>
    </div>
  );
};

export default MobileDemo;
