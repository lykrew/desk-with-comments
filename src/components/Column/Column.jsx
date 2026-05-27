import { useDroppable } from '@dnd-kit/core';
import style from './column.module.css';
import TaskCard from '../TaskCard/TaskCard';

export default function Column({
  columnTitle,
  tasks,
  status,
  taskCount,
  taskLimit,
  onMoveTask,
  onEditTask,
  onAddComment,
}) {
  const isFull = taskLimit != null && taskCount >= taskLimit;

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
    disabled: isFull,
  });

  const countLabel =
    taskLimit != null ? `${taskCount}/${taskLimit}` : String(taskCount);

  return (
    <div className={style.column}>
      <h2 className={style.columnTitle}>
        {columnTitle}
        <span className={`${style.taskCount} ${isFull ? style.taskCountFull : ''}`}>
          {countLabel}
        </span>
      </h2>

      <div
        className={`${style.taskList} ${isOver ? style.taskListOver : ''} ${isFull ? style.taskListFull : ''}`}
        ref={setNodeRef}
      >
        {tasks.length === 0 ? (
          <p className={style.emptyMessage}>
            {isFull ? `Лимит: ${taskLimit} задач` : isOver ? 'Отпустите задачу здесь' : 'Нет задач'}
          </p>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              columnStatus={status}
              onMoveTask={onMoveTask}
              onEditTask={onEditTask}
              onAddComment={onAddComment}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}

