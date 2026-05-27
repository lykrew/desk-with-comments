import { useState } from 'react';
import style from './Board.module.css';
import Column from '../Column/Column';
import AddTaskForm from '../AddTaskForm/AddTaskForm';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import TaskCard from '../TaskCard/TaskCard';

const TASK_LIMITS = {
  backlog: 10,
  ready: 10,
  inProgress: 10,
  finished: 10,
};

const COLUMN_NAMES = {
  backlog: 'Backlog',
  ready: 'Ready',
  inProgress: 'In Progress',
  finished: 'Finished',
};

function getTaskCount(taskList, status) {
  return taskList.filter((task) => task.status === status).length;
}

function canAddTask(taskList, targetStatus) {
  const limit = TASK_LIMITS[targetStatus];
  if (limit == null) return true;
  return getTaskCount(taskList, targetStatus) < limit;
}

function canMoveTask(taskList, taskId, targetStatus) {
  const limit = TASK_LIMITS[targetStatus];
  if (limit == null) return true;

  const task = taskList.find((t) => t.id === taskId);
  if (!task || task.status === targetStatus) return true;

  return canAddTask(taskList, targetStatus);
}

export default function Board({ taskList, setTaskList }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [limitText, setLimitText] = useState(null);

  const handleAddTask = (task) => {
    if (!canAddTask(taskList, 'backlog')) {
      showLimitText('backlog');
      return;
    }
    const newTask = {
      ...task,
      id: Date.now().toString(),
      status: 'backlog',
      comments: [],
    };
    setTaskList(prevTasks => [...prevTasks, newTask]);
    console.log('Задача добавлена', newTask);
    setIsPopupOpen(false);
  };

  const showLimitText = (status) => {
    const limit = TASK_LIMITS[status];
    const title = COLUMN_NAMES[status] ?? status;
    setLimitText(`В колонке «${title}» максимум ${limit} задач`);
    setTimeout(() => setLimitText(null), 3500);
  };

  const handleMoveTask = (taskId, newStatus) => {
    if (!canMoveTask(taskList, taskId, newStatus)) {
      showLimitText(newStatus);
      return;
    }
    setTaskList((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
  };

  const handleAddComment = (taskId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setTaskList((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        const comments = task.comments ?? [];
        return {
          ...task,
          comments: [
            ...comments,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              text: trimmed,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const handleEditTask = (taskId, newTitle, newDescription) => {
    setTaskList(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            ...(newTitle !== null && { title: newTitle }),
            ...(newDescription !== null && { description: newDescription })
          };
        }
        return task;
      })
    );
  };
  const [activeTask, setActiveTask] = useState(null);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(taskList.find(task => task.id === active.id));
  };


  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeStatus = active.data.current?.status;
    const overStatus = over.data.current?.status;

    if (activeStatus !== overStatus) {
      if (!canMoveTask(taskList, active.id, overStatus)) {
        showLimitText(overStatus);
        setActiveTask(null);
        return;
      }
      setTaskList((prevTasks) =>
        prevTasks.map((task) =>
          task.id === active.id ? { ...task, status: overStatus } : task
        )
      );
    }
    else if (active.id !== over.id && activeStatus) {
      setTaskList(prevTasks => {
        const tasksInColumn = prevTasks.filter(t => t.status === activeStatus);
        const otherTasks = prevTasks.filter(t => t.status !== activeStatus);
        
        const oldIndex = tasksInColumn.findIndex(t => t.id === active.id);
        const newIndex = tasksInColumn.findIndex(t => t.id === over.id);
        
        const reordered = arrayMove(tasksInColumn, oldIndex, newIndex);
        
        return [...otherTasks, ...reordered];
      });
    }

    setActiveTask(null)
  };

  
   // фильтрация для поля поиска
  const filteredTasks = taskList.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleClearStorage = () => {
    if (window.confirm('Вы уверены что хотите удалить все задачи?')) {
      setTaskList([])
      localStorage.removeItem('kanban-tasks')
    }
  }


 
  

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <DragOverlay>
        {activeTask ? (
      <TaskCard
        task={activeTask}
        columnStatus={activeTask.status}
        onMoveTask={() => {}}
        onEditTask={() => {}}
        index={0}
        isOverlay={true} // Флаг для overlay-стилей
      />
    ) : null}
  </DragOverlay>
      {isPopupOpen && (
        <div className={style.modalOverlay} onClick={() => setIsPopupOpen(false)}>
          <div className={style.modalWindow} onClick={(e) => e.stopPropagation()}>
            <button className={style.modalClose} onClick={() => setIsPopupOpen(false)}>×</button>
            <AddTaskForm onAddTask={handleAddTask} />
          </div>
        </div>
      )}

      {limitText && <p className={style.limitWarning}>{limitText}</p>}

      <div className={style.boardHeader}>
         <input
          type="text"
          className={style.searchInput}
          placeholder="Поиск задач..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />


        <div className={style.headerButtons}>
          <button
            className={style.addButton}
            onClick={() => setIsPopupOpen(true)}
            disabled={!canAddTask(taskList, 'backlog')}
            title={
              canAddTask(taskList, 'backlog')
                ? undefined
                : `В Backlog максимум ${TASK_LIMITS.backlog} задач`
            }
          >
            Добавить задачу
          </button>
          <button className={style.clearButton} onClick={handleClearStorage}>Очистить задачи</button>
        </div>
      </div>

      <div className={style.board}>
        <SortableContext key='backlog' items={getTasksByStatus('backlog').map(t => t.id.toString())}>
          <Column
            columnTitle="Backlog"
            tasks={getTasksByStatus('backlog')}
            taskCount={getTaskCount(taskList, 'backlog')}
            taskLimit={TASK_LIMITS.backlog}
            onMoveTask={handleMoveTask}
            onEditTask={handleEditTask}
            onAddComment={handleAddComment}
            status="backlog"
          />
        </SortableContext>

        <SortableContext key='ready' items={getTasksByStatus('ready').map(t => t.id)}>
          <Column
            columnTitle="Ready"
            tasks={getTasksByStatus('ready')}
            taskCount={getTaskCount(taskList, 'ready')}
            taskLimit={TASK_LIMITS.ready}
            onMoveTask={handleMoveTask}
            onEditTask={handleEditTask}
            onAddComment={handleAddComment}
            status="ready"
          />
        </SortableContext>

        <SortableContext key='inProgress' items={getTasksByStatus('inProgress').map(t => t.id)}>
          <Column
            columnTitle="In Progress"
            tasks={getTasksByStatus('inProgress')}
            taskCount={getTaskCount(taskList, 'inProgress')}
            taskLimit={TASK_LIMITS.inProgress}
            onMoveTask={handleMoveTask}
            onEditTask={handleEditTask}
            onAddComment={handleAddComment}
            status="inProgress"
          />
        </SortableContext>

        <SortableContext key='finished'items={getTasksByStatus('finished').map(t => t.id)}>
          <Column
            columnTitle="Finished"
            tasks={getTasksByStatus('finished')}
            taskCount={getTaskCount(taskList, 'finished')}
            taskLimit={TASK_LIMITS.finished}
            onMoveTask={handleMoveTask}
            onEditTask={handleEditTask}
            onAddComment={handleAddComment}
            status="finished"
          />
        </SortableContext>
      </div>
    </DndContext>
  );
}