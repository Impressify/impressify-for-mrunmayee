import { useEffect, useRef, useState, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BedDouble,
  Calendar,
  CarFront,
  Clock3,
  Flower2,
  Gem,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Music,
  Shirt,
  Sparkles,
  SunMedium,
  User,
} from 'lucide-react';
import './App.css';
import {
  fallbackContent,
  getInvitationContent,
  getStoredTeam,
  getVoteSummary,
  submitVote,
  type Team,
  type VoteSummary,
} from './lib/invitation';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface DetailCard {
  title: string;
  icon: ReactNode;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  chips?: string[];
}

const zeroCountdown: CountdownState = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const teamCopy: Record<Team, { title: string; line: string }> = {
  bride: {
    title: 'TEAM BRIDE SECURED',
    line: 'NAKHRA FULL POWER!',
  },
  groom: {
    title: 'TEAM GROOM SECURED',
    line: 'BARAAT FULL POWER!',
  },
};

const detailCards: DetailCard[] = [
  {
    title: 'Venue',
    icon: <MapPin className="h-5 w-5" />,
    body: 'The Olive Conservatory, Jaipur. Garden ceremony followed by an indoor candlelit reception.',
    actionLabel: 'Open Google Maps',
    actionHref: 'https://maps.google.com/?q=Jaipur',
  },
  {
    title: 'Dress Code',
    icon: <Shirt className="h-5 w-5" />,
    body: 'Elegant Formal. Think rich silhouettes, polished tailoring, and soft metallic accents.',
  },
  {
    title: 'Pre-Wedding Events',
    icon: <Sparkles className="h-5 w-5" />,
    body: 'Join us for the celebrations before the main evening.',
    chips: ['Mehendi', 'Haldi', 'Sangeet'],
  },
  {
    title: 'Transportation',
    icon: <CarFront className="h-5 w-5" />,
    body: 'Shuttle pickups will run from the host hotel every 30 minutes starting at 3:45 PM.',
  },
  {
    title: 'Accommodation',
    icon: <BedDouble className="h-5 w-5" />,
    body: 'A room block is reserved nearby. Share your RSVP early so the team can hold your stay.',
  },
];

