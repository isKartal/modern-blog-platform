import React, { useState, useEffect } from 'react';
import { apiClient } from './api';

function CreatePost({ onPostCreated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft',
    category_id: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data.results || data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      
      // Preview oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('status', formData.status);
      
      if (formData.category_id) {
        submitData.append('category_id', formData.category_id);
      }
      
      if (image) {
        submitData.append('image', image);
      }

      await apiClient.createPostWithImage(submitData);
      alert('Post başarıyla oluşturuldu!');
      
      // Form'u temizle
      setFormData({ title: '', content: '', status: 'draft', category_id: '' });
      setImage(null);
      setImagePreview(null);
      
      if (onPostCreated) onPostCreated();
    } catch (error) {
      alert('Hata: ' + (error.response?.data?.error || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-modal">
      <div className="modal-content">
        <h2>📝 Yeni Post Oluştur</h2>
        
        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="form-group">
            <label>Başlık:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Post başlığını girin..."
            />
          </div>

          <div className="form-group">
            <label>İçerik:</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows="6"
              placeholder="Post içeriğini yazın..."
            />
          </div>

          <div className="form-group">
            <label>Resim:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kategori:</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
              >
                <option value="">Kategori Seçin</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Durum:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Taslak</option>
                <option value="published">Yayınla</option>
              </select>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" disabled={loading} className="btn btn-success">
              {loading ? '⏳ Oluşturuluyor...' : '✅ Post Oluştur'}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              ❌ İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;