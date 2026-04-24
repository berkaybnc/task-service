import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  X, 
  MessageSquare, 
  Send, 
  User, 
  Calendar, 
  Flag, 
  Layout, 
  Trash2,
  Clock,
  Paperclip,
  Upload,
  Download,
  File,
  FileText,
  Image,
  AlertCircle,
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:5001/api';

/** Dosya boyutunu okunabilir string'e çevir */
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** MIME tipine göre ikon seç */
const FileIcon = ({ mimetype, size = 16 }) => {
  if (mimetype?.startsWith('image/'))       return <Image  size={size} />;
  if (mimetype === 'application/pdf')       return <FileText size={size} />;
  if (mimetype?.startsWith('text/'))        return <FileText size={size} />;
  return <File size={size} />;
};

const TaskDetailModal = ({ task, onClose, token, t, lang }) => {
  const [tab, setTab] = useState('comments'); // 'comments' | 'attachments'

  // ── Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // ── Attachments state
  const [attachments, setAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ────────────────────────── Comments ──────────────────────────
  const fetchComments = React.useCallback(async () => {
    if (!task) return;
    setIsLoadingComments(true);
    try {
      const res = await axios.get(`${API_URL}/tasks/${task.id || task._id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data);
    } catch (err) {
      console.error('Yorumlar yüklenemedi', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [task, token]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/tasks/${task.id || task._id}/comments`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Yorum eklenemedi', err);
    }
  };

  // ────────────────────────── Attachments ──────────────────────────
  const fetchAttachments = React.useCallback(async () => {
    if (!task) return;
    setIsLoadingAttachments(true);
    try {
      const res = await axios.get(`${API_URL}/tasks/${task.id || task._id}/attachments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttachments(res.data);
    } catch (err) {
      console.error('Ekler yüklenemedi', err);
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [task, token]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(
        `${API_URL}/tasks/${task.id || task._id}/attachments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setAttachments(prev => [res.data, ...prev]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Dosya yüklenemedi';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = (attachment) => {
    const taskId = task.id || task._id;
    const url = `${API_URL}/tasks/${taskId}/attachments/${attachment._id}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    // Bearer token ile indirme: yeni sekmede açmak yerine fetch + blob kullan
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => { a.click(); }); // fallback
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await axios.delete(
        `${API_URL}/tasks/${task.id || task._id}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttachments(prev => prev.filter(a => a._id !== attachmentId));
    } catch (err) {
      console.error('Dosya silinemedi', err);
    }
  };

  // ────────────────────────── Effects ──────────────────────────
  useEffect(() => {
    let mounted = true;
    if (task && mounted) {
      fetchComments();
      fetchAttachments();
    }
    return () => { mounted = false; };
  }, [task, fetchComments, fetchAttachments]);

  if (!task) return null;

  // ────────────────────────── Render ──────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card detail-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="detail-modal-header">
          <div className="header-title-group">
            <Layout size={18} className="text-primary" />
            <h3>{task.title}</h3>
          </div>
          <button className="close-btn-round" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="detail-modal-body">
          {/* Meta grid */}
          <div className="detail-info-grid">
            <div className="info-item">
              <label><Flag size={14} /> {t.priority || 'Öncelik'}</label>
              <div className={`priority-tag ${task.priority}`}>
                {task.priority?.toUpperCase()}
              </div>
            </div>
            <div className="info-item">
              <label><User size={14} /> {t.assignee || 'Sorumlu'}</label>
              <div className="assignee-info">
                <div className="user-avatar-tiny">
                  {task.assigneeId ? task.assigneeId[0].toUpperCase() : '?'}
                </div>
                <span>{task.assigneeId || t.noAssignee}</span>
              </div>
            </div>
            <div className="info-item">
              <label><Calendar size={14} /> {t.dueDate || 'Teslim Tarihi'}</label>
              <div>{task.dueDate ? new Date(task.dueDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US') : '-'}</div>
            </div>
            <div className="info-item">
              <label><Clock size={14} /> {t.status || 'Durum'}</label>
              <div className="status-badge">{task.status?.toUpperCase()}</div>
            </div>
          </div>

          {/* Description */}
          <div className="detail-description">
            <label>{t.description || 'Açıklama'}</label>
            <div className="description-text">
              {task.description || (lang === 'tr' ? 'Açıklama belirtilmemiş.' : 'No description provided.')}
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="detail-tabs">
            <button
              className={`detail-tab-btn${tab === 'comments' ? ' active' : ''}`}
              onClick={() => setTab('comments')}
            >
              <MessageSquare size={14} />
              {lang === 'tr' ? 'Yorumlar' : 'Comments'} ({comments.length})
            </button>
            <button
              className={`detail-tab-btn${tab === 'attachments' ? ' active' : ''}`}
              onClick={() => setTab('attachments')}
            >
              <Paperclip size={14} />
              {lang === 'tr' ? 'Dosyalar' : 'Files'} ({attachments.length})
            </button>
          </div>

          {/* ── Comments panel ── */}
          {tab === 'comments' && (
            <div className="detail-comments-section">
              <div className="comments-list">
                {isLoadingComments ? (
                  <div className="loading-spinner-small">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
                ) : comments.length === 0 ? (
                  <p className="no-comments-text">
                    {lang === 'tr' ? 'Henüz yorum yok. İlk yorumu sen yap!' : 'No comments yet. Be the first to comment!'}
                  </p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={comment._id || index} className="comment-item">
                      <div className="comment-avatar">
                        {comment.authorName ? comment.authorName[0].toUpperCase() : (comment.authorId ? comment.authorId[0].toUpperCase() : 'U')}
                      </div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-author">{comment.authorName || comment.authorId}</span>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="comment-text">{comment.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className="comment-input-group" onSubmit={handleAddComment}>
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Bir yorum yazın...' : 'Write a comment...'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="send-comment-btn" disabled={!newComment.trim()}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* ── Attachments panel ── */}
          {tab === 'attachments' && (
            <div className="detail-attachments-section">
              {/* Upload button */}
              <div className="attachment-upload-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload-input"
                  style={{ display: 'none' }}
                  onChange={handleUpload}
                  accept="image/*,application/pdf,text/*,application/json,application/zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <button
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload size={14} />
                  {isUploading
                    ? (lang === 'tr' ? 'Yükleniyor...' : 'Uploading...')
                    : (lang === 'tr' ? 'Dosya Yükle' : 'Upload File')}
                </button>
                <span className="upload-hint">
                  {lang === 'tr' ? 'Maks 10 MB · PDF, Resim, Metin, Office, ZIP' : 'Max 10 MB · PDF, Image, Text, Office, ZIP'}
                </span>
              </div>

              {/* Error */}
              {uploadError && (
                <div className="attachment-error">
                  <AlertCircle size={14} />
                  {uploadError}
                </div>
              )}

              {/* List */}
              {isLoadingAttachments ? (
                <div className="loading-spinner-small">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
              ) : attachments.length === 0 ? (
                <p className="no-comments-text">
                  {lang === 'tr' ? 'Henüz dosya eklenmemiş.' : 'No files attached yet.'}
                </p>
              ) : (
                <div className="attachments-list">
                  {attachments.map((att) => (
                    <div key={att._id} className="attachment-item">
                      <div className="attachment-icon">
                        <FileIcon mimetype={att.mimetype} size={18} />
                      </div>
                      <div className="attachment-info">
                        <span className="attachment-name" title={att.filename}>{att.filename}</span>
                        <span className="attachment-meta">
                          {formatBytes(att.size)} · {att.uploadedBy} · {new Date(att.createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                        </span>
                      </div>
                      <div className="attachment-actions">
                        <button
                          className="attachment-action-btn download"
                          title={lang === 'tr' ? 'İndir' : 'Download'}
                          onClick={() => handleDownload(att)}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="attachment-action-btn delete"
                          title={lang === 'tr' ? 'Sil' : 'Delete'}
                          onClick={() => handleDeleteAttachment(att._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
