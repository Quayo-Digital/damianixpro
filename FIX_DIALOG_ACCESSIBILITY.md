# 🔧 Fix Dialog Accessibility Warning

## Issue

Getting accessibility warning:

```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
```

## Root Cause

Some `DialogContent` components were missing `DialogDescription` or had `DialogTitle`/`DialogDescription` not wrapped in `DialogHeader`.

## Solution

Fixed dialogs to include proper `DialogDescription` and ensure proper structure.

---

## ✅ Fixed Files

### 1. `src/pages/TenantManagement.tsx`

**Issue:** `DialogTitle` and `DialogDescription` not wrapped in `DialogHeader`

**Before:**

```tsx
<DialogContent>
  <DialogTitle>Add New Tenant</DialogTitle>
  <DialogDescription>...</DialogDescription>
  <AddTenantForm />
</DialogContent>
```

**After:**

```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Add New Tenant</DialogTitle>
    <DialogDescription>...</DialogDescription>
  </DialogHeader>
  <AddTenantForm />
</DialogContent>
```

### 2. `src/components/communication/templates/TemplateDialog.tsx`

**Issue:** Missing `DialogDescription`

**Before:**

```tsx
<DialogHeader>
  <DialogTitle>Create New Template</DialogTitle>
</DialogHeader>
```

**After:**

```tsx
<DialogHeader>
  <DialogTitle>Create New Template</DialogTitle>
  <DialogDescription>
    Create a reusable communication template for tenant communications.
  </DialogDescription>
</DialogHeader>
```

### 3. `src/components/communication/maintenance/card/ImageDialog.tsx`

**Issue:** Missing `DialogDescription`

**Before:**

```tsx
<DialogHeader>
  <DialogTitle>Maintenance Request Image</DialogTitle>
</DialogHeader>
```

**After:**

```tsx
<DialogHeader>
  <DialogTitle>Maintenance Request Image</DialogTitle>
  <DialogDescription>View the image attached to this maintenance request.</DialogDescription>
</DialogHeader>
```

---

## 📋 Proper Dialog Structure

All dialogs should follow this structure:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description of what the dialog does.</DialogDescription>
    </DialogHeader>

    {/* Dialog content */}

    <DialogFooter>{/* Footer buttons */}</DialogFooter>
  </DialogContent>
</Dialog>
```

---

## ✅ Status

- ✅ TenantManagement dialog - Fixed
- ✅ TemplateDialog - Fixed
- ✅ ImageDialog - Fixed
- ✅ All dialogs now have proper accessibility structure

---

**Last Updated:** January 2025
