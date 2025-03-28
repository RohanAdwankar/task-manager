import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableTask = ({ event, onShiftClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      onClick={(e) => { if (e.shiftKey) onShiftClick && onShiftClick(event); }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        background: event.completed ? '#2e7d32' : '#444',
        marginBottom: '0.25rem',
        padding: '0.25rem',
        borderRadius: '4px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        cursor: 'move',
        color: '#fff',
        border: event.completed ? 'none' : (event.urgent ? '2px solid red' : 'none')
      }}
    >
      {event.title}
    </div>
  );
};

export default DraggableTask;
