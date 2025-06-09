use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub comments: Vec<TaskComment>,
    pub completed: bool,
    pub order: u32, // Task ordering within a day (0-based)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskComment {
    pub id: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskData {
    pub events: Vec<Task>,
}

impl Task {
    pub fn new(title: String, start: DateTime<Utc>) -> Self {
        let id = Uuid::new_v4().to_string();
        let end = start + chrono::Duration::hours(1);
        
        Self {
            id,
            title,
            start,
            end,
            comments: vec![],
            completed: false,
            order: 0, // Default order, will be set when inserting
        }
    }
    
    pub fn add_comment(&mut self, text: String) {
        let comment = TaskComment {
            id: Uuid::new_v4().to_string(),
            text,
        };
        self.comments.push(comment);
    }
    
    pub fn is_on_date(&self, date: chrono::NaiveDate) -> bool {
        let task_date = self.start.date_naive();
        task_date == date
    }
}

impl TaskData {
    /// Get all tasks for a specific date, sorted by order
    pub fn get_tasks_for_date(&self, date: chrono::NaiveDate) -> Vec<&Task> {
        let mut tasks: Vec<_> = self.events.iter()
            .filter(|t| t.is_on_date(date))
            .collect();
        tasks.sort_by_key(|t| t.order);
        tasks
    }
    
    /// Get mutable references to all tasks for a specific date, sorted by order
    pub fn get_tasks_for_date_mut(&mut self, date: chrono::NaiveDate) -> Vec<&mut Task> {
        let mut task_indices: Vec<_> = self.events.iter()
            .enumerate()
            .filter(|(_, t)| t.is_on_date(date))
            .map(|(i, _)| i)
            .collect();
        
        // Sort by order
        task_indices.sort_by_key(|&i| self.events[i].order);
        
        // Create a sorted vector of mutable references
        // We need to use unsafe here due to borrowing rules
        let tasks_ptr = self.events.as_mut_ptr();
        task_indices.into_iter()
            .map(|i| unsafe { &mut *tasks_ptr.add(i) })
            .collect()
    }
    
    /// Reorder tasks for a specific date to ensure consecutive ordering starting from 0
    pub fn normalize_task_order(&mut self, date: chrono::NaiveDate) {
        let mut tasks: Vec<_> = self.events.iter_mut()
            .filter(|t| t.is_on_date(date))
            .collect();
        
        tasks.sort_by_key(|t| t.order);
        
        for (new_order, task) in tasks.iter_mut().enumerate() {
            task.order = new_order as u32;
        }
    }
    
    /// Get the maximum order for tasks on a specific date
    pub fn max_order_for_date(&self, date: chrono::NaiveDate) -> u32 {
        self.events.iter()
            .filter(|t| t.is_on_date(date))
            .map(|t| t.order)
            .max()
            .unwrap_or(0)
    }
    
    /// Insert a task at a specific order, shifting other tasks down
    pub fn insert_task_at_order(&mut self, mut task: Task, target_order: u32) {
        let date = task.start.date_naive();
        
        // Shift existing tasks at and after target_order down by 1
        for existing_task in self.events.iter_mut() {
            if existing_task.is_on_date(date) && existing_task.order >= target_order {
                existing_task.order += 1;
            }
        }
        
        task.order = target_order;
        self.events.push(task);
    }
    
    /// Remove a task and close the gap in ordering
    pub fn remove_task_and_reorder(&mut self, task_id: &str) -> Option<Task> {
        if let Some(pos) = self.events.iter().position(|t| t.id == task_id) {
            let removed_task = self.events.remove(pos);
            let date = removed_task.start.date_naive();
            
            // Shift tasks after the removed task up by 1
            for task in self.events.iter_mut() {
                if task.is_on_date(date) && task.order > removed_task.order {
                    task.order -= 1;
                }
            }
            
            Some(removed_task)
        } else {
            None
        }
    }
}

impl Default for TaskData {
    fn default() -> Self {
        Self {
            events: vec![],
        }
    }
}
