import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../config/api';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSelection } from '../context/SelectionContext';
function TodoForm({ item, onTodoAdded }) {
  const { activeValue, activeInput } = useSelection();
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine the type and referenceId based on what's active
    const type = activeInput ? 'input' : 'value';
    const referenceId = activeInput ? activeInput.IID : activeValue?.VID;

    if (!referenceId) {
      console.warn('No active value or input selected');
      return;
    }

    try {
      const response = await axios.post(api.endpoints.todos, {
        description,
        type,
        referenceId
      });
      
      setDescription('');
      
      // Add the new todo to local state using the response data
      if (onTodoAdded) {
        onTodoAdded(response.data);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  // Get the color to use for the border
  const borderColor = item.color || '#ddd';

  return (
    <div className="form-control">
      <div className="flex items-center gap-2 w-full">
        <button 
          onClick={handleSubmit} 
          className="btn btn-square btn-primary"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e);
            }
          }}
          placeholder="Enter todo description"
          className="input input-bordered flex-1 bg-gray-100"
          required
        />
      </div>
    </div>
  );
}

export default TodoForm; 