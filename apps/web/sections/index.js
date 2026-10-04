// ─────────────────────────────────────────────────────────────
//  DASHBOARD SECTIONS REGISTRY
//  Each entry becomes a tab in the editor's navigation.
//  Add a section: create a component that receives { ed } and list it here.
//  `ed` = { page, set(updater, mergeKey), pageUrl, savedSlug, analytics, dirty, pendingBookings, refreshPending }
// ─────────────────────────────────────────────────────────────
import { CalendarDays, Link2, UserRound, Palette, Image as ImageIcon, SlidersHorizontal, Settings, BarChart3 } from 'lucide-react';
import LinksSection from './LinksSection';
import ProfileSection from './ProfileSection';
import ThemeSection from './ThemeSection';
import WallpaperSection from './WallpaperSection';
import StyleSection from './StyleSection';
import SettingsSection from './SettingsSection';
import AnalyticsSection from './AnalyticsSection';
import AgendaSection from './AgendaSection';

export const sections = [
  { id: 'links', label: 'Links', icon: Link2, Component: LinksSection },
  { id: 'profile', label: 'Profile', icon: UserRound, Component: ProfileSection },
  { id: 'theme', label: 'Theme', icon: Palette, Component: ThemeSection },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon, Component: WallpaperSection },
  { id: 'style', label: 'Style', icon: SlidersHorizontal, Component: StyleSection },
  { id: 'settings', label: 'Settings', icon: Settings, Component: SettingsSection },
  // `badge` names a number in `ed` shown next to the label (pending bookings).
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, Component: AgendaSection, wide: true, badge: 'pendingBookings' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, Component: AnalyticsSection, wide: true },
];
