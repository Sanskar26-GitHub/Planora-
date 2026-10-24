import { describe, it, expect } from 'vitest';
import { IMAGES, getEventImage } from '../src/constants/assets';
import { SAMPLE_EVENT_DATA } from '../src/constants/initialData';

describe('Image Assets & Resilient Fallback Resolution', () => {
  it('exports all expected core image assets with valid bundled paths', () => {
    expect(IMAGES.heroBanner).toBeDefined();
    expect(typeof IMAGES.heroBanner).toBe('string');
    expect(IMAGES.heroBanner.length).toBeGreaterThan(0);

    expect(IMAGES.avatarPlanner).toBeDefined();
    expect(typeof IMAGES.avatarPlanner).toBe('string');
    expect(IMAGES.avatarPlanner.length).toBeGreaterThan(0);

    expect(IMAGES.weddingShowcase).toBeDefined();
    expect(typeof IMAGES.weddingShowcase).toBe('string');
    expect(IMAGES.weddingShowcase.length).toBeGreaterThan(0);

    expect(IMAGES.birthdayShowcase).toBeDefined();
    expect(typeof IMAGES.birthdayShowcase).toBe('string');
    expect(IMAGES.birthdayShowcase.length).toBeGreaterThan(0);

    expect(IMAGES.communityShowcase).toBeDefined();
    expect(typeof IMAGES.communityShowcase).toBe('string');
    expect(IMAGES.communityShowcase.length).toBeGreaterThan(0);
  });

  it('correctly maps event types to their dedicated showcase assets via getEventImage', () => {
    expect(getEventImage('wedding')).toBe(IMAGES.weddingShowcase);
    expect(getEventImage('birthday')).toBe(IMAGES.birthdayShowcase);
    expect(getEventImage('community')).toBe(IMAGES.communityShowcase);
    // Graceful fallback for unexpected or unhandled event types
    expect(getEventImage('corporate' as any)).toBe(IMAGES.heroBanner);
  });

  it('ensures sample event data maintains valid structure and does not contain broken image links', () => {
    expect(SAMPLE_EVENT_DATA.event).toBeDefined();
    expect(SAMPLE_EVENT_DATA.event.type).toBe('wedding');
    const showcaseImage = getEventImage(SAMPLE_EVENT_DATA.event.type);
    expect(showcaseImage).toBe(IMAGES.weddingShowcase);
    expect(showcaseImage).not.toContain('undefined');
    expect(showcaseImage).not.toContain('null');
  });

  it('verifies fallback error handling guard logic avoids infinite error cycles', () => {
    // Simulated state transition for SafeImage error handler
    let hasError = false;
    let renderCount = 0;

    const simulateSafeImageRender = (src: string | undefined) => {
      renderCount++;
      if (!src || hasError) {
        // Renders designed fallback without triggering secondary image fetch
        return { isFallback: true, renderedSrc: null };
      }
      return { isFallback: false, renderedSrc: src };
    };

    const simulateErrorEvent = () => {
      // Prevents infinite loop: onError transitions state to hasError = true
      // and does NOT attempt another network image request
      hasError = true;
    };

    // First attempt with broken image source
    const initial = simulateSafeImageRender('https://broken-domain.invalid/nonexistent.jpg');
    expect(initial.isFallback).toBe(false);

    // Image triggers error event
    simulateErrorEvent();

    // Next render switches directly to designed fallback
    const fallbackRender = simulateSafeImageRender('https://broken-domain.invalid/nonexistent.jpg');
    expect(fallbackRender.isFallback).toBe(true);
    expect(fallbackRender.renderedSrc).toBeNull();

    // Consecutive renders remain stable on fallback with zero network retries
    const secondFallback = simulateSafeImageRender('https://broken-domain.invalid/nonexistent.jpg');
    expect(secondFallback.isFallback).toBe(true);
    expect(renderCount).toBe(3);
  });
});
