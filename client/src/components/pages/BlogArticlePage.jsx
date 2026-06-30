import { useParams, useNavigate, Link } from 'react-router-dom';
import { IoArrowBack, IoTimeOutline, IoCalendarOutline, IoBookOutline, IoArrowForward } from 'react-icons/io5';
import blogArticles from '../../data/blogArticles';
import '../css/AppleDesign.css';

function BlogArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const article = blogArticles.find((a) => a.slug === slug);
  const articleIndex = blogArticles.findIndex((a) => a.slug === slug);
  const related = blogArticles.filter((a, i) => i !== articleIndex).slice(0, 3);

  if (!article) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <IoBookOutline size={48} color="#86868b" />
        <h2 style={{ color: '#1d1d1f' }}>Article introuvable</h2>
        <button className="btn btn-primary" onClick={() => navigate('/blog')}>Retour au blog</button>
      </div>
    );
  }

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh' }}>

      {/* Hero banner */}
      <div style={{
        background: `linear-gradient(135deg, ${article.color}ee, ${article.color}88)`,
        padding: '60px 20px 80px',
      }}>
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/blog')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '20px',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              padding: '8px 16px', marginBottom: '32px',
            }}
          >
            <IoArrowBack size={14} /> Tous les articles
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.25)', color: '#fff',
              fontSize: '12px', fontWeight: '700', padding: '4px 12px',
              borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {article.category}
            </span>
          </div>

          <h1 style={{
            color: '#fff', fontSize: 'clamp(22px, 4vw, 40px)',
            fontWeight: '700', lineHeight: '1.25', marginBottom: '20px',
            letterSpacing: '-0.5px',
          }}>
            {article.title}
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', lineHeight: '1.6', marginBottom: '28px', maxWidth: '680px' }}>
            {article.description}
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
              <IoCalendarOutline size={14} /> {publishedDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
              <IoTimeOutline size={14} /> {article.readTime} min de lecture
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: 'clamp(28px, 5vw, 60px)',
          marginTop: '-40px',
          boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
          marginBottom: '48px',
        }}>
          {article.sections.map((section, i) => (
            <section key={i} style={{ marginBottom: i < article.sections.length - 1 ? '40px' : '0' }}>
              <h2 style={{
                fontSize: 'clamp(17px, 2.5vw, 22px)',
                fontWeight: '700',
                color: '#1d1d1f',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: `3px solid ${article.color}22`,
                lineHeight: '1.35',
              }}>
                {section.heading}
              </h2>
              {section.paragraphs.map((para, j) => (
                <p key={j} style={{
                  color: '#424245',
                  lineHeight: '1.8',
                  fontSize: '16px',
                  marginBottom: j < section.paragraphs.length - 1 ? '16px' : '0',
                }}>
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* CTA block */}
        <div style={{
          background: `linear-gradient(135deg, ${article.color}ee, ${article.color}99)`,
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '60px',
        }}>
          <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
            Trouvez votre professionnel beauté
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '24px', lineHeight: '1.6' }}>
            Réservez en ligne chez un coiffeur, barbier ou esthéticienne près de chez vous, en quelques clics.
          </p>
          <Link
            to="/recherche"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#fff', color: article.color,
              padding: '14px 28px', borderRadius: '30px',
              fontWeight: '700', fontSize: '15px', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            Rechercher un professionnel <IoArrowForward size={16} />
          </Link>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#1d1d1f' }}>
              À lire aussi
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px',
            }}>
              {related.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => { navigate(`/blog/${rel.slug}`); window.scrollTo(0, 0); }}
                  style={{
                    background: '#fff', borderRadius: '14px',
                    overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    height: '100px',
                    background: `linear-gradient(135deg, ${rel.color}cc, ${rel.color}55)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IoBookOutline size={28} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div style={{ padding: '18px' }}>
                    <span style={{
                      background: `${rel.color}18`, color: rel.color,
                      fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                      borderRadius: '20px', display: 'inline-block', marginBottom: '10px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {rel.category}
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1.4', color: '#1d1d1f', marginBottom: '10px' }}>
                      {rel.title}
                    </h4>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#86868b', fontSize: '12px' }}>
                      <IoTimeOutline size={12} /> {rel.readTime} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogArticlePage;
