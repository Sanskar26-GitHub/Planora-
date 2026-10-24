import { EventType } from '../types';
import heroBanner from '../assets/images/planora_brand_hero_1792584534400.jpg';
import avatarPlanner from '../assets/images/avatar_planner_1792584534675.jpg';
import weddingShowcase from '../assets/images/event_wedding_showcase_1792584534913.jpg';
import birthdayShowcase from '../assets/images/event_birthday_showcase_1792584536214.jpg';
import communityShowcase from '../assets/images/event_community_showcase_1792584536661.jpg';

export const IMAGES = {
  heroBanner,
  avatarPlanner,
  weddingShowcase,
  birthdayShowcase,
  communityShowcase,
};

export function getEventImage(type: EventType): string {
  switch (type) {
    case 'wedding':
      return IMAGES.weddingShowcase;
    case 'birthday':
      return IMAGES.birthdayShowcase;
    case 'community':
      return IMAGES.communityShowcase;
    default:
      return IMAGES.heroBanner;
  }
}