function getCountdown(targetDate: string): CountdownState {
  const distance = new Date(targetDate).getTime() - Date.now();

  if (distance <= 0) {
    return zeroCountdown;
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function getPercentages(votes: VoteSummary) {
  const total = votes.bride + votes.groom;

  if (total === 0) {
    return {
      bride: 50,
      groom: 50,
      total: 0,
    };
  }

  return {
    bride: Math.round((votes.bride / total) * 100),
    groom: Math.round((votes.groom / total) * 100),
    total,
  };
}

function renderEventIcon(icon: 'mehendi' | 'haldi' | 'wedding') {
  switch (icon) {
    case 'mehendi':
      return <Flower2 className="h-6 w-6 text-rose-400" />;
    case 'haldi':
      return <SunMedium className="h-6 w-6 text-amber-400" />;
    case 'wedding':
      return <Gem className="h-6 w-6 text-rose-300" />;
  }
}

const entranceSparkles = [
  { left: '10%', top: '20%', delay: '0s', duration: '3.8s' },
  { left: '24%', top: '12%', delay: '0.4s', duration: '4.4s' },
  { left: '42%', top: '18%', delay: '0.9s', duration: '3.6s' },
  { left: '66%', top: '14%', delay: '0.3s', duration: '4.8s' },
  { left: '82%', top: '22%', delay: '1.1s', duration: '4.2s' },
  { left: '16%', top: '36%', delay: '0.6s', duration: '3.9s' },
  { left: '74%', top: '38%', delay: '1.4s', duration: '4.6s' },
];

const ambientPetals = [
  { left: '6%', delay: '0s', duration: '14s' },
  { left: '17%', delay: '2.2s', duration: '17s' },
  { left: '29%', delay: '1.1s', duration: '15s' },
  { left: '44%', delay: '3s', duration: '18s' },
  { left: '58%', delay: '0.7s', duration: '16s' },
  { left: '71%', delay: '2.7s', duration: '19s' },
  { left: '84%', delay: '1.6s', duration: '15.5s' },
];

function playSoftNote(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType,
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.18);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function scheduleSoftPhrase(context: AudioContext, startTime: number) {
  const notes = [
    { offset: 0, frequency: 293.66, duration: 1.8, volume: 0.03, type: 'sine' as const },
    { offset: 0.35, frequency: 369.99, duration: 1.6, volume: 0.02, type: 'triangle' as const },
    { offset: 0.85, frequency: 440, duration: 1.45, volume: 0.022, type: 'sine' as const },
    { offset: 1.7, frequency: 493.88, duration: 1.35, volume: 0.018, type: 'triangle' as const },
    { offset: 2.25, frequency: 440, duration: 1.7, volume: 0.024, type: 'sine' as const },
    { offset: 2.9, frequency: 369.99, duration: 1.5, volume: 0.018, type: 'triangle' as const },
    { offset: 3.55, frequency: 329.63, duration: 2, volume: 0.024, type: 'sine' as const },
  ];

  notes.forEach((note) => {
    playSoftNote(
      context,
      note.frequency,
      startTime + note.offset,
      note.duration,
      note.volume,
      note.type,
    );
  });
}

function App() {
  const timeoutRefs = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicLoopRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [showEntranceCelebration, setShowEntranceCelebration] = useState(false);
  const [content, setContent] = useState(fallbackContent);
  const [votes, setVotes] = useState<VoteSummary>({ bride: 0, groom: 0 });
  const [countdown, setCountdown] = useState<CountdownState>(
    getCountdown(fallbackContent.countdownTarget),
  );
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(() => getStoredTeam());
  const [modalTeam, setModalTeam] = useState<Team | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [attendance, setAttendance] = useState<'attending' | 'unable'>('attending');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    void getInvitationContent().then((nextContent) => {
      setContent(nextContent);
      setCountdown(getCountdown(nextContent.countdownTarget));
    });

    void getVoteSummary().then(setVotes);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(content.countdownTarget));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [content.countdownTarget]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current = [];
      if (musicLoopRef.current !== null) {
        window.clearInterval(musicLoopRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const percentages = getPercentages(votes);

  const toggleAudio = async () => {
    if (isPlaying) {
      if (musicLoopRef.current !== null) {
        window.clearInterval(musicLoopRef.current);
        musicLoopRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.suspend();
      }
      setIsPlaying(false);
      return;
    }

    const audioContext =
      audioContextRef.current ?? new window.AudioContext();

    audioContextRef.current = audioContext;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    scheduleSoftPhrase(audioContext, audioContext.currentTime + 0.05);

    if (musicLoopRef.current !== null) {
      window.clearInterval(musicLoopRef.current);
    }

    musicLoopRef.current = window.setInterval(() => {
      if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
        return;
      }
      scheduleSoftPhrase(audioContextRef.current, audioContextRef.current.currentTime + 0.05);
    }, 4200);

    setIsPlaying(true);
  };

  const handleEnter = () => {
    if (isOpening) {
      return;
    }

    setIsOpening(true);
    const enterTimeout = window.setTimeout(() => {
      setHasEntered(true);
      setShowEntranceCelebration(true);

      confetti({
        particleCount: 90,
        spread: 85,
        startVelocity: 30,
        scalar: 0.95,
        origin: { y: 0.62 },
        colors: ['#fde68a', '#fcd34d', '#f9a8d4', '#fda4af'],
      });

      const leftBurstTimeout = window.setTimeout(() => {
        confetti({
          particleCount: 65,
          spread: 70,
          startVelocity: 26,
          scalar: 0.8,
          origin: { x: 0.2, y: 0.44 },
          colors: ['#fde68a', '#fff7cc', '#bfdbfe'],
        });
        confetti({
          particleCount: 65,
          spread: 70,
          startVelocity: 26,
          scalar: 0.8,
          origin: { x: 0.8, y: 0.44 },
          colors: ['#fde68a', '#fff7cc', '#fbcfe8'],
        });
      }, 220);

      const hideCelebrationTimeout = window.setTimeout(() => {
        setShowEntranceCelebration(false);
      }, 2400);

      timeoutRefs.current.push(leftBurstTimeout, hideCelebrationTimeout);
    }, 950);

    timeoutRefs.current.push(enterTimeout);
  };

  const handleVote = async (team: Team) => {
    if (selectedTeam || isSubmittingVote) {
      return;
    }

    setModalTeam(team);
    setIsSubmittingVote(true);

    try {
      const nextVotes = await submitVote(team);
      setVotes(nextVotes);
      setSelectedTeam(team);
      confetti({
        particleCount: 110,
        spread: 75,
        startVelocity: 32,
        origin: { y: 0.58 },
        colors:
          team === 'bride'
            ? ['#f9a8d4', '#fda4af', '#fde68a']
            : ['#93c5fd', '#67e8f9', '#fde68a'],
      });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);

    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 26,
      scalar: 0.85,
      origin: { y: 0.5 },
      colors:
        attendance === 'attending'
          ? ['#d4af37', '#f6e7a7', '#c7f1d6']
          : ['#d4af37', '#f6e7a7'],
    });
  };

  return (
    <div className="invitation-shell">
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            key="intro"
            className="gate-intro"
            exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.72 } }}
          >
            <div className={`gate-frame ${isOpening ? 'gate-frame--opening' : ''}`}>
              <div className="gate-panel gate-panel--left" />
              <div className="gate-panel gate-panel--right" />

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="intro-content"
              >
                <p className="intro-eyebrow">Wedding Invitation</p>
                <h1 className="intro-title">Open The Celebration</h1>
                <p className="intro-copy">
                  Tap the seal to reveal the celebration for Vaishnavi and Yash.
                </p>

                <motion.button
                  type="button"
                  onClick={handleEnter}
                  className="seal-button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  animate={
                    isOpening
                      ? { scale: [1, 1.08, 14], opacity: [1, 1, 0] }
                      : { scale: [1, 1.03, 1] }
                  }
                  transition={
                    isOpening
                      ? { duration: 0.95, ease: 'easeInOut' }
                      : { duration: 2.4, repeat: Number.POSITIVE_INFINITY }
                  }
                >
                  <span className="seal-button__outer" />
                  <span className="seal-button__inner">
                    <Heart className="h-8 w-8 fill-current" strokeWidth={1.5} />
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hero-backdrop">
        <img
          src={content.heroImage}
          alt="Couple Background"
          className="hero-backdrop__image"
        />
        <div className="hero-backdrop__overlay" />
      </div>

      <button type="button" onClick={toggleAudio} className="music-button">
        <Music className={`h-5 w-5 ${isPlaying ? 'animate-pulse music-button__icon--active' : 'music-button__icon'}`} />
      </button>

      <motion.div
        className="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasEntered ? 1 : 0 }}
        transition={{ duration: 0.7, delay: hasEntered ? 0.15 : 0 }}
      >
        <div className="ambient-petals" aria-hidden="true">
          {ambientPetals.map((petal, index) => (
            <span
              key={`${petal.left}-${index}`}
              className="ambient-petals__piece"
              style={{
                left: petal.left,
                animationDelay: petal.delay,
                animationDuration: petal.duration,
              }}
            />
          ))}
        </div>

        <AnimatePresence>
          {showEntranceCelebration && (
            <motion.div
              className="entrance-celebration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="entrance-celebration__glow"
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
              <motion.div
                className="entrance-celebration__headline"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, delay: 0.18 }}
              >
                <p>Doors Open</p>
                <span>The celebration begins</span>
              </motion.div>
              {entranceSparkles.map((sparkle, index) => (
                <span
                  key={`${sparkle.left}-${sparkle.top}-${index}`}
                  className="entrance-celebration__spark"
                  style={{
                    left: sparkle.left,
                    top: sparkle.top,
                    animationDelay: sparkle.delay,
                    animationDuration: sparkle.duration,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="hero-section">
          <div className="hero-section__halo" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: hasEntered ? 1 : 0, y: hasEntered ? 0 : 30 }}
            transition={{ duration: 0.9 }}
            className="hero-section__intro"
          >
            <div className="hero-ornament">
              <span />
              <Sparkles className="h-4 w-4" />
              <span />
            </div>
            <p className="hero-eyebrow">{content.eyebrow}</p>
            <h1 className="hero-title">
              <span className="hero-title__name">Vaishnavi</span>
              <br />
              <span className="hero-title__ampersand">&amp;</span>
              <br />
              <span className="hero-title__name">Yash</span>
            </h1>
            <p className="hero-subtitle">{content.subtitle}</p>
            <p className="hero-tagline">{content.tagline}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hasEntered ? 1 : 0 }}
            transition={{ delay: 0.45, duration: 0.9 }}
            className="countdown-grid"
          >
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Mins', value: countdown.minutes },
              { label: 'Secs', value: countdown.seconds },
            ].map((item) => (
              <motion.div
                key={item.label}
                className="countdown-card"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <span className="countdown-card__value">
                  {item.value.toString().padStart(2, '0')}
                </span>
                <span className="countdown-card__label">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="hero-story"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: hasEntered ? 1 : 0, y: hasEntered ? 0 : 18 }}
            transition={{ delay: 0.62, duration: 0.75 }}
          >
            <Sparkles className="h-4 w-4" />
            <p>{content.story}</p>
          </motion.div>

          <p className="hero-venue">{content.venueLine}</p>
        </section>

        <section className="content-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Celebration Poll
          </motion.h2>
          <p className="section-copy">
            Pick a side, trigger the celebration screen, and track the live split.
          </p>

          <div className="vote-grid">
            <motion.button
              whileHover={{ scale: selectedTeam ? 1 : 1.02 }}
              whileTap={{ scale: selectedTeam ? 1 : 0.98 }}
              onClick={() => void handleVote('bride')}
              disabled={Boolean(selectedTeam)}
                className="vote-card vote-card--bride"
              >
              <div className="vote-card__inner">
                <Heart className="vote-card__icon vote-card__icon--bride" />
                <span className="mb-1 font-serif text-lg">Team Bride</span>
                <span className="vote-card__count vote-card__count--bride">{votes.bride}</span>
                <span className="vote-card__percent">
                  {percentages.bride}%
                </span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: selectedTeam ? 1 : 1.02 }}
              whileTap={{ scale: selectedTeam ? 1 : 0.98 }}
              onClick={() => void handleVote('groom')}
              disabled={Boolean(selectedTeam)}
                className="vote-card vote-card--groom"
              >
              <div className="vote-card__inner">
                <Heart className="vote-card__icon vote-card__icon--groom" />
                <span className="mb-1 font-serif text-lg">Team Groom</span>
                <span className="vote-card__count vote-card__count--groom">{votes.groom}</span>
                <span className="vote-card__percent">
                  {percentages.groom}%
                </span>
              </div>
            </motion.button>
          </div>

          <div className="vote-meter">
            <div className="vote-meter__track">
              <div
                className="vote-meter__fill vote-meter__fill--bride"
                style={{ width: `${percentages.bride}%` }}
              />
            </div>
            <div className="vote-meter__track">
              <div
                className="vote-meter__fill vote-meter__fill--groom"
                style={{ width: `${percentages.groom}%` }}
              />
            </div>
          </div>

          <p className="section-footnote">
            {selectedTeam
              ? `Your vote is locked with Team ${selectedTeam === 'bride' ? 'Bride' : 'Groom'}.`
              : `Votes recorded: ${percentages.total}. Set VITE_API_BASE_URL to connect this to your Node/Mongo backend.`}
          </p>
        </section>

        <section className="content-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title section-title--spaced"
          >
            Meet the Couple
          </motion.h2>

          <div className="profile-stack">
            {content.profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.28 }}
                className="profile-card"
              >
                <div className="profile-card__image">
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="profile-card__role">{profile.role}</p>
                <h3 className="profile-card__name">{profile.name}</h3>
                <p className="profile-card__bio">{profile.bio}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Details
          </motion.h2>
          <p className="section-copy">
            Everything guests need before the celebration begins.
          </p>

          <div className="details-grid">
            {detailCards.map((card, index) => (
              <motion.article
                key={card.title}
                className="detail-card"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <div className="detail-card__icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>

                {card.chips && (
                  <div className="detail-card__chips">
                    {card.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                )}

                {card.actionLabel && card.actionHref && (
                  <a
                    href={card.actionHref}
                    target="_blank"
                    rel="noreferrer"
                    className="detail-card__button"
                  >
                    {card.actionLabel}
                  </a>
                )}
              </motion.article>
            ))}
          </div>
        </section>

        <section className="content-section content-section--timeline">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Wedding Itinerary
          </motion.h2>
          <p className="section-copy">
            Dress code, timing, and venue links stacked cleanly for mobile guests.
          </p>

          <div className="chat-shell">
            <div className="chat-shell__header">
              <div className="chat-shell__dot-group">
                <span />
                <span />
                <span />
              </div>
              <div>
                <p>Wedding Concierge</p>
                <span>Online now</span>
              </div>
            </div>

            <div className="space-y-6 pt-3">
              {content.events.map((event, index) => (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  whileHover={{ y: -4 }}
                  className={`chat-row ${index % 2 === 0 ? 'chat-row--left' : 'chat-row--right'}`}
                >
                  <div
                    className={`chat-avatar ${index % 2 === 0 ? 'chat-avatar--left' : 'chat-avatar--right'}`}
                  >
                    {renderEventIcon(event.icon)}
                  </div>

                  <div
                    className={`chat-bubble ${index % 2 === 0 ? 'chat-bubble--left' : 'chat-bubble--right'}`}
                  >
                    <p className="chat-bubble__date">
                      {event.dateLabel}
                    </p>
                    <h3 className="chat-bubble__title">{event.title}</h3>
                    <p className="chat-bubble__copy">{event.blurb}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="chat-detail-chip">
                        <p className="chat-detail-chip__label">
                          Dress Code
                        </p>
                        <p className="chat-detail-chip__value">{event.dressCode}</p>
                      </div>

                      <div className="chat-detail-chip">
                        <p className="chat-detail-chip__label">
                          Location
                        </p>
                        <p className="chat-detail-chip__value">{event.location}</p>
                      </div>
                    </div>

                    <div className="chat-bubble__meta">
                      <div className="chat-bubble__meta-row">
                        <Clock3 className="h-4 w-4 chat-bubble__meta-icon" />
                        <span>{event.timeLabel}</span>
                      </div>
                      <div className="chat-bubble__meta-row">
                        <Calendar className="h-4 w-4 chat-bubble__meta-icon" />
                        <span>{event.dateLabel}</span>
                      </div>
                      <div className="chat-bubble__meta-row">
                        <MapPin className="h-4 w-4 chat-bubble__meta-icon" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="chat-bubble__button"
                    >
                      View Location
                    </a>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section content-section--last">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            RSVP
          </motion.h2>
          <p className="section-copy">Let the couple know if you&apos;ll be there.</p>

          <motion.form
            className="rsvp-form"
            onSubmit={handleSubmit}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 18 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
          >
            <label className="form-field">
              <span>Name</span>
              <div className="form-field__input">
                <User className="h-4 w-4" />
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                />
              </div>
            </label>

            <label className="form-field">
              <span>Email</span>
              <div className="form-field__input">
                <Mail className="h-4 w-4" />
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </label>

            <div className="form-field">
              <span>Attendance</span>
              <div className="attendance-toggle">
                <button
                  type="button"
                  className={
                    attendance === 'attending'
                      ? 'attendance-toggle__button is-active'
                      : 'attendance-toggle__button'
                  }
                  onClick={() => setAttendance('attending')}
                >
                  Joyfully Attending
                </button>
                <button
                  type="button"
                  className={
                    attendance === 'unable'
                      ? 'attendance-toggle__button is-active'
                      : 'attendance-toggle__button'
                  }
                  onClick={() => setAttendance('unable')}
                >
                  Unable to Attend
                </button>
              </div>
            </div>

            <label className="form-field">
              <span>Message</span>
              <div className="form-field__input form-field__input--textarea">
                <MessageSquare className="h-4 w-4" />
                <textarea
                  name="message"
                  value={formValues.message}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Share a note for the couple"
                />
              </div>
            </label>

            <button type="submit" className="rsvp-submit">
              Send RSVP
            </button>

            {isSubmitted && (
              <p className="rsvp-success">
                RSVP captured for {formValues.name || 'your guest entry'}.
              </p>
            )}
          </motion.form>
        </section>

        <footer className="footer-block">
          <p className="footer-block__line">
            We can&apos;t wait to celebrate with you.
          </p>
          <p>Vaishnavi &amp; Yash / 2026</p>
        </footer>
      </motion.div>

      <AnimatePresence>
        {modalTeam && (
          <motion.div
            className="celebration-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalTeam(null)}
          >
            <motion.div
              className={`celebration-card ${modalTeam === 'bride' ? 'celebration-card--bride' : 'celebration-card--groom'}`}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="celebration-card__eyebrow">
                Celebration Locked
              </p>
              <h3 className="celebration-card__title">
                {teamCopy[modalTeam].title}
              </h3>
              <p className="celebration-card__line">
                {teamCopy[modalTeam].line}
              </p>
              <p className="celebration-card__copy">
                {isSubmittingVote
                  ? 'Recording your vote...'
                  : `${votes[modalTeam]} guests are backing this side right now.`}
              </p>

              <button
                type="button"
                onClick={() => setModalTeam(null)}
                className="celebration-card__close"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
