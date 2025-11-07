# Review & Rating System Guide

Complete guide to the review and rating components.

## 📦 Components Created

### 1. ReviewCard
**Location:** `src/components/shortlet/ReviewCard.tsx`

Displays a single review with:
- Reviewer information (avatar, name)
- Star rating display
- Review comment
- Review date
- Optional listing information

**Props:**
```typescript
interface ReviewCardProps {
  review: Review;
  showListing?: boolean;
}
```

**Usage:**
```tsx
<ReviewCard review={review} showListing={true} />
```

### 2. ReviewForm
**Location:** `src/components/shortlet/ReviewForm.tsx`

Form for submitting and editing reviews:
- Interactive star rating (1-5 stars)
- Optional comment field (min 10 characters)
- Edit existing reviews
- Create new reviews
- Validation and error handling

**Props:**
```typescript
interface ReviewFormProps {
  bookingId: string;
  listingId?: string;
  existingReview?: Review;
  reviewType?: ReviewType;
  revieweeId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Usage:**
```tsx
// Guest reviewing property/owner
<ReviewForm
  bookingId={bookingId}
  reviewType={ReviewType.GUEST}
  revieweeId={ownerId}
  onSuccess={() => console.log('Review submitted')}
/>

// Owner reviewing guest
<ReviewForm
  bookingId={bookingId}
  reviewType={ReviewType.OWNER}
  revieweeId={guestId}
  onSuccess={() => console.log('Review submitted')}
/>
```

### 3. ReviewList
**Location:** `src/components/shortlet/ReviewList.tsx`

Comprehensive review list with:
- Statistics (average rating, total reviews)
- Rating distribution (5-star breakdown)
- Sort options (newest, oldest, highest, lowest)
- Individual review cards
- Empty state handling

**Props:**
```typescript
interface ReviewListProps {
  listingId?: string;
  bookingId?: string;
  showStatistics?: boolean;
  limit?: number;
}
```

**Usage:**
```tsx
// Listing reviews
<ReviewList listingId={listingId} showStatistics={true} />

// Single booking review
<ReviewList bookingId={bookingId} showStatistics={false} />
```

## 🔧 API Functions

### createReview
```typescript
const review = await createReview({
  booking_id: bookingId,
  reviewer_id: userId,
  reviewee_id: revieweeId,
  review_type: ReviewType.GUEST,
  rating: 5,
  comment: 'Great stay!'
});
```

### getReviewById
```typescript
const review = await getReviewById(reviewId);
```

### getReviewsByBooking
```typescript
const review = await getReviewsByBooking(bookingId);
```

### getReviewsByListing
```typescript
const reviews = await getReviewsByListing(listingId);
```

### getReviewsByUser
```typescript
const reviews = await getReviewsByUser(userId, ReviewType.GUEST);
```

### updateReview
```typescript
const updated = await updateReview(reviewId, {
  rating: 4,
  comment: 'Updated review'
});
```

### deleteReview
```typescript
await deleteReview(reviewId);
```

### getListingAverageRating
```typescript
const { average, count } = await getListingAverageRating(listingId);
```

## 🎯 Features

### Rating System
- **5-Star Rating:** Interactive star selection
- **Visual Feedback:** Hover effects and filled stars
- **Required Rating:** Must select at least 1 star
- **Optional Comment:** Minimum 10 characters if provided

### Review Types
- **Guest Reviews:** Guests review properties/owners
- **Owner Reviews:** Owners review guests
- **Bidirectional:** Both parties can review each other

### Statistics
- **Average Rating:** Calculated from all reviews
- **Total Count:** Number of reviews
- **Distribution:** Breakdown by star rating (1-5)
- **Visual Charts:** Progress bars for each rating level

### Sorting Options
- **Newest First:** Most recent reviews first
- **Oldest First:** Oldest reviews first
- **Highest Rated:** Best ratings first
- **Lowest Rated:** Lowest ratings first

## 📍 Integration Points

### In Listing Page
```tsx
// In ShortletListingPage.tsx
<TabsContent value="reviews">
  <ReviewList listingId={listing.id} showStatistics={true} />
</TabsContent>
```

### In Booking Details
```tsx
// In BookingDetails.tsx
{booking.status === 'completed' && (
  <Card>
    <CardHeader>
      <CardTitle>Your Review</CardTitle>
    </CardHeader>
    <CardContent>
      {existingReview ? (
        <ReviewList bookingId={bookingId} showStatistics={false} />
      ) : (
        <ReviewForm
          bookingId={bookingId}
          reviewType={isOwner ? ReviewType.OWNER : ReviewType.GUEST}
          revieweeId={isOwner ? booking.guest?.id : booking.owner_id}
          onSuccess={loadReview}
        />
      )}
    </CardContent>
  </Card>
)}
```

### In Listing Card
```tsx
// Display average rating
const { average, count } = await getListingAverageRating(listingId);
<div className="flex items-center gap-1">
  <Star className="h-4 w-4 fill-yellow-400" />
  <span>{average.toFixed(1)}</span>
  <span className="text-muted-foreground">({count})</span>
</div>
```

## 🎨 UI Components

### Star Rating Display
- **Filled Stars:** Yellow stars for rating
- **Empty Stars:** Gray stars for unrated
- **Interactive:** Click to select rating
- **Hover Effects:** Visual feedback on hover

### Statistics Card
- **Large Average:** Prominent average rating
- **Star Display:** Visual star representation
- **Distribution Bars:** Progress bars for each rating
- **Review Count:** Total number of reviews

### Review Card
- **Avatar:** Reviewer's initials
- **Name & Date:** Reviewer information
- **Star Rating:** Visual rating display
- **Comment:** Review text (if provided)

## 🔄 User Flows

### Guest Review Flow
1. Complete booking
2. Navigate to booking details
3. Click "Write a Review"
4. Select star rating (required)
5. Write comment (optional, min 10 chars)
6. Submit review
7. Review appears in listing

### Owner Review Flow
1. Booking completed
2. Navigate to booking details
3. Click "Write a Review"
4. Review guest
5. Submit review

### Viewing Reviews
1. Navigate to listing
2. Click "Reviews" tab
3. View statistics and reviews
4. Sort by preference
5. Read individual reviews

## ✨ Key Features

1. **Bidirectional Reviews:** Both guests and owners can review
2. **Rating System:** 5-star rating with visual feedback
3. **Statistics:** Average rating and distribution
4. **Sorting:** Multiple sort options
5. **Edit Reviews:** Update existing reviews
6. **Validation:** Form validation and error handling
7. **Empty States:** Helpful messages when no reviews exist

## 🐛 Common Issues

### Issue: Review not submitting
**Solution:** Check if user is logged in and revieweeId is provided

### Issue: Duplicate reviews
**Solution:** API prevents duplicate reviews per booking

### Issue: Reviews not showing
**Solution:** Verify listingId or bookingId is correct

### Issue: Rating not displaying
**Solution:** Check if rating is between 1-5

## 📝 Future Enhancements

1. **Review Responses:** Owners can respond to reviews
2. **Review Moderation:** Admin approval for reviews
3. **Review Helpfulness:** Users can mark reviews as helpful
4. **Photo Reviews:** Attach photos to reviews
5. **Review Categories:** Rate specific aspects (cleanliness, location, etc.)
6. **Review Analytics:** Detailed analytics for owners
7. **Review Notifications:** Notify when new reviews are posted

