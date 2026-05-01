export type Team = 'bride' | 'groom';

export interface CoupleProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface EventCard {
  id: string;
  icon: 'mehendi' | 'haldi' | 'wedding';
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  dressCode: string;
  mapUrl: string;
  blurb: string;
}

export interface InvitationContent {
  eyebrow: string;
  tagline: string;
  title: string;
  subtitle: string;
  countdownTarget: string;
  venueLine: string;
  heroImage: string;
  story: string;
  profiles: CoupleProfile[];
  events: EventCard[];
}

export interface VoteSummary {
  bride: number;
  groom: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
const LOCAL_VOTES_KEY = 'impressify-votes';
const LOCAL_TEAM_KEY = 'impressify-team';

export const fallbackContent: InvitationContent = {
  eyebrow: 'A New Chapter Begins',
  tagline: 'Open the gates to an evening of music, mischief, and vows.',
  title: 'Vaishnavi & Yash',
  subtitle: 'Request the honor of your presence as they begin forever together.',
  countdownTarget: '2026-12-14T19:00:00+05:30',
  venueLine: 'Wedding vows on December 14, 2026 at The Marigold Estate, Jaipur',
  heroImage:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  story:
    'Two loud laughers, one endless conversation, and a celebration stitched with family, color, and full-volume joy.',
  profiles: [
    {
      id: 'bride',
      name: 'Vaishnavi',
      role: 'The bride',
      bio: 'Equal parts grace and chaos, she brings the sparkle, the plans, and the last word.',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'groom',
      name: 'Yash',
      role: 'The groom',
      bio: 'Calm under pressure, sharp with one-liners, and very ready for a baraat that ignores all timelines.',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    },
  ],
  events: [
    {
      id: 'mehendi',
      icon: 'mehendi',
      title: 'Mehendi Brunch',
      dateLabel: 'December 12, 2026',
      timeLabel: '11:00 AM onwards',
      location: 'The Courtyard Pavilion, Jaipur',
      dressCode: 'Shades of Green',
      mapUrl: 'https://maps.google.com/?q=Jaipur',
      blurb: 'Fresh florals, live music, and henna stories before the real chaos starts.',
    },
    {
      id: 'haldi',
      icon: 'haldi',
      title: 'Haldi & Sundowner',
      dateLabel: 'December 13, 2026',
      timeLabel: '4:30 PM onwards',
      location: 'Sunset Lawn, The Marigold Estate',
      dressCode: 'Yellow & Pastels',
      mapUrl: 'https://maps.google.com/?q=The+Marigold+Estate+Jaipur',
      blurb: 'Turmeric, petals, and zero chance of leaving without color on your outfit.',
    },
    {
      id: 'wedding',
      icon: 'wedding',
      title: 'Wedding Ceremony',
      dateLabel: 'December 14, 2026',
      timeLabel: '7:00 PM onwards',
      location: 'Grand Dome, The Marigold Estate',
      dressCode: 'Classic Indian Formal',
      mapUrl: 'https://maps.google.com/?q=The+Marigold+Estate+Jaipur',
      blurb: 'The vows, the varmala, and the moment every camera in the family appears at once.',
    },
  ],
};

const defaultVotes: VoteSummary = {
  bride: 18,
  groom: 14,
};

function readLocalVotes(): VoteSummary {
  if (typeof window === 'undefined') {
    return defaultVotes;
  }

  const raw = window.localStorage.getItem(LOCAL_VOTES_KEY);

  if (!raw) {
    window.localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(defaultVotes));
    return defaultVotes;
  }

  try {
    return JSON.parse(raw) as VoteSummary;
  } catch {
    window.localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(defaultVotes));
    return defaultVotes;
  }
}

function writeLocalVotes(votes: VoteSummary) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
}

export function getStoredTeam(): Team | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(LOCAL_TEAM_KEY);
  return stored === 'bride' || stored === 'groom' ? stored : null;
}

function storeTeam(team: Team) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_TEAM_KEY, team);
}

export async function getInvitationContent(): Promise<InvitationContent> {
  if (!API_BASE_URL) {
    return fallbackContent;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/invitation`);

    if (!response.ok) {
      throw new Error('Invitation request failed');
    }

    return (await response.json()) as InvitationContent;
  } catch {
    return fallbackContent;
  }
}

export async function getVoteSummary(): Promise<VoteSummary> {
  if (!API_BASE_URL) {
    return readLocalVotes();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/votes`);

    if (!response.ok) {
      throw new Error('Votes request failed');
    }

    return (await response.json()) as VoteSummary;
  } catch {
    return readLocalVotes();
  }
}

export async function submitVote(team: Team): Promise<VoteSummary> {
  if (!API_BASE_URL) {
    const nextVotes = readLocalVotes();
    nextVotes[team] += 1;
    writeLocalVotes(nextVotes);
    storeTeam(team);
    return nextVotes;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team }),
    });

    if (!response.ok) {
      throw new Error('Vote submit failed');
    }

    storeTeam(team);
    return (await response.json()) as VoteSummary;
  } catch {
    const nextVotes = readLocalVotes();
    nextVotes[team] += 1;
    writeLocalVotes(nextVotes);
    storeTeam(team);
    return nextVotes;
  }
}
