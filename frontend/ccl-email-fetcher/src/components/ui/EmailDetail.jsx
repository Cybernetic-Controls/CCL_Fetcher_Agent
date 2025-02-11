import React from 'react';
import { ArrowLeft } from 'lucide-react';

const EmailDetail = ({ email, onBack }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inbox
        </button>
      </div>
      
      <div className="border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{email.subject}</h1>
        <div className="flex justify-between items-center text-gray-600">
          <div>
            <p className="font-medium">From: {email.sender}</p>
            <p>To: {email.recipient}</p>
          </div>
          <p>{new Date(email.date).toLocaleString()}</p>
        </div>
      </div>

      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap">{email.body}</div>
      </div>
    </div>
  );
};

export default EmailDetail;