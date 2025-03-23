import React, { useState, useEffect, useCallback } from 'react';
import { Search, LogOut, RefreshCw, Inbox, Star, AlertCircle, Trash, Send, Tag, FileText, BellRing, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';
import EmailDetail from './components/ui/EmailDetail';
import TaskPanel from './components/ui/TaskPanel';
import Dashboard from './components/Dashboard'; // Import Dashboard component
import API_URL from './apiConfig';

// Simple Toast component
const Toast = ({ message, type, onClose }) => {
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 
      ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      <div className="flex items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
};

const App = () => {
  // Add state to control Dashboard visibility
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Keep all your existing state variables
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  
  // Add toast notification state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  // Add states for email categories
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const [categorizedEmails, setCategorizedEmails] = useState({
    inbox: [],
    important: [],
    spam: [],
    trash: [],
    sent: [],
    promotion: [],
    updates: [],
    notification: [],
    finance: [],
    primary: [],
    ccl_email: [],
    action: []
  });

  // Check if user is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // FIXED categorizeEmails function to ensure emails are in ONLY ONE primary category
  const categorizeEmails = useCallback((emailList) => {
    const categorized = {
      inbox: [],
      important: [],
      spam: [],
      trash: [],
      sent: [],
      promotion: [],
      updates: [],
      notification: [],
      finance: [],
      primary: [],
      ccl_email: [],
      action: []
    };
    
    emailList.forEach(email => {
      // STRICT EXCLUSIVE CATEGORIZATION
      // An email can be in EXACTLY ONE of these primary categories
      if (email.flags?.includes('spam')) {
        categorized.spam.push(email);
      } else if (email.flags?.includes('trash')) {
        categorized.trash.push(email);
      } else if (email.flags?.includes('sent')) {
        categorized.sent.push(email);
      } else {
        // If not in any special category, it goes to inbox
        categorized.inbox.push(email);
        
        // Also add to the appropriate content category based on the category field
        if (email.category) {
          if (categorized[email.category]) {
            categorized[email.category].push(email);
          } else {
            categorized.primary.push(email);
          }
        } else {
          categorized.primary.push(email);
        }
      }
      
      // Important can include emails from any category
      if (email.flags?.includes('important')) {
        categorized.important.push(email);
      }
    });
    
    // Debug to verify counts
    console.log('Email counts:', {
      total: emailList.length,
      inbox: categorized.inbox.length,
      important: categorized.important.length,
      sent: categorized.sent.length,
      spam: categorized.spam.length,
      trash: categorized.trash.length,
      promotion: categorized.promotion.length,
      updates: categorized.updates.length,
      notification: categorized.notification.length,
      finance: categorized.finance.length,
      primary: categorized.primary.length,
      ccl_email: categorized.ccl_email.length,
      action: categorized.action.length,
      sum: categorized.inbox.length + categorized.sent.length + 
      categorized.spam.length + categorized.trash.length
    });
    
    setCategorizedEmails(categorized);
  }, []);

  // Save email flags to localStorage when they change
  useEffect(() => {
    // Save categorized emails to localStorage whenever they change
    if (isAuthenticated && emails.length > 0) {
      localStorage.setItem('emailFlags', JSON.stringify(
        emails.map(email => ({
          id: email.id,
          flags: email.flags || [],
          category: email.category || 'primary'
        }))
      ));
    }
  }, [emails, isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      setIsAuthenticated(true);
      setLoginError('');
    } catch (err) {
      setLoginError('Login failed. Please check your credentials.');
    }
  };

  const fetchEmails = useCallback(async () => {
    try {
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : '';
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : '';
      
      const response = await fetch(
        `${API_URL}/emails/?search=${searchTerm}&start_date=${formattedStartDate}&end_date=${formattedEndDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch emails');
      
      let data = await response.json();
      console.log('Fetched emails:', data);
      
      // NEW: Apply saved flags to fetched emails
      const savedFlags = localStorage.getItem('emailFlags');
      if (savedFlags) {
        try {
          const flagsData = JSON.parse(savedFlags);
          // Apply saved flags to fetched emails
          data = data.map(email => {
            const savedEmail = flagsData.find(item => item.id === email.id);
            if (savedEmail) {
              return {
                ...email,
                flags: savedEmail.flags,
                category: email.category || savedEmail.category || 'primary'
              };
            }
            return {
              ...email,
              category: email.category || 'primary'
            };
          });
        } catch (e) {
          console.error('Error parsing saved flags', e);
        }
      }
      
      setEmails(data);
      categorizeEmails(data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [searchTerm, startDate, endDate, categorizeEmails]);

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const response = await fetch(`${API_URL}/extract-tasks/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data.tasks);
      setTasksLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasksLoading(false);
    }
  }, []);

  const syncEmails = useCallback(async () => {
    console.log('Sync started');
    setSyncStatus('syncing');
    try {
      const response = await fetch(`${API_URL}/sync-emails/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      console.log('Response:', response);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Sync error response:', errorData);
        throw new Error(`Failed to sync emails: ${errorData}`);
      }
      
      setSyncStatus('success');
      setToast({
        visible: true,
        message: "Successfully synced emails",
        type: 'success'
      });
      
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 3000);
      
      await fetchEmails();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      setError(err.message);
      
      setToast({
        visible: true,
        message: `Sync failed: ${err.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'error' });
      }, 3000);
    }
  }, [fetchEmails]);

  // Change email category on server
  const changeEmailContentCategory = useCallback(async (emailId, category) => {
    try {
      const response = await fetch(`${API_URL}/emails/${emailId}/categorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      });
      
      if (!response.ok) {
        throw new Error('Failed to categorize email');
      }
      
      // Update local state
      const updatedEmails = emails.map(email => {
        if (email.id === emailId) {
          return { ...email, category };
        }
        return email;
      });
      
      setEmails(updatedEmails);
      categorizeEmails(updatedEmails);
      
      setToast({
        visible: true,
        message: `Email moved to ${category}`,
        type: 'success'
      });
      
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 3000);
    } catch (err) {
      console.error('Error changing category:', err);
      setError(err.message);
    }
  }, [emails, categorizeEmails]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmails();
      fetchTasks();
      const syncInterval = setInterval(syncEmails, 600000); // 10 minutes
      const taskInterval = setInterval(fetchTasks, 3600000); // Every hour
      return () => {
        clearInterval(syncInterval);
        clearInterval(taskInterval);
      };
    }
  }, [isAuthenticated, fetchEmails, syncEmails, fetchTasks]);

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
  };

  // Helper function to get the current category of an email
  const getEmailCategory = useCallback((email) => {
    if (!email || !email.flags) return 'inbox';
    
    if (email.flags.includes('spam')) return 'spam';
    if (email.flags.includes('trash')) return 'trash';
    if (email.flags.includes('sent')) return 'sent';
    return 'inbox';
  }, []);

  // FIXED: Completely updated changeEmailCategory function to fix category movement issues
  const changeEmailCategory = useCallback(async (emailId, category) => {
    try {
      // Get the email being changed
      const emailToChange = emails.find(email => email.id === emailId);
      const previousCategory = getEmailCategory(emailToChange);
      
      // Skip if trying to move to the same category (except for 'important' which toggles)
      if (previousCategory === category && category !== 'important') {
        return;
      }
      
      // First update UI optimistically - create a new copy of emails array
      const updatedEmails = emails.map(email => {
        if (email.id === emailId) {
          // Create a new flags array to ensure UI updates
          let flags = email.flags ? [...email.flags] : [];
          
          // FIXED: Handle category changes more strictly
          if (category === 'important') {
            // Special case: 'important' is a toggle and can co-exist with other categories
            if (flags.includes('important')) {
              flags = flags.filter(f => f !== 'important');
            } else {
              flags.push('important');
            }
          } else {
            // FIXED: For all other categories, COMPLETELY REMOVE existing category flags first
            flags = flags.filter(f => f === 'important');  // Keep only 'important' flag if present
            
            // Don't add 'inbox' as a flag, it's the default when no other category flag exists
            if (category !== 'inbox') {
              flags.push(category);
            }
          }
          
          // Return updated email with new flags
          return { ...email, flags };
        }
        return email;
      });
      
      // Update emails state - this will trigger re-render
      setEmails(updatedEmails);
      
      // Re-categorize with updated flags
      categorizeEmails(updatedEmails);
      
      // Show toast notification with clear message about what changed
      let toastMessage;
      if (category === 'important') {
        toastMessage = emailToChange.flags?.includes('important')
          ? 'Removed from important'
          : 'Marked as important';
      } else if (previousCategory !== category) {
        toastMessage = `Email moved from ${previousCategory} to ${category}`;
      }
      
      if (toastMessage) {
        setToast({
          visible: true,
          message: toastMessage,
          type: 'success'
        });
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          setToast({ visible: false, message: '', type: 'success' });
        }, 3000);
      }
      
      // Save to localStorage for persistence
      localStorage.setItem('emailFlags', JSON.stringify(
        updatedEmails.map(email => ({
          id: email.id,
          flags: email.flags || [],
          category: email.category || 'primary'
        }))
      ));
      
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
      setToast({
        visible: true,
        message: 'Failed to update email category',
        type: 'error'
      });
      
      // Hide error toast after 3 seconds
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'error' });
      }, 3000);
    }
  }, [emails, categorizeEmails, getEmailCategory]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">CCL Email Fetcher</h2>
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If showing dashboard, render the Dashboard component
  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />;
  }

  // Get the emails for the current category
  const currentEmails = categorizedEmails[currentCategory] || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">CCL Email Fetcher</h1>
          <div className="flex items-center gap-3">
            {/* Dashboard button - Updated to use the state instead of URL */}
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Test Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('emailFlags');
                setIsAuthenticated(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-5 gap-6">
          {/* Email categories sidebar */}
          <div className="col-span-1">
            <nav className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">FOLDERS</h3>
              </div>
              <ul>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('inbox')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'inbox' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <Inbox className="w-5 h-5 mr-3" />
                    Inbox
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.inbox.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('important')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'important' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <Star className="w-5 h-5 mr-3 text-yellow-500" />
                    Important
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.important.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('sent')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'sent' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <Send className="w-5 h-5 mr-3" />
                    Sent
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.sent.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('spam')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'spam' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                    Spam
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.spam.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('trash')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'trash' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <Trash className="w-5 h-5 mr-3" />
                    Trash
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.trash.length}
                    </span>
                  </button>
                </li>
              </ul>

              <div className="px-4 py-3 border-t border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">CATEGORIES</h3>
              </div>
              <ul>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('primary')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'primary' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <Inbox className="w-5 h-5 mr-3 text-blue-500" />
                    Primary
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.primary.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('promotion')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'promotion' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <Tag className="w-5 h-5 mr-3 text-green-500" />
                    Promotions
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.promotion.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('updates')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'updates' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <FileText className="w-5 h-5 mr-3 text-purple-500" />
                    Updates
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.updates.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('notification')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'notification' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <BellRing className="w-5 h-5 mr-3 text-yellow-600" />
                    Notifications
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.notification.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('finance')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'finance' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <DollarSign className="w-5 h-5 mr-3 text-green-600" />
                    Finance
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.finance.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('ccl_email')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'ccl_email' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <FileText className="w-5 h-5 mr-3 text-blue-600" />
                    CCL Emails
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.ccl_email.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentCategory('action')}
                    className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${currentCategory === 'action' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    <AlertCircle className="w-5 h-5 mr-3 text-orange-500" />
                    Action Required
                    <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
                      {categorizedEmails.action.length}
                    </span>
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* Task Panel below the sidebar */}
            <div className="mt-6">
              {tasksLoading ? (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-center py-4">Loading tasks...</div>
                </div>
              ) : (
                <TaskPanel tasks={tasks} />
              )}
            </div>
          </div>

          {/* Email section - Takes up 4 columns */}
          <div className="col-span-4">
            {/* Controls section - Always visible */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    className="pl-10 w-full p-2 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={syncEmails}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      syncStatus === 'syncing' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={syncStatus === 'syncing'}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Email content */}
            {selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                onBack={() => setSelectedEmail(null)}
                onCategoryChange={changeEmailCategory}
                onContentCategoryChange={changeEmailContentCategory}
              />
            ) : (
              <>
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : loading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {/* Different header styles based on current category */}
                      {currentCategory === 'inbox' && (
                        <div className="bg-gray-50 px-4 py-2 text-sm font-medium">
                          Inbox - {currentEmails.length} emails
                        </div>
                      )}
                      {currentCategory === 'important' && (
                        <div className="bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800">
                          Important - {currentEmails.length} emails
                        </div>
                      )}
                      {currentCategory === 'spam' && (
                        <div className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                          Spam - {currentEmails.length} emails
                        </div>
                      )}
                      {currentCategory === 'sent' && (
                        <div className="bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
                          Sent - {currentEmails.length} emails
                        </div>
                      )}
                      {currentCategory === 'trash' && (
                        <div className="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800">
                          Trash - {currentEmails.length} emails
                        </div>
                      )}
                      {currentCategory === 'primary' && (
                        <div className="bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
                          Primary - {currentEmails.length} emails
                        </div>
                      )}
{currentCategory === 'promotion' && (
  <div className="bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
    Promotions - {currentEmails.length} emails
  </div>
)}
{currentCategory === 'updates' && (
  <div className="bg-purple-50 px-4 py-2 text-sm font-medium text-purple-800">
    Updates - {currentEmails.length} emails
  </div>
)}
{currentCategory === 'notification' && (
  <div className="bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800">
    Notifications - {currentEmails.length} emails
  </div>
)}
{currentCategory === 'finance' && (
  <div className="bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
    Finance - {currentEmails.length} emails
  </div>
)}
{currentCategory === 'ccl_email' && (
  <div className="bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
    CCL Emails - {currentEmails.length} emails
  </div>
)}
{currentCategory === 'action' && (
  <div className="bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
    Action Required - {currentEmails.length} emails
  </div>
)}                    
                      {currentEmails.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No emails in this category
                        </div>
                      ) : (
                        currentEmails.map((email) => (
                          <div
                            key={email.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleEmailClick(email)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <h3 className="text-lg font-medium text-gray-900">{email.subject}</h3>
                                <p className="text-sm text-gray-500">{email.sender}</p>
                              </div>
                              <span className="text-sm text-gray-500 ml-4">
                                {new Date(email.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{email.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      )}
    </div>
  );
};

export default App;