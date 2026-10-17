import React, { useState } from 'react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToSignup }) => {
  const handleJoinClick = onNavigateToSignup || onNavigateToLogin;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hiring' | 'work'>('hiring');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateToLogin();
  };

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1B2A36', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      
      {/* 1. Header Navbar */}
      <header
        className="landing-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 64px',
          borderBottom: '1px solid #F0F4F7',
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#B45F00' }} />
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#B45F00', letterSpacing: '-0.5px' }}>
            GigsForGigs
          </span>
        </div>

        <nav className="landing-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#how-it-works" style={{ textDecoration: 'none', color: '#0D568D', fontWeight: 600, fontSize: '15px' }}>Find Work</a>
          <a href="#popular-services" style={{ textDecoration: 'none', color: '#0D568D', fontWeight: 600, fontSize: '15px' }}>Find Gigs</a>
          <a href="#how-it-works" style={{ textDecoration: 'none', color: '#0D568D', fontWeight: 600, fontSize: '15px' }}>How it Works</a>
          <a href="#about" style={{ textDecoration: 'none', color: '#0D568D', fontWeight: 600, fontSize: '15px' }}>About Us</a>
        </nav>

        <div className="landing-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onNavigateToLogin}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid #0D568D',
              backgroundColor: '#FFFFFF',
              color: '#0D568D',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Login
          </button>
          <button
            onClick={handleJoinClick}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#B45F00',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Join
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero" style={{ textAlign: 'center', padding: '96px 24px 80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#0D568D', lineHeight: 1.15, margin: '0 0 24px 0', letterSpacing: '-1px' }}>
          Find Great Work. Hire Great Talent.
        </h1>
        <p style={{ fontSize: '18px', color: '#5E6E7A', lineHeight: 1.6, margin: '0 auto 40px auto', maxWidth: '640px' }}>
          Whether you are a client building a team or a professional growing your career, GigsForGigs helps both sides connect, collaborate, and succeed.
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', maxWidth: '600px', margin: '0 auto', border: '1px solid #E2E8F0', borderRadius: '50px', padding: '6px 8px 6px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' }}>
          <span style={{ fontSize: '18px', color: '#6B7885', marginRight: '12px' }}>🔍</span>
          <input maxLength={100}
            type="text"
            placeholder="Try UI/UX, Web Dev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', color: '#2D3748' }}
          />
          <button
            type="submit"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: '#5E6E7A',
              fontSize: '15px',
              fontWeight: 600,
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        {/* Popular Tags */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '28px', fontSize: '14px', color: '#6B7885' }}>
          <span>Popular:</span>
          {['Web', 'UI', 'Design', 'Marketing'].map((tag) => (
            <span key={tag} style={{ color: '#5E6E7A', fontWeight: 500, cursor: 'pointer' }} onClick={onNavigateToLogin}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 3. Trusted By Top Companies Section */}
      <section style={{ padding: '48px 24px', textAlign: 'center', borderTop: '1px solid #F7FAFC' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#6B7885', marginBottom: '32px' }}>
          TRUSTED BY TOP COMPANIES
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '64px', flexWrap: 'wrap' }}>
          {['Google', 'Amazon', 'Microsoft', 'TCS'].map((company) => (
            <span key={company} style={{ fontSize: '26px', fontWeight: 700, color: '#828C96', letterSpacing: '-0.5px' }}>
              {company}
            </span>
          ))}
        </div>
      </section>

      {/* 4. Popular Professional Services */}
      <section id="popular-services" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className="landing-h2" style={{ fontSize: '36px', fontWeight: 800, color: '#0D568D', marginBottom: '48px' }}>
          Popular Professional Services
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '24px' }}>
          {[
            { title: 'Logo Design', icon: 'A', iconBg: '#FFF7ED', iconColor: '#B45F00', border: '1px solid #FDE68A' },
            { title: 'Web Development', icon: '</>', iconBg: '#FFF7ED', iconColor: '#B45F00', border: '1px solid #FDE68A' },
            { title: 'Voice Over', icon: '🎙️', iconBg: '#F3F4F6', iconColor: '#4B5563', border: '1px solid #E5E7EB' },
            { title: 'Video Editing', icon: '▶️', iconBg: '#EFF6FF', iconColor: '#3B82F6', border: '1px solid #BFDBFE' }
          ].map((service) => (
            <div
              key={service.title}
              onClick={onNavigateToLogin}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '40px 24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: service.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: service.iconColor
                }}
              >
                {service.icon}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0D568D', margin: 0 }}>
                {service.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className="landing-h2" style={{ fontSize: '36px', fontWeight: 800, color: '#0D568D', marginBottom: '32px' }}>
          How It Works
        </h2>

        {/* Tab Selection */}
        <div className="landing-wrap-row" style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '48px', fontSize: '15px' }}>
          <button
            onClick={() => setActiveTab('hiring')}
            style={{
              background: 'none',
              border: 'none',
              fontWeight: 700,
              color: activeTab === 'hiring' ? '#475764' : '#6B7885',
              cursor: 'pointer',
              paddingBottom: '4px',
              borderBottom: activeTab === 'hiring' ? '2px solid #475764' : 'none'
            }}
          >
            For Hiring
          </button>
          <button
            onClick={() => setActiveTab('work')}
            style={{
              background: 'none',
              border: 'none',
              fontWeight: 700,
              color: activeTab === 'work' ? '#475764' : '#6B7885',
              cursor: 'pointer',
              paddingBottom: '4px',
              borderBottom: activeTab === 'work' ? '2px solid #475764' : 'none'
            }}
          >
            For Finding Work
          </button>
        </div>

        {/* Steps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }}>
          {[
            { num: 1, title: 'Create Account', desc: 'Sign up for a free account to get started.' },
            { num: 2, title: 'Post Task', desc: 'Describe what you need done in detail.' },
            { num: 3, title: 'Receive Proposals', desc: 'Get bids from qualified professionals.' },
            { num: 4, title: 'Hire Talent', desc: 'Select the best fit for your project.' },
            { num: 5, title: 'Complete Work', desc: 'Pay only when you are 100% satisfied.' }
          ].map((step) => (
            <div key={step.num} className="landing-step" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '2px solid #C87D20',
                  color: '#0D568D',
                  fontWeight: 800,
                  fontSize: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {step.num}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1B2A36', margin: 0, minWidth: '160px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#5E6E7A', margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Built for Professional Work Section */}
      <section style={{ padding: '80px 24px', maxWidth: '840px', margin: '0 auto' }}>
        <h2 className="landing-h2" style={{ fontSize: '36px', fontWeight: 800, color: '#0D568D', textAlign: 'center', marginBottom: '48px' }}>
          Built for Professional Work
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            {
              icon: '📋',
              title: 'Proposal System',
              desc: 'Sophisticated bidding system that helps you compare offers and portfolios effortlessly. Find the perfect match for your needs.'
            },
            {
              icon: '💻',
              title: 'Manage Multiple Gigs',
              desc: 'A centralized dashboard to track all your ongoing projects, milestones, and deadlines across your team.'
            },
            {
              icon: '📝',
              title: 'Task Posting',
              desc: 'Detailed task description forms let you specify exactly what you want from the pros, avoiding misunderstandings.'
            },
            {
              icon: '⭐',
              title: 'Ratings & Feedback',
              desc: 'Build trust within the community with our transparent rating and performance system for both clients and freelancers.'
            }
          ].map((item) => (
            <div
              key={item.title}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px 28px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px'
              }}
            >
              <span style={{ fontSize: '28px', marginTop: '2px' }}>{item.icon}</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0D568D', margin: '0 0 6px 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#5E6E7A', margin: 0, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Success Stories Section */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className="landing-h2" style={{ fontSize: '36px', fontWeight: 800, color: '#0D568D', marginBottom: '48px' }}>
          Success Stories
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '24px' }}>
          {[
            {
              quote: '"GigsForGigs helped me land an incredible developer for my startup. The process was smooth and the quality of work exceeded expectations."',
              name: 'Aditya Deshmukh',
              role: 'Founder, TechStart'
            },
            {
              quote: '"As a freelancer, this platform provides a consistent stream of high-quality clients. I love the simple milestone tracking."',
              name: 'Arham Kansal',
              role: 'Senior UI Designer'
            },
            {
              quote: '"The built-in communication tools make managing distributed teams easier than ever. Highly recommended for remote agencies."',
              name: 'Chaitanya Anand',
              role: 'Project Manager'
            }
          ].map((story) => (
            <div
              key={story.name}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '36px 28px',
                border: '1px solid #F0F4F8',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ color: '#B45F00', fontSize: '18px', marginBottom: '16px' }}>★★★★★</div>
                <p style={{ fontSize: '15px', color: '#4A5568', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                  {story.quote}
                </p>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0D568D' }}>{story.name}</div>
                <div style={{ fontSize: '13px', color: '#6B7885', marginTop: '2px' }}>{story.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section style={{ padding: '80px 24px 60px 24px', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
        <h2 className="landing-h2" style={{ fontSize: '40px', fontWeight: 800, color: '#5E6E7A', margin: '0 0 16px 0' }}>
          Start Collaborating Today
        </h2>
        <p style={{ fontSize: '16px', color: '#5E6E7A', marginBottom: '32px' }}>
          Join thousands of businesses and professionals doing their best work on GigsForGigs.
        </p>

        <div className="landing-wrap-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={onNavigateToLogin}
            style={{
              border: 'none',
              background: 'none',
              color: '#5E6E7A',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Hire Professionals
          </button>
          <button
            onClick={onNavigateToLogin}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: '2px solid #B45F00',
              backgroundColor: '#FFFFFF',
              color: '#B45F00',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Join as Professional
          </button>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="landing-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '64px 64px 32px 64px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '48px', maxWidth: '1200px', margin: '0 auto 64px auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#828C96' }}>GigsForGigs</span>
            </div>
            <p style={{ fontSize: '14px', color: '#475764', lineHeight: 1.5, maxWidth: '280px', margin: 0 }}>
              The world's premium marketplace connecting businesses with top freelance professionals.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475764', marginBottom: '16px' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#5E6E7A' }}>
              <span style={{ cursor: 'pointer' }} onClick={onNavigateToLogin}>Explore Gigs</span>
              <span style={{ cursor: 'pointer' }} onClick={onNavigateToLogin}>Find Work</span>
              <span style={{ cursor: 'pointer' }} onClick={onNavigateToLogin}>How it Works</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475764', marginBottom: '16px' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#5E6E7A' }}>
              <span style={{ cursor: 'pointer' }}>About Us</span>
              <span style={{ cursor: 'pointer' }}>Careers</span>
              <span style={{ cursor: 'pointer' }}>Press</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475764', marginBottom: '16px' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#5E6E7A' }}>
              <span style={{ cursor: 'pointer' }}>Terms of Service</span>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }}>Cookie Policy</span>
            </div>
          </div>
        </div>

        <div className="landing-wrap-row" style={{ borderTop: '1px solid #F0F4F8', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6B7885', maxWidth: '1200px', margin: '0 auto' }}>
          <div>© 2024 GigsForGigs. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <span>in</span>
            <span>tw</span>
            <span>fb</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
