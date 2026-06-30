import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoBookOutline, IoTimeOutline, IoArrowForward, IoSearch } from 'react-icons/io5';
import blogArticles from '../../data/blogArticles';
import '../css/AppleDesign.css';

const CATEGORIES = ['Tous', ...Array.from(new Set(blogArticles.map((a) => a.category)))];

function BlogListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return blogArticles.filter((a) => {
      const matchesCategory = activeCategory === 'Tous' || a.category === activeCategory;
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const featured = blogArticles[0];

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '80px 20px 60px',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '6px 16px', marginBottom: '24px',
          }}>
            <IoBookOutline color="rgba(255,255,255,0.8)" size={14} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Guides & Conseils
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '700', letterSpacing: '-1px', marginBottom: '16px' }}>
            Le blog beauté OpenGlow
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: '1.6', marginBottom: '36px' }}>
            Conseils, tendances et guides pratiques pour prendre soin de vous et choisir les meilleurs professionnels.
          </p>
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <IoSearch style={{ position: 'absolute', top: '50%', left: '18px', transform: 'translateY(-50%)', color: '#999', fontSize: '18px' }} />
            <input
              type="text"
              placeholder="Rechercher un article…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '15px 18px 15px 50px',
                borderRadius: '30px', border: 'none',
                fontSize: '15px', outline: 'none',
                background: 'rgba(255,255,255,0.97)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>

        {/* Featured article */}
        {!query && activeCategory === 'Tous' && (
          <div
            onClick={() => navigate(`/blog/${featured.slug}`)}
            style={{
              background: '#fff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              marginTop: '40px',
              marginBottom: '40px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{
              minHeight: '220px',
              background: `linear-gradient(135deg, ${featured.color}dd, ${featured.color}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IoBookOutline size={64} color="rgba(255,255,255,0.5)" />
            </div>
            <div style={{ padding: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{
                  background: `${featured.color}18`, color: featured.color,
                  fontSize: '12px', fontWeight: '700', padding: '4px 12px',
                  borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  À la une
                </span>
                <span style={{ background: '#F5F5F7', color: '#86868b', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
                  {featured.category}
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: '700', marginBottom: '12px', lineHeight: '1.3', color: '#1d1d1f' }}>
                {featured.title}
              </h2>
              <p style={{ color: '#86868b', lineHeight: '1.6', marginBottom: '24px', fontSize: '15px' }}>
                {featured.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#86868b', fontSize: '13px' }}>
                  <IoTimeOutline size={14} /> {featured.readTime} min de lecture
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: featured.color, fontWeight: '600', fontSize: '14px' }}>
                  Lire l'article <IoArrowForward size={14} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px', marginTop: query || activeCategory !== 'Tous' ? '40px' : '0' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 18px', borderRadius: '20px', border: 'none',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                background: activeCategory === cat ? '#1d1d1f' : '#fff',
                color: activeCategory === cat ? '#fff' : '#424245',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#86868b' }}>
            <IoBookOutline size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
            <p style={{ fontSize: '16px' }}>Aucun article trouvé pour cette recherche.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}>
            {filtered.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                onClick={() => navigate(`/blog/${article.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.13)' : '0 2px 12px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        height: '140px',
        background: `linear-gradient(135deg, ${article.color}cc, ${article.color}55)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IoBookOutline size={40} color="rgba(255,255,255,0.5)" />
      </div>
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            background: `${article.color}18`, color: article.color,
            fontSize: '11px', fontWeight: '700', padding: '3px 10px',
            borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {article.category}
          </span>
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px', lineHeight: '1.4', color: '#1d1d1f', flex: 1 }}>
          {article.title}
        </h3>
        <p style={{ color: '#86868b', fontSize: '13px', lineHeight: '1.5', marginBottom: '18px' }}>
          {article.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F5F5F7', paddingTop: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#86868b', fontSize: '12px' }}>
            <IoTimeOutline size={13} /> {article.readTime} min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: article.color, fontWeight: '600', fontSize: '13px' }}>
            Lire <IoArrowForward size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default BlogListPage;
