import type { ContentItem, HeroSectionConfig } from '../utils/markdown.js';
import type { AppConfig } from '../config.js';

interface HeroSliderProps {
    posts: ContentItem[];
    siteTitle: string;
    config: AppConfig;
}

/**
 * Hero slider component for displaying multiple featured posts.
 * Auto-rotates every 5 seconds with dot navigation and pause on hover.
 * First slide uses <img> for better LCP performance.
 */
export function HeroSlider({ posts, siteTitle, config }: HeroSliderProps) {
    const sliderId = `hero-slider-${Date.now()}`;

    return (
        <section class="hero hero-slider" id={sliderId}>
            <div class="hero-slides-container">
                <div class="hero-slides">
                    {posts.map((post, index) => {
                        const heroConfig = post.metadata.heroSection as HeroSectionConfig | undefined;
                        const heroTitle = heroConfig?.title || config.heroTitle;
                        const heroSubtitle = heroConfig?.subtitle || config.heroSubtitle;
                        const desktopImage = post.metadata.image;
                        const mobileImage = post.metadata.imageMobile;
                        const imageAlt = post.metadata.imageAlt || `Cover for ${post.metadata.title}`;

                        // First slide uses <img> for LCP optimization
                        // Other slides use background-image (lazy loaded by browser)
                        const isFirstSlide = index === 0;
                        const useImgTag = isFirstSlide && desktopImage;
                        const backgroundStyle = !useImgTag && desktopImage
                            ? `background-image: url('${desktopImage}');`
                            : '';

                        return (
                            <div
                                class={`hero-slide ${isFirstSlide ? 'active' : ''} ${desktopImage ? 'has-image' : ''}`}
                                data-index={index}
                                style={backgroundStyle}
                            >
                                {/* First slide: use <img> for LCP optimization */}
                                {useImgTag && (
                                    <img
                                        src={desktopImage}
                                        srcset={mobileImage ? `${mobileImage} 600w, ${desktopImage} 1200w` : undefined}
                                        sizes="100vw"
                                        alt={imageAlt}
                                        class="hero-slide-image"
                                        fetchpriority="high"
                                        decoding="async"
                                    />
                                )}
                                <div class="hero-slide-content">
                                    <h1 class="hero-title">
                                        {heroTitle} <span class="gradient-text">{siteTitle}</span>
                                    </h1>
                                    <p class="hero-subtitle">{heroSubtitle}</p>
                                    <a href={`/${post.section}/${post.slug}`} class="hero-cta">
                                        Read Featured Post →
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div class="hero-dots">
                {posts.map((_, index) => (
                    <button 
                        class={`hero-dot ${index === 0 ? 'active' : ''}`} 
                        data-index={index}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
            
            <script dangerouslySetInnerHTML={{ __html: `
                (function() {
                    const slider = document.getElementById('${sliderId}');
                    if (!slider) return;
                    
                    const slides = slider.querySelectorAll('.hero-slide');
                    const dots = slider.querySelectorAll('.hero-dot');
                    const totalSlides = slides.length;
                    let currentIndex = 0;
                    let intervalId = null;
                    const INTERVAL_MS = 5000;
                    
                    function goToSlide(index) {
                        // Remove active class from current slide and dot
                        slides[currentIndex].classList.remove('active');
                        dots[currentIndex].classList.remove('active');
                        
                        // Update index
                        currentIndex = index;
                        if (currentIndex >= totalSlides) currentIndex = 0;
                        if (currentIndex < 0) currentIndex = totalSlides - 1;
                        
                        // Add active class to new slide and dot
                        slides[currentIndex].classList.add('active');
                        dots[currentIndex].classList.add('active');
                    }
                    
                    function nextSlide() {
                        goToSlide(currentIndex + 1);
                    }
                    
                    function startAutoRotate() {
                        if (intervalId) return;
                        intervalId = setInterval(nextSlide, INTERVAL_MS);
                    }
                    
                    function stopAutoRotate() {
                        if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                        }
                    }
                    
                    // Dot click handlers
                    dots.forEach(function(dot, index) {
                        dot.addEventListener('click', function() {
                            goToSlide(index);
                            // Reset auto-rotate timer on manual navigation
                            stopAutoRotate();
                            startAutoRotate();
                        });
                    });
                    
                    // Pause on hover
                    slider.addEventListener('mouseenter', stopAutoRotate);
                    slider.addEventListener('mouseleave', startAutoRotate);
                    
                    // Start auto-rotation
                    startAutoRotate();
                })();
            ` }} />
        </section>
    );
}
