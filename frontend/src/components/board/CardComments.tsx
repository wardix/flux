import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Comment {
  id: number
  card_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  user_email: string
  user_avatar?: string | null
}

interface UserProfile {
  id: number
  email: string
}

interface CardCommentsProps {
  cardId: number
  onCommentsChange?: () => void
  disabled?: boolean
}

export function CardComments({ cardId, onCommentsChange, disabled = false }: CardCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<{ data: UserProfile }>('/auth/me')
      setCurrentUser(res.data)
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await api.get<Comment[]>(`/cards/${cardId}/comments`)
      setComments(res)
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchComments & fetchCurrentUser are not memoized
  useEffect(() => {
    fetchCurrentUser()
    fetchComments()
  }, [cardId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await api.post(`/cards/${cardId}/comments`, { content: newComment.trim() })
      setNewComment('')
      await fetchComments()
      if (onCommentsChange) onCommentsChange()
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleUpdate = async (commentId: number) => {
    if (!editingContent.trim()) return

    try {
      await api.put(`/cards/${cardId}/comments/${commentId}`, { content: editingContent.trim() })
      setEditingCommentId(null)
      await fetchComments()
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await api.delete(`/cards/${cardId}/comments/${commentId}`)
      await fetchComments()
      if (onCommentsChange) onCommentsChange()
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      {!disabled && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis komentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="input input-bordered input-sm flex-1 focus:outline-none focus:input-primary"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Kirim
          </button>
        </form>
      )}

      {/* List comments */}
      {comments.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isOwner = currentUser?.id === comment.user_id
            return (
              <div
                key={comment.id}
                className="flex items-start gap-2.5 bg-base-50 p-2.5 rounded-xl border border-base-200/50 hover:bg-base-100 transition-colors"
              >
                {/* User Avatar */}
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8 h-8 font-semibold text-xs flex items-center justify-center shadow-inner">
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt="avatar" />
                    ) : (
                      <span>{getInitials(comment.user_email)}</span>
                    )}
                  </div>
                </div>

                {/* Comment content / form */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-base-content/85 truncate">
                      {comment.user_email}
                    </span>
                    <span className="text-[10px] text-base-content/40 font-medium">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>

                  {editingCommentId === comment.id && !disabled ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="input input-bordered input-xs flex-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdate(comment.id)}
                        className="btn btn-xs btn-primary"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="btn btn-xs btn-ghost"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/75 leading-relaxed break-words">
                      {comment.content}
                    </p>
                  )}

                  {/* Actions (Edit / Delete) for owner */}
                  {isOwner && editingCommentId !== comment.id && !disabled && (
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(comment.id)
                          setEditingContent(comment.content)
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-[10px] text-error hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-xs text-base-content/40 py-2">Belum ada komentar.</div>
      )}
    </div>
  )
}
