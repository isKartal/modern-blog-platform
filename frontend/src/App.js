import React, { useState, useEffect } from 'react';
import { apiClient } from './api';
import './App.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Login form state
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
    
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async (params = {}) => {
    try {
      setLoading(true);
      const data = await apiClient.getPosts(params);
      setPosts(data.results || data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data.results || data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    fetchPosts(params);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.login(loginData.username, loginData.password);
      setIsLoggedIn(true);
      setShowLogin(false);
      setLoginData({ username: '', password: '' });
      alert('Giriş başarılı!');
    } catch (error) {
      alert('Giriş başarısız: ' + (error.response?.data?.error || 'Bilinmeyen hata'));
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const fetchPopularPosts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPopularPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching popular posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Blog API Test Frontend</h1>
        
        {/* Auth Section */}
        <div className="auth-section">
          {isLoggedIn ? (
            <div>
              <span>✅ Giriş yapıldı</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Çıkış Yap
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(!showLogin)} className="btn btn-primary">
              Giriş Yap
            </button>
          )}
        </div>

        {/* Login Form */}
        {showLogin && (
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
            />
            <button type="submit" className="btn btn-success">Giriş</button>
          </form>
        )}
        
        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Post ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <button onClick={handleSearch} className="btn btn-primary">
            🔍 Ara
          </button>
          
          <button onClick={() => fetchPosts()} className="btn btn-secondary">
            🔄 Tümü
          </button>
          
          <button onClick={fetchPopularPosts} className="btn btn-warning">
            🔥 Popüler
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">Yükleniyor... ⏳</div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                <h3>{post.title}</h3>
                <p className="post-meta">
                  👤 {post.author.username} | 
                  📅 {new Date(post.created_at).toLocaleDateString('tr-TR')} |
                  📁 {post.category?.name || 'Kategori yok'} |
                  💬 {post.comments_count || 0} yorum
                </p>
                <p className="post-content">
                  {post.content.length > 150 
                    ? post.content.substring(0, 150) + '...' 
                    : post.content
                  }
                </p>
                <div className="post-status">
                  Status: <span className={`status ${post.status}`}>{post.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {posts.length === 0 && !loading && (
          <div className="no-posts">
            📭 Henüz post yok. Admin panelinden post ekleyin!
          </div>
        )}
      </main>
    </div>
  );
}

export default App;