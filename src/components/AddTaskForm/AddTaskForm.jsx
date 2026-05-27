import { useState } from 'react'
import styles from './AddTaskForm.module.css'

export default function AddTaskForm({ onAddTask }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3) {
      setError('Название должно быть не короче 3 символов')
      return
    }

    if (typeof onAddTask === 'function') {
      onAddTask({
        id: Date.now().toString(),
        title: trimmedTitle,
        description: description.trim(),
      })
    }

    setTitle('')
    setDescription('')
    setError('')
  }
  

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>Добавить задачу</h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="taskTitle">
          Название
        </label>
        <input
          id="taskTitle"
          className={styles.input}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Введите название задачи"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="taskDescription">
          Описание
        </label>
        <textarea
          id="taskDescription"
          className={styles.textarea}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Краткое описание задачи"
          rows="3"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.button}>
        Добавить задачу
      </button>
    </form>
  )
}
