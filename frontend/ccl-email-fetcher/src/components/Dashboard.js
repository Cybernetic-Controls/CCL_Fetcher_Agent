import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Server, Database, UserCheck, Mail, FileText, ArrowLeft, PieChart, BarChart2 } from 'lucide-react';
import API_URL from '../apiConfig';

const EnhancedTestDashboard = () => {
  const [systemStatus, setSystemStatus] = useState({
    auth: { status: 'loading', message: 'Checking authentication...', details: {} },
    api: { status: 'loading', message: 'Checking API connection...', details: {} },
    emails: { status: 'loading', message: 'Checking emails API...', details: {} },
    categorization: { status: 'loading', message: 'Checking email categorization...', details: {} },
    sync: { status: 'loading', message: 'Checking email sync capability...', details: {} },
    tasks: { status: 'loading', message: 'Checking tasks API...', details: {} },
    database: { status: 'loading', message: 'Checking database connection...', details: {} }
  });
  
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [emailCategories, setEmailCategories] = useState({});
  
  // Check authentication status
  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { 
        status: 'error', 
        message: 'No authentication token found',
        details: { token: 'Missing' }
      };
    }
    
    try {
      // Simple validation that the token looks like a JWT (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { 
          status: 'error', 
          message: 'Invalid token format',
          details: { token: 'Malformed' }
        };
      }
      
      return { 
        status: 'success', 
        message: 'User is authenticated',
        details: { token: 'Valid' }
      };
    } catch (e) {
      return { 
        status: 'error', 
        message: 'Token validation failed',
        details: { error: e.message }
      };
    }
  }, []);
  
  // The main function to check all system components
  const checkSystemStatus = useCallback(async () => {
    setLoading(true);
    
    // Initial status update - Authentication
    const authStatus = checkAuthStatus();
    setSystemStatus(prev => ({
      ...prev,
      auth: authStatus
    }));
    
    // If authentication fails, don't proceed with other checks
    if (authStatus.status === 'error') {
      setLoading(false);
      setLastChecked(new Date());
      return;
    }
    
    const token = localStorage.getItem('token');
    
    // Check API connection (general)
    try {
      const startTime = performance.now();
      const apiResponse = await fetch(`${API_URL}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        setSystemStatus(prev => ({
          ...prev,
          api: { 
            status: 'success', 
            message: 'API is accessible',
            details: { 
              responseTime: `${responseTime.toFixed(0)}ms`, 
              version: data.version || 'Unknown' 
            }
          }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          api: { 
            status: 'error', 
            message: `API returned status ${apiResponse.status}`,
            details: { 
              responseTime: `${responseTime.toFixed(0)}ms`, 
              status: apiResponse.status 
            }
          }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        api: { 
          status: 'error', 
          message: `Cannot connect to API: ${error.message}`,
          details: { error: error.message } 
        }
      }));
    }
    
    // Check Emails API with detailed stats
    const emailCategoryCounts = {};
    try {
      const startTime = performance.now();
      const emailsResponse = await fetch(`${API_URL}/emails/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (emailsResponse.ok) {
        const data = await emailsResponse.json();
        
        // Count emails by category
        data.forEach(email => {
          const category = email.category || 'uncategorized';
          emailCategoryCounts[category] = (emailCategoryCounts[category] || 0) + 1;
        });
        
        setEmailCategories(emailCategoryCounts);
        
        setSystemStatus(prev => ({
          ...prev,
          emails: { 
            status: 'success', 
            message: `Email API working. Found ${data.length} emails.`,
            details: { 
              count: data.length,
              responseTime: `${responseTime.toFixed(0)}ms`,
              categories: Object.keys(emailCategoryCounts).length
            }
          }
        }));
        
        // Check if categorization is working correctly
        const hasCategories = Object.keys(emailCategoryCounts).length > 1;
        const categorizationStatus = hasCategories ? 'success' : 'error';
        
        setSystemStatus(prev => ({
          ...prev,
          categorization: {
            status: categorizationStatus,
            message: hasCategories ? 
              `Email categorization working. Found ${Object.keys(emailCategoryCounts).length} categories.` : 
              'Email categorization not working properly.',
            details: emailCategoryCounts
          }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          emails: { 
            status: 'error', 
            message: `Email API returned status ${emailsResponse.status}`,
            details: { 
              responseTime: `${responseTime.toFixed(0)}ms`, 
              status: emailsResponse.status 
            }
          },
          categorization: {
            status: 'error',
            message: 'Could not check email categorization due to email API failure',
            details: {}
          }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        emails: { 
          status: 'error', 
          message: `Cannot connect to Email API: ${error.message}`,
          details: { error: error.message } 
        },
        categorization: {
          status: 'error',
          message: 'Could not check email categorization due to email API failure',
          details: {}
        }
      }));
    }
    
    // Check Sync API
    try {
      const startTime = performance.now();
      // Using HEAD method to check if endpoint exists without actual syncing
      const syncResponse = await fetch(`${API_URL}/sync-emails/`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const syncStatus = syncResponse.status !== 404 ? 'success' : 'error';
      
      setSystemStatus(prev => ({
        ...prev,
        sync: {
          status: syncStatus,
          message: syncStatus === 'success' ? 
            'Email sync API available' : 
            'Email sync API not available',
          details: { 
            status: syncResponse.status,
            responseTime: `${responseTime.toFixed(0)}ms`
          }
        }
      }));
    } catch (error) {
      console.log('Sync check error:', error);
      // If HEAD method fails, try the real sync but with timeout to avoid long wait
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const syncResponse = await fetch(`${API_URL}/sync-emails/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        setSystemStatus(prev => ({
          ...prev,
          sync: {
            status: 'success',
            message: 'Email sync API available',
            details: { status: syncResponse.status }
          }
        }));
      } catch (syncError) {
        setSystemStatus(prev => ({
          ...prev,
          sync: {
            status: 'error',
            message: `Email sync API check failed: ${syncError.name === 'AbortError' ? 'Timeout' : syncError.message}`,
            details: { error: syncError.message }
          }
        }));
      }
    }
    
    // Check Tasks API
    try {
      const startTime = performance.now();
      const tasksResponse = await fetch(`${API_URL}/extract-tasks/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (tasksResponse.ok) {
        const data = await tasksResponse.json();
        setSystemStatus(prev => ({
          ...prev,
          tasks: { 
            status: 'success', 
            message: `Tasks API working. Found ${data.tasks ? data.tasks.length : 0} tasks.`,
            details: { 
              count: data.tasks ? data.tasks.length : 0,
              responseTime: `${responseTime.toFixed(0)}ms`
            }
          }
        }));
      } else {
        const errorText = await tasksResponse.text();
        setSystemStatus(prev => ({
          ...prev,
          tasks: { 
            status: 'error', 
            message: `Tasks API returned status ${tasksResponse.status}`,
            details: { 
              responseTime: `${responseTime.toFixed(0)}ms`, 
              status: tasksResponse.status,
              error: errorText
            }
          }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        tasks: { 
          status: 'error', 
          message: `Cannot connect to Tasks API: ${error.message}`,
          details: { error: error.message } 
        }
      }));
    }
    
    // Update database status - we'll do this after all requests complete
    setTimeout(() => {
      const currentStatus = { ...systemStatus };
      
      // Consider database connected if any API endpoint works
      const isAnyApiWorking = 
        currentStatus.emails.status === 'success' || 
        currentStatus.tasks.status === 'success';
      
      // Update database status based on API responses
      setSystemStatus(prev => ({
        ...prev,
        database: { 
          status: isAnyApiWorking ? 'success' : 'error', 
          message: isAnyApiWorking ? 
            'Database appears to be connected' : 
            'Database connection issues detected',
          details: {
            emailsApi: currentStatus.emails.status,
            tasksApi: currentStatus.tasks.status
          }
        }
      }));
      
      setLoading(false);
      setLastChecked(new Date());
    }, 500);
    
  }, [checkAuthStatus]);
  
  // Run initial system check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    
    checkSystemStatus();
    
    // Auto refresh every 60 seconds
    const refreshInterval = setInterval(checkSystemStatus, 60000);
    return () => clearInterval(refreshInterval);
  }, [checkSystemStatus]);
  
  // Helper function to get an icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'loading':
      default:
        return <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />;
    }
  };
  
  // Helper function to get a status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-1 inline-flex items-center rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Operational
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 inline-flex items-center rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Issue Detected
          </span>
        );
      case 'loading':
      default:
        return (
          <span className="px-2 py-1 inline-flex items-center rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Checking...
          </span>
        );
    }
  };
  
  // Get overall system status summary
  const getSystemStatusSummary = () => {
    const statuses = Object.values(systemStatus).map(s => s.status);
    
    if (statuses.every(s => s === 'success')) {
      return {
        message: 'All Systems Operational',
        color: 'text-green-600',
        background: 'bg-green-50'
      };
    } else if (statuses.some(s => s === 'error')) {
      return {
        message: 'System Issues Detected',
        color: 'text-red-600',
        background: 'bg-red-50'
      };
    } else {
      return {
        message: 'Checking System Status',
        color: 'text-blue-600',
        background: 'bg-blue-50'
      };
    }
  };
  
  const summary = getSystemStatusSummary();
  
  // Calculate overall health percentage
  const calculateHealthPercentage = () => {
    const total = Object.keys(systemStatus).length;
    const operational = Object.values(systemStatus).filter(s => s.status === 'success').length;
    return Math.round((operational / total) * 100);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center">
          <button 
            onClick={() => window.location.href = '/'}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 flex items-center"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="ml-1">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">System Test Dashboard</h1>
          <button 
            onClick={() => checkSystemStatus()}
            className="ml-auto flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* System Status Summary */}
        <div className={`mb-8 p-6 rounded-lg shadow ${summary.background} transition-all duration-500`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${summary.color}`}>{summary.message}</h2>
              {lastChecked && (
                <p className="mt-2 text-sm text-gray-500">
                  Last checked: {lastChecked.toLocaleString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">{calculateHealthPercentage()}%</div>
              <div className="text-sm text-gray-500">System Health</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                calculateHealthPercentage() === 100 ? 'bg-green-500' : 
                calculateHealthPercentage() >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${calculateHealthPercentage()}%` }}
            ></div>
          </div>
        </div>
        
        {/* Component Status Cards - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Auth Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
            <div className={`p-4 ${systemStatus.auth.status === 'success' ? 'bg-green-50' : systemStatus.auth.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <UserCheck className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Authentication</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.auth.status)}
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center">
              {getStatusIcon(systemStatus.auth.status)}
              <div className="ml-3">
                <p className="text-gray-600">{systemStatus.auth.message}</p>
                {systemStatus.auth.details && Object.keys(systemStatus.auth.details).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(systemStatus.auth.details).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium mr-1">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* API Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
            <div className={`p-4 ${systemStatus.api.status === 'success' ? 'bg-green-50' : systemStatus.api.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <Server className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">API Connection</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.api.status)}
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center">
              {getStatusIcon(systemStatus.api.status)}
              <div className="ml-3">
                <p className="text-gray-600">{systemStatus.api.message}</p>
                {systemStatus.api.details && Object.keys(systemStatus.api.details).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(systemStatus.api.details).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium mr-1">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Database Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
            <div className={`p-4 ${systemStatus.database.status === 'success' ? 'bg-green-50' : systemStatus.database.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <Database className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Database</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.database.status)}
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center">
              {getStatusIcon(systemStatus.database.status)}
              <div className="ml-3">
                <p className="text-gray-600">{systemStatus.database.message}</p>
                {systemStatus.database.details && Object.keys(systemStatus.database.details).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(systemStatus.database.details).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium mr-1">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Component Status Cards - Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Emails API Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
            <div className={`p-4 ${systemStatus.emails.status === 'success' ? 'bg-green-50' : systemStatus.emails.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <Mail className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Emails Service</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.emails.status)}
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center">
              {getStatusIcon(systemStatus.emails.status)}
              <div className="ml-3">
                <p className="text-gray-600">{systemStatus.emails.message}</p>
                {systemStatus.emails.details && Object.keys(systemStatus.emails.details).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(systemStatus.emails.details).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium mr-1">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Email Categorization Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
            <div className={`p-4 ${systemStatus.categorization.status === 'success' ? 'bg-green-50' : systemStatus.categorization.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <PieChart className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Email Categories</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.categorization.status)}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center mb-2">
                {getStatusIcon(systemStatus.categorization.status)}
                <p className="ml-3 text-gray-600">{systemStatus.categorization.message}</p>
              </div>
              
              {Object.keys(emailCategories).length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(emailCategories).map(([category, count]) => (
                    <div key={category} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="font-medium text-gray-700">{category}:</span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Email Sync Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
            <div className={`p-4 ${systemStatus.sync.status === 'success' ? 'bg-green-50' : systemStatus.sync.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <RefreshCw className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Email Sync</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.sync.status)}
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center">
              {getStatusIcon(systemStatus.sync.status)}
              <div className="ml-3">
                <p className="text-gray-600">{systemStatus.sync.message}</p>
                {systemStatus.sync.details && Object.keys(systemStatus.sync.details).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(systemStatus.sync.details).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium mr-1">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tasks API Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md transform hover:-translate-y-1 lg:col-span-3">
            <div className={`p-4 ${systemStatus.tasks.status === 'success' ? 'bg-green-50' : systemStatus.tasks.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Tasks Service</h3>
                <div className="ml-auto">
                  {getStatusBadge(systemStatus.tasks.status)}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                {getStatusIcon(systemStatus.tasks.status)}
                <div className="ml-3 flex-grow">
                  <p className="text-gray-600">{systemStatus.tasks.message}</p>
                  {systemStatus.tasks.details && Object.keys(systemStatus.tasks.details).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.entries(systemStatus.tasks.details).filter(([key]) => key !== 'error').map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium mr-1">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {systemStatus.tasks.status === 'error' && systemStatus.tasks.details?.error && (
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => alert(`Error details:\n${systemStatus.tasks.details.error}`)}
                  >
                    View Error Details
                  </button>
                )}
              </div>
              
              {systemStatus.tasks.status === 'error' && (
                <div className="mt-3 text-sm border-t pt-3">
                  <p className="font-medium text-red-600">Possible issues:</p>
                  <ul className="list-disc pl-5 mt-1 text-gray-600">
                    <li>Check if the Tasks API endpoint is correctly set up as POST method</li>
                    <li>Verify the Anthropic API key is valid in environment variables</li>
                    <li>Check database connection for Task table access</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Activity Log */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Troubleshooting Guide</h2>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-800 mb-2">Common Issues</h3>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded">
                  <p className="text-yellow-800 font-medium">Authentication Issues</p>
                  <p className="text-sm text-gray-600 mt-1">If authentication fails, check that your token is valid. Try logging out and back in again to refresh your credentials.</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded">
                  <p className="text-yellow-800 font-medium">API Connection Failures</p>
                  <p className="text-sm text-gray-600 mt-1">If API connections are failing, verify that your network connection is stable and that the API server is running correctly.</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded">
                  <p className="text-yellow-800 font-medium">Email Categorization Problems</p>
                  <p className="text-sm text-gray-600 mt-1">If email categorization isn't working, verify that the categorization service is properly configured and that the model is functioning correctly.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Next Steps</h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                <li>If all services are operational, you can proceed with your work.</li>
                <li>If multiple services are down, contact the system administrator.</li>
                <li>For persistent email sync issues, check your email provider's API access settings.</li>
                <li>If tasks extraction is not working, verify the AI service configuration.</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* System Meta Info */}
        <div className="mt-6 flex justify-end">
          <div className="text-xs text-gray-500">
            <div>Version: 1.0.2</div>
            <div>Environment: {process.env.NODE_ENV}</div>
            <div>Build: {process.env.REACT_APP_BUILD_ID || 'Development'}</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancedTestDashboard;