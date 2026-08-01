import type { ContentItem } from '../utils/markdown.js';

interface PostCardProps {
    item: ContentItem;
}

/**
 * Generate a consistent gradient based on section and slug for fallback images.
 */
function getGradientColors(section: string, slug: string): { from: string; to: string } {
    // Use section to determine gradient direction/style
    const gradients: Record<string, { from: string; to: string }> = {
        'posts': { from: '#7c3aed', to: '#00d4ff' },
        'technical-sessions': { from: '#00d4ff', to: '#06b6d4' },
        'stories': { from: '#c98f38', to: '#e6ac52' },
    };
    
    return gradients[section] || { from: '#7c3aed', to: '#00d4ff' };
}

/**
 * Post card component for displaying content items in a grid.
 * Shows image thumbnail or gradient fallback, title, description, date, and section badge.
 */
export function PostCard({ item }: PostCardProps) {
    const { slug, section, metadata } = item;
    const { title, description, date, image, tags } = metadata;
    const href = `/${section}/${slug}`;
    
    const gradientColors = getGradientColors(section, slug);
    const hasImage = !!image;
    
    // Format section name for display
    const sectionLabel = section
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return (
        <article class="post-card-item">
            <a href={href} class="post-card-link">
                <div class="post-card-image-wrapper">
                    {hasImage ? (
                        <img 
                            src={image} 
                            alt={title} 
                            class="post-card-image"
                            loading="lazy"
                        />
                    ) : (
                        <div 
                            class="post-card-fallback"
                            style={`background: linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%);`}
                        >
                            <span class="post-card-fallback-icon">
                                {section === 'technical-sessions' ? (
                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.3">
                                        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.3">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                    </svg>
                                )}
                            </span>
                        </div>
                    )}
                </div>
                
                <div class="post-card-content">
                    <div class="post-card-meta">
                        <span class={`post-card-section section-${section}`}>{sectionLabel}</span>
                        {date && (
                            <span class="post-card-date">
                                {new Date(date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        )}
                    </div>
                    
                    <h3 class="post-card-title">{title}</h3>
                    
                    {description && (
                        <p class="post-card-description">{description}</p>
                    )}
                    
                    {tags && tags.length > 0 && (
                        <div class="post-card-tags">
                            {tags.slice(0, 3).map(tag => (
                                <span class="post-card-tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </a>
        </article>
    );
}
