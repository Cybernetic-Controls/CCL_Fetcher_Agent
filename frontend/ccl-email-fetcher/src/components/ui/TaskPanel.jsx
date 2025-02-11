import React from 'react';
import { Calendar, User, Clock } from 'lucide-react';

const TaskPanel = ({ tasks }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-500" />
        This Week's Tasks
      </h2>
      
      {tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No tasks found for this week
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div 
              key={index} 
              className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded-r-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{task.description}</p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <User className="w-4 h-4 mr-1" />
                    <span>{task.assignee}</span>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{task.deadline}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskPanel;