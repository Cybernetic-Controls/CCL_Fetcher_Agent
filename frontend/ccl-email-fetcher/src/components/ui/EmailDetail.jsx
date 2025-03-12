import React from 'react';
import { ArrowLeft, Star, AlertCircle, Trash, Inbox } from 'lucide-react';

const EmailDetail = ({ email, onBack, onCategoryChange }) => {
  return (
    <article className="bg-white rounded-lg shadow p-6">
      <header className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inbox
        </button>
        
        {/* Category Actions */}
        <nav className="flex space-x-3" aria-label="Email actions">
          <button 
            onClick={() => onCategoryChange?.(email.id, 'important')}
            className={`p-2 rounded-full ${email.flags?.includes('important') ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100'}`}
            title="Mark as important"
            aria-label="Mark as important"
          >
            <Star className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => onCategoryChange?.(email.id, 'spam')}
            className={`p-2 rounded-full ${email.flags?.includes('spam') ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
            title="Mark as spam"
            aria-label="Mark as spam"
          >
            <AlertCircle className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => onCategoryChange?.(email.id, 'trash')}
            className={`p-2 rounded-full ${email.flags?.includes('trash') ? 'bg-gray-200 text-gray-600' : 'hover:bg-gray-100'}`}
            title="Move to trash"
            aria-label="Move to trash"
          >
            <Trash className="w-5 h-5" />
          </button>
          
          {(email.flags?.includes('spam') || email.flags?.includes('trash')) && (
            <button 
              onClick={() => onCategoryChange?.(email.id, 'inbox')}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Move to inbox"
              aria-label="Move to inbox"
            >
              <Inbox className="w-5 h-5" />
            </button>
          )}
        </nav>
      </header>
      
      <section className="border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{email.subject}</h1>
        <div className="flex justify-between items-center text-gray-600">
          <address className="not-italic">
            <p className="font-medium">From: {email.sender}</p>
            <p>To: {email.recipient}</p>
          </address>
          <time dateTime={new Date(email.date).toISOString()}>
            {new Date(email.date).toLocaleString()}
          </time>
        </div>
      </section>

      <main className="prose max-w-none">
        <div className="whitespace-pre-wrap">{email.body}</div>
      </main>
    </article>
  );
};

export default EmailDetail;