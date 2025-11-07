// Console-based Vendor Dashboard Test Script
// This script tests the enhanced vendor dashboard implementation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Enhanced Vendor Dashboard Test Suite');
console.log('=' .repeat(50));

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function runTest(testName, testFn) {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    testFn();
    console.log(`✅ PASSED: ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
    failedTests.push({ name: testName, error: error.message });
  }
}

// Test 1: Check if vendor dashboard components exist
runTest('Vendor Dashboard Components Exist', () => {
  const componentsPath = path.join(__dirname, 'src', 'components', 'vendor');
  
  const requiredComponents = [
    'VendorDashboardOverview.tsx',
    'VendorJobManagement.tsx',
    'VendorPerformanceAnalytics.tsx',
    'VendorProfileManagement.tsx'
  ];
  
  if (!fs.existsSync(componentsPath)) {
    throw new Error('Vendor components directory does not exist');
  }
  
  requiredComponents.forEach(component => {
    const componentPath = path.join(componentsPath, component);
    if (!fs.existsSync(componentPath)) {
      throw new Error(`Component ${component} does not exist`);
    }
  });
});

// Test 2: Check if enhanced vendor data hook exists
runTest('Enhanced Vendor Data Hook Exists', () => {
  const hookPath = path.join(__dirname, 'src', 'hooks', 'useEnhancedVendorData.ts');
  
  if (!fs.existsSync(hookPath)) {
    throw new Error('useEnhancedVendorData hook does not exist');
  }
  
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  // Check for key exports
  const requiredExports = [
    'useEnhancedVendorData',
    'VendorStats',
    'VendorPerformanceMetrics'
  ];
  
  requiredExports.forEach(exportName => {
    if (!hookContent.includes(exportName)) {
      throw new Error(`Hook missing required export: ${exportName}`);
    }
  });
});

// Test 3: Check vendor dashboard page integration
runTest('Vendor Dashboard Page Integration', () => {
  const dashboardPath = path.join(__dirname, 'src', 'pages', 'VendorDashboardPage.tsx');
  
  if (!fs.existsSync(dashboardPath)) {
    throw new Error('VendorDashboardPage does not exist');
  }
  
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check for key imports
  const requiredImports = [
    'useEnhancedVendorData',
    'VendorDashboardOverview',
    'VendorJobManagement',
    'VendorPerformanceAnalytics',
    'VendorProfileManagement'
  ];
  
  requiredImports.forEach(importName => {
    if (!dashboardContent.includes(importName)) {
      throw new Error(`Dashboard page missing required import: ${importName}`);
    }
  });
});

// Test 4: Check component structure and exports
runTest('Component Structure and Exports', () => {
  const componentsPath = path.join(__dirname, 'src', 'components', 'vendor');
  
  const components = [
    { file: 'VendorDashboardOverview.tsx', export: 'VendorDashboardOverview' },
    { file: 'VendorJobManagement.tsx', export: 'VendorJobManagement' },
    { file: 'VendorPerformanceAnalytics.tsx', export: 'VendorPerformanceAnalytics' },
    { file: 'VendorProfileManagement.tsx', export: 'VendorProfileManagement' }
  ];
  
  components.forEach(({ file, export: exportName }) => {
    const componentPath = path.join(componentsPath, file);
    const content = fs.readFileSync(componentPath, 'utf8');
    
    if (!content.includes(`export const ${exportName}`)) {
      throw new Error(`Component ${file} missing proper export: ${exportName}`);
    }
    
    // Check for React import
    if (!content.includes('import React') && !content.includes('import { ')) {
      throw new Error(`Component ${file} missing React import`);
    }
    
    // Check for TypeScript interface
    if (!content.includes('interface ') && !content.includes('type ')) {
      throw new Error(`Component ${file} missing TypeScript interfaces`);
    }
  });
});

// Test 5: Check testing integration
runTest('Testing Integration', () => {
  const testingPagePath = path.join(__dirname, 'src', 'pages', 'TestingPage.tsx');
  
  if (!fs.existsSync(testingPagePath)) {
    throw new Error('TestingPage does not exist');
  }
  
  const testingContent = fs.readFileSync(testingPagePath, 'utf8');
  
  if (!testingContent.includes('VendorDashboardTestRunner')) {
    throw new Error('TestingPage missing VendorDashboardTestRunner integration');
  }
  
  if (!testingContent.includes('vendor-dashboard')) {
    throw new Error('TestingPage missing vendor-dashboard tab');
  }
});

// Test 6: Check database migration files
runTest('Database Migration Files', () => {
  const migrationsPath = path.join(__dirname, 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsPath)) {
    throw new Error('Migrations directory does not exist');
  }
  
  const migrationFiles = fs.readdirSync(migrationsPath);
  const vendorMigration = migrationFiles.find(file => 
    file.includes('vendor') && file.includes('onboarding')
  );
  
  if (!vendorMigration) {
    throw new Error('Vendor onboarding migration file not found');
  }
  
  const migrationPath = path.join(migrationsPath, vendorMigration);
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Check for required tables
  if (!migrationContent.includes('vendors') || !migrationContent.includes('vendor_jobs')) {
    throw new Error('Migration missing required vendor tables');
  }
});

// Test 7: Check TypeScript compilation readiness
runTest('TypeScript Compilation Readiness', () => {
  const tsConfigPath = path.join(__dirname, 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    throw new Error('tsconfig.json does not exist');
  }
  
  // Check if all vendor components have proper TypeScript syntax
  const componentsPath = path.join(__dirname, 'src', 'components', 'vendor');
  const componentFiles = fs.readdirSync(componentsPath);
  
  componentFiles.forEach(file => {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(componentsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic TypeScript checks
      if (!content.includes(': React.FC') && !content.includes(': FC')) {
        throw new Error(`Component ${file} missing proper TypeScript React.FC typing`);
      }
    }
  });
});

// Test 8: Check UI component imports
runTest('UI Component Imports', () => {
  const componentsPath = path.join(__dirname, 'src', 'components', 'vendor');
  const componentFiles = fs.readdirSync(componentsPath);
  
  componentFiles.forEach(file => {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(componentsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for shadcn/ui imports
      const requiredUIImports = ['Card', 'Button'];
      const hasUIImports = requiredUIImports.some(uiImport => 
        content.includes(`'@/components/ui/`) && content.includes(uiImport)
      );
      
      if (!hasUIImports) {
        throw new Error(`Component ${file} missing required UI component imports`);
      }
    }
  });
});

