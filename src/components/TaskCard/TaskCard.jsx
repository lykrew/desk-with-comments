import { useSortable } from '@dnd-kit/sortable';
import { useEffect, useState, useRef } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useTaskEdit } from '../../hooks/useTaskEdit';
import style from './TaskCard.module.css'


export default function TaskCard({
  task,
  columnStatus,
  onMoveTask,
  index,
  onEditTask,
  onAddComment,
  isOverlay = false,
}) {
  const [justMoved, setJustMoved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const comments = task.comments ?? [];
  const {
    isEditing,
    editTitle,
    setEditTitle,
    isEditingDesc,
    editDescription,
    setEditDescription,
    titleInputRef,
    descInputRef,
    handleStartEdit,
    handleSaveEdit,
    handleKeyDown,
    handleStartEditDesc,
    handleSaveEditDesc,
    handleKeyDownDesc,
  } = useTaskEdit(task, onEditTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      status: columnStatus,
      index: index
    },
    disabled: isEditing || isEditingDesc
  });

  useEffect(() => {
    if (task.status === columnStatus) {
      setJustMoved(true);
      const timer = setTimeout(() => setJustMoved(false), 600);
      return () => clearTimeout(timer);
    }
  }, [task.status, columnStatus]);

  const taskCardStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
    ...(isDragging && { zIndex: 1000 }),
    ...(isOverlay && {
      zIndex: 2000,
      pointerEvents: 'none' // Отключаем события на overlay-карточке
    })
  };


  // для заголовка
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef(null);

  const handleTitlePointerDown = (e) => {
    e.stopPropagation()
  }
  const handleTitlePointerUp = (e) => {
    e.stopPropagation()

    setClickCount(prev => prev + 1)

    if (clickCount === 1) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      handleStartEdit(e)
    } else {
      clickTimer.current = setTimeout(() => {
        setClickCount(0)
      }, 300)
    }
  }


  // для описания
  const [descClickCount, setDescClickCount] = useState(0);
  const descClickTimer = useRef(null);

  const handleDescPointerDown = (e) => {
    e.stopPropagation();
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onAddComment) return;
    onAddComment(task.id, commentText);
    setCommentText('');
  };

  const handleDescPointerUp = (e) => {
    e.stopPropagation();

    setDescClickCount(prev => prev + 1);

    if (descClickCount === 1) {
      clearTimeout(descClickTimer.current);
      descClickTimer.current = null;
      handleStartEditDesc(e);
    } else {
      descClickTimer.current = setTimeout(() => {
        setDescClickCount(0);
      }, 300);
    }
  };

  return (
    <div
      draggable
      ref={setNodeRef}
      style={taskCardStyle}
      className={`${style.taskCard}
        ${isDragging ? style.taskCardDragging : ''}
        ${isOverlay ? style.taskCardOverlay : ''}`}
      data-dragging={isDragging ? "true" : "false"}
      data-just-moved={justMoved ? "true" : "false"}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <input
          ref={titleInputRef}
          className={style.taskTitleInput}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (

        <h3
          className={style.taskTitle}
          onPointerDown={handleTitlePointerDown}
          onPointerUp={handleTitlePointerUp}
          onPointerDown={(e) => e.stopPropagation()}
          title="Нажмите для редактирования"
        >
          <span className={style.editableArea}>
            {task.title}
          </span>
        </h3>
      )}


      {isEditingDesc ? (
        <textarea
          className={style.taskDescriptionInput}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onBlur={handleSaveEditDesc}
          onKeyDown={handleKeyDownDesc}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          rows="2"
          ref={descInputRef}
        />
      ) : (
        <p
          className={style.taskDescription}
          onPointerDown={handleDescPointerDown}
          onPointerUp={handleDescPointerUp}
          onPointerDown={(e) => e.stopPropagation()}
          title='Нажмите для редактирования'
        >
          <span className={style.editableArea}>
            {task.description || "Добавьте описание"}
          </span>
        </p>
      )}

      {!isOverlay && onAddComment && (
        <div
          className={style.commentsSection}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={style.commentsToggle}
            onClick={(e) => {
              e.stopPropagation();
              setShowComments((prev) => !prev);
            }}
          >
            Комментарии ({comments.length})
          </button>

          {showComments && (
            <div className={style.commentsBody}>
              {comments.length === 0 ? (
                <p className={style.commentsEmpty}>Пока нет комментариев</p>
              ) : (
                <ul className={style.commentsList}>
                  {comments.map((comment) => (
                    <li key={comment.id} className={style.commentItem}>
                      {comment.text}
                    </li>
                  ))}
                </ul>
              )}

              <form className={style.commentForm} onSubmit={handleSubmitComment}>
                <input
                  type="text"
                  className={style.commentInput}
                  placeholder="Написать комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={300}
                />
                <button
                  type="submit"
                  className={style.commentSubmit}
                  disabled={!commentText.trim()}
                >
                  Отправить
                </button>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}