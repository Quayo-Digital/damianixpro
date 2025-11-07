
import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';

// Lazy load pages
const Landing = lazy(() => import('@/pages/Landing'));
const Auth = lazy(() => import('@/pages/Auth'));
const PublicProperties = lazy(() => import('@/pages/PublicProperties'));
const PublicPropertyDetail = lazy(() => import('@/pages/PublicPropertyDetail'));
const TenantApplication = lazy(() => import('@/pages/TenantApplication'));
const TenantApplicationSuccess = lazy(() => import('@/pages/TenantApplicationSuccess'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const NewBlogPost = lazy(() => import('@/pages/NewBlogPost'));
const EditBlogPost = lazy(() => import('@/pages/EditBlogPost'));
const PublicDocumentation = lazy(() => import('@/pages/PublicDocumentation'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export function PublicRoutes() {
  const location = useLocation();
  
  // Check if we're on the base auth route
  if (location.pathname === '/auth') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Auth />
      </Suspense>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={
        <Suspense fallback={<PageLoader />}>
          <Landing />
        </Suspense>
      } />
      
      <Route path="/auth" element={
        <Suspense fallback={<PageLoader />}>
          <Auth />
        </Suspense>
      } />
      
      <Route path="/properties" element={
        <Suspense fallback={<PageLoader />}>
          <PublicProperties />
        </Suspense>
      } />
      
      <Route path="/properties/:id" element={
        <Suspense fallback={<PageLoader />}>
          <PublicPropertyDetail />
        </Suspense>
      } />
      
      <Route path="/apply/:id" element={
        <Suspense fallback={<PageLoader />}>
          <TenantApplication />
        </Suspense>
      } />
      
      <Route path="/application-success" element={
        <Suspense fallback={<PageLoader />}>
          <TenantApplicationSuccess />
        </Suspense>
      } />
      
      {/* Public Documentation */}
      <Route path="/docs" element={
        <Suspense fallback={<PageLoader />}>
          <PublicDocumentation />
        </Suspense>
      } />
      
      {/* Blog Routes */}
      <Route path="/blog" element={
        <Suspense fallback={<PageLoader />}>
          <Blog />
        </Suspense>
      } />
      
      <Route path="/blog/new" element={
        <Suspense fallback={<PageLoader />}>
          <NewBlogPost />
        </Suspense>
      } />
      
      <Route path="/blog/edit/:slug" element={
        <Suspense fallback={<PageLoader />}>
          <EditBlogPost />
        </Suspense>
      } />
      
      <Route path="/blog/:slug" element={
        <Suspense fallback={<PageLoader />}>
          <BlogPost />
        </Suspense>
      } />
      
      {/* Redirect any unknown public routes to the 404 page */}
      <Route path="*" element={
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      } />
    </Routes>
  );
}
