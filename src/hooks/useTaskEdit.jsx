import { useState, useRef, useEffect } from 'react';

export function useTaskEdit(task, onEditTask) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title); 
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editDescription, setEditDescription] = useState(task.description);
    const titleInputRef = useRef(null);
    const descInputRef = useRef(null);

    // Эдит заголовка и инпуты при клике
    const handleStartEdit = (e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditTitle(task.title);
    };

    const handleSaveEdit = () => {
        const trimmedTitle = editTitle.trim();
        if (trimmedTitle && trimmedTitle !== task.title) {
        onEditTask(task.id, trimmedTitle);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
        } else if (e.key === 'Escape') {
        setEditTitle(task.title);
        setIsEditing(false);
        }
    };

    useEffect(() => {
    if (isEditing && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
    }
    }, [isEditing]);

    // Эдит описания и инпуты при клике
    const handleStartEditDesc = (e) => {
        e.stopPropagation();
        setIsEditingDesc(true);
        setEditDescription(task.description);
    };

    const handleSaveEditDesc = () => {
        const trimmedDesc = editDescription.trim()
        if (trimmedDesc !== task.description) {
        onEditTask(task.id, null, trimmedDesc)
        }

        setIsEditingDesc(false)
    }

    const handleKeyDownDesc = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSaveEditDesc()
        } else if (e.key === 'Escape') {
        setEditDescription(task.description)
        setIsEditingDesc(false)
        }
    }

    useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
        descInputRef.current.focus();
        descInputRef.current.select();
    }
    }, [isEditingDesc]);

    return {
    isEditing,
    setIsEditing,
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
  };
}