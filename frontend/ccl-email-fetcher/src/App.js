import React, { useState, useEffect, useCallback } from 'react';
import { Search, LogOut, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';
import EmailDetail from './components/ui/EmailDetail';
import TaskPanel from './components/ui/TaskPanel';
import API_URL from './apiConfig';

const App = () => {
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
      
      const data = await response.json();
      console.log('Fetched emails:', data); // Debug log
      setEmails(data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err); // Debug log
      setError(err.message);
      setLoading(false);
    }
  }, [searchTerm, startDate, endDate]);

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
    console.log('Sync started');  // Debug log
    setSyncStatus('syncing');
    try {
      const response = await fetch(`${API_URL}/sync-emails/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Response:', response);  // Debug log
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Sync error response:', errorData);
        throw new Error(`Failed to sync emails: ${errorData}`);
      }
      
      setSyncStatus('success');
      await fetchEmails();
    } catch (err) {
      console.error('Sync error:', err);  // Debug log
      setSyncStatus('error');
      setError(err.message);
    }
  }, [fetchEmails]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">CCL Email Fetcher</h1>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Email section - Takes up 3 columns */}
          <div className="col-span-3">
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
                      {emails.map((email) => (
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
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Task Panel - Takes up 1 column */}
          <div className="col-span-1">
            {tasksLoading ? (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center py-4">Loading tasks...</div>
              </div>
            ) : (
              <TaskPanel tasks={tasks} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;