'use client';

import { useState, useMemo, useCallback } from 'react';
import './TutorialsFilter.css';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  tags: string[];
  date: string; // ISO string from Astro
}

interface TutorialsFilterProps {
  tutorials: Tutorial[];
}

const ALL_CATEGORIES = ['All', 'Power Electronics', 'Embedded Systems', 'Research Methods', 'Power Systems', 'Control Theory'];

export default function TutorialsFilter({ tutorials }: TutorialsFilterProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAnimating, setIsAnimating] = useState(false);

  const filteredTutorials = useMemo(() => {
    if (activeFilter === 'All') return tutorials;
    return tutorials.filter(t => t.category === activeFilter);
  }, [tutorials, activeFilter]);

  const handleFilterChange = useCallback((category: string) => {
    if (category === activeFilter) return;
    
    setIsAnimating(true);
    
    // Small delay to let exit animation play
    setTimeout(() => {
      setActiveFilter(category);
      // Allow enter animation to play
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 200);
  }, [activeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="tutorials-filter-container">
      <div className="filter-group">
        <span className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filter by:
        </span>
        <div className="filter-tags">
          {ALL_CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`filter-tag ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => handleFilterChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={`tutorials-grid ${isAnimating ? 'shuffling' : ''}`}>
        {filteredTutorials.map((tutorial, index) => (
          <a 
            key={tutorial.id} 
            href={`/tutorials/${tutorial.id}`} 
            className="tutorial-card"
            style={{ 
              animationDelay: `${index * 50}ms`,
              '--card-index': index 
            } as React.CSSProperties}
          >
            <div className="card-header">
              <div className="header-meta">
                <span className={`level-badge ${tutorial.level}`}>{tutorial.level}</span>
                {tutorial.duration && (
                  <span className="duration">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {tutorial.duration}
                  </span>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            
            <h3 className="card-title">{tutorial.title}</h3>
            <p className="card-description">{tutorial.description}</p>
            
            <div className="card-footer">
              <div className="card-tags">
                {tutorial.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <span className="card-date">{formatDate(tutorial.date)}</span>
            </div>
          </a>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>No tutorials in this category</h3>
          <p>Try selecting a different filter.</p>
        </div>
      )}
    </div>
  );
}
