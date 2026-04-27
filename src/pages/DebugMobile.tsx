import React from 'react';

// Minimal debug component to isolate the "can't convert item to string" error
export const DebugMobile = () => {
  console.log('DebugMobile component rendering...');

  try {
    return (
      <div className="p-4">
        <h1>Debug Mobile Component</h1>
        <p>This component is working if you can see this text.</p>
        <div>Test: Basic JSX rendering</div>
      </div>
    );
  } catch (error) {
    console.error('Error in DebugMobile:', error);
    return (
      <div className="p-4 text-red-600">
        <h1>Error in DebugMobile</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }
};
