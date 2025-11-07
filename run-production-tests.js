/**
 * Production Testing Runner
 * Executes comprehensive production tests for live data integration
 */

import ProductionPerformanceTest from './src/services/testing/ProductionPerformanceTest.js';

async function runProductionTests() {
  console.log('🚀 Starting Production Performance Tests...\n');
  
  const testSuite = new ProductionPerformanceTest();
  
  try {
    // Run comprehensive production tests
    console.log('📊 Running comprehensive production tests...');
    const results = await testSuite.runProductionTests();
    
    console.log('\n=== PRODUCTION TEST RESULTS ===\n');
    
    // Display overall score
    console.log(`📈 Overall Production Readiness Score: ${results.overallScore}/100`);
    
    if (results.overallScore >= 90) {
      console.log('✅ EXCELLENT - Production Ready!');
    } else if (results.overallScore >= 70) {
      console.log('⚠️  GOOD - Minor optimizations needed');
    } else {
      console.log('❌ NEEDS IMPROVEMENT - Address critical issues');
    }
    
    console.log('\n--- Individual Test Results ---\n');
    
    // Display individual test results
    results.performanceTests.forEach((test, index) => {
      const statusIcon = test.status === 'PASSED' ? '✅' : 
                        test.status === 'WARNING' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${test.testName}`);
      console.log(`   Status: ${test.status} | Score: ${test.score}/100 | Duration: ${test.duration}ms`);
      console.log(`   Details: ${test.details}`);
      
      // Show key metrics
      if (Object.keys(test.metrics).length > 0) {
        console.log('   Metrics:');
        Object.entries(test.metrics).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value}`);
        });
      }
      
      // Show recommendations
      if (test.recommendations.length > 0) {
        console.log('   Recommendations:');
        test.recommendations.forEach(rec => {
          console.log(`     • ${rec}`);
        });
      }
      
      console.log('');
    });
    
    // Display overall recommendations
    if (results.recommendations.length > 0) {
      console.log('\n--- Overall Recommendations ---\n');
      results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    // Run load tests
    console.log('\n🔄 Running load tests...');
    const loadResults = await testSuite.runLoadTests();
    
    console.log('\n=== LOAD TEST RESULTS ===\n');
    
    loadResults.forEach(result => {
      const statusIcon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'WARNING' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${result.testType}`);
      console.log(`   Concurrent Users: ${result.concurrentUsers}`);
      console.log(`   Requests/Second: ${result.requestsPerSecond}`);
      console.log(`   Avg Response Time: ${result.averageResponseTime}ms`);
      console.log(`   P95 Response Time: ${result.p95ResponseTime}ms`);
      console.log(`   Error Rate: ${result.errorRate}%`);
      console.log(`   Status: ${result.status}\n`);
    });
    
    // Summary
    console.log('\n=== SUMMARY ===\n');
    console.log(`✅ Tests Completed: ${results.performanceTests.length}`);
    console.log(`📊 Overall Score: ${results.overallScore}/100`);
    console.log(`🔄 Load Tests: ${loadResults.length}`);
    
    const passedTests = results.performanceTests.filter(t => t.status === 'PASSED').length;
    const warningTests = results.performanceTests.filter(t => t.status === 'WARNING').length;
    const failedTests = results.performanceTests.filter(t => t.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`⚠️  Warnings: ${warningTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    if (results.overallScore >= 80) {
      console.log('\n🎉 Platform is ready for production deployment!');
    } else {
      console.log('\n⚠️  Please address the recommendations before production deployment.');
    }
    
  } catch (error) {
    console.error('❌ Production tests failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the tests
runProductionTests().catch(console.error);