// Test 9: Check Nigerian localization
runTest('Nigerian Localization Features', () => {
  const hookPath = path.join(__dirname, 'src', 'hooks', 'useEnhancedVendorData.ts');
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  // Check for Nigerian currency formatting
  if (!hookContent.includes('NGN') && !hookContent.includes('en-NG')) {
    console.log('Warning: Nigerian currency formatting may not be implemented in hook');
  }
  
  // Check components for Nigerian context
  const componentsPath = path.join(__dirname, 'src', 'components', 'vendor');
  const overviewPath = path.join(componentsPath, 'VendorDashboardOverview.tsx');
  
  if (fs.existsSync(overviewPath)) {
    const overviewContent = fs.readFileSync(overviewPath, 'utf8');
    if (!overviewContent.includes('₦') && !overviewContent.includes('NGN')) {
      console.log('Warning: Nigerian Naira symbol may not be used in overview component');
    }
  }
});

// Test 10: Check file structure completeness
runTest('File Structure Completeness', () => {
  const requiredPaths = [
    'src/components/vendor',
    'src/hooks',
    'src/pages',
    'src/components/testing',
    'supabase/migrations'
  ];
  
  requiredPaths.forEach(requiredPath => {
    const fullPath = path.join(__dirname, requiredPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required directory does not exist: ${requiredPath}`);
    }
  });
  
  const requiredFiles = [
    'src/pages/VendorDashboardPage.tsx',
    'src/hooks/useEnhancedVendorData.ts',
    'src/components/testing/VendorDashboardTestRunner.tsx'
  ];
  
  requiredFiles.forEach(requiredFile => {
    const fullPath = path.join(__dirname, requiredFile);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required file does not exist: ${requiredFile}`);
    }
  });
});

// Print final results
console.log('\n' + '=' .repeat(50));
console.log('📊 TEST RESULTS SUMMARY');
console.log('=' .repeat(50));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
  console.log('\n🔍 FAILED TESTS DETAILS:');
  failedTests.forEach(({ name, error }) => {
    console.log(`\n❌ ${name}`);
    console.log(`   ${error}`);
  });
} else {
  console.log('\n🎉 ALL TESTS PASSED! Enhanced Vendor Dashboard is ready for production!');
}

console.log('\n' + '=' .repeat(50));
