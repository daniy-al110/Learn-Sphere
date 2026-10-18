import {
  Award, Bell, BookOpen, Calendar, CalendarCheck, CalendarX, Check, CheckCircle, CheckSquare, ChevronRight, Clock, Clock3,
  Edit3, ExternalLink, FileText, GraduationCap, Inbox, Key, LayoutDashboard, LogOut, MessageSquare, Printer, Receipt,
  RefreshCw, Search, Upload, Zap, ArrowRight, Star, Users, Activity, HelpCircle, Plus, Trash2, X, XCircle, Download, UserCheck, BarChart2, Layers,
  UserPlus, Shield, Video, PlayCircle, CreditCard, Loader, Lock,
  type LucideIcon,
} from "lucide-react";

/** Server layouts pass icon *names* (strings) to client components; this maps them to lucide components. */
export const ICONS = {
  "graduation-cap": GraduationCap,
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "calendar-x": CalendarX,
  "edit-3": Edit3,
  "file-text": FileText,
  "message-square": MessageSquare,
  "check-square": CheckSquare,
  receipt: Receipt,
  key: Key,
  "log-out": LogOut,
  bell: Bell,
  "arrow-right": ArrowRight,
  clock: Clock,
  "clock-3": Clock3,
  award: Award,
  zap: Zap,
  "chevron-right": ChevronRight,
  search: Search,
  inbox: Inbox,
  "check-circle": CheckCircle,
  check: Check,
  "refresh-cw": RefreshCw,
  printer: Printer,
  upload: Upload,
  "external-link": ExternalLink,
  star: Star,
  users: Users,
  activity: Activity,
  "help-circle": HelpCircle,
  plus: Plus,
  "trash-2": Trash2,
  x: X,
  "x-circle": XCircle,
  download: Download,
  "user-check": UserCheck,
  "bar-chart-2": BarChart2,
  layers: Layers,
  "user-plus": UserPlus,
  shield: Shield,
  video: Video,
  "play-circle": PlayCircle,
  "credit-card": CreditCard,
  loader: Loader,
  lock: Lock,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const C = ICONS[name];
  return <C className={className} aria-hidden="true" />;
}
