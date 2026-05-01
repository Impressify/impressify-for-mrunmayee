import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import {
  BedDouble,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flower2,
  Gem,
  Heart,
  MapPin,
  Music,
  Shirt,
  Sparkles,
  SunMedium,
  User,
  Users,
  X,
} from 'lucide-react';
import './App.css';
import { fallbackContent, getInvitationContent } from './lib/invitation';

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

interface StorySlide {
  id: string;
  image: string;
  stamp: string;
  title: string;
  caption: string;
}

const zeroCountdown: CountdownState = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const detailCards: DetailCard[] = [
  {
    title: 'Venue',
    icon: <MapPin className="h-5 w-5" />,
    body: 'The Olive Conservatory, Jaipur. Garden vows followed by a candlelit reception indoors.',
    actionLabel: 'Open Google Maps',
    actionHref: 'https://maps.google.com/?q=Jaipur',
  },
  {
    title: 'Dress Code',
    icon: <Shirt className="h-5 w-5" />,
    body: 'Elegant formal with soft metallics, blush tones, and polished silhouettes.',
  },
  {
    title: 'Pre-Wedding Events',
    icon: <Sparkles className="h-5 w-5" />,
    body: 'Join the celebrations before the vows begin.',
    chips: ['Mehendi', 'Haldi', 'Sangeet'],
  },
  {
    title: 'Transportation',
    icon: <CarFront className="h-5 w-5" />,
    body: 'Shuttles leave the host hotel every 30 minutes starting at 3:45 PM.',
  },
  {
    title: 'Accommodation',
    icon: <BedDouble className="h-5 w-5" />,
    body: 'A preferred room block is available nearby for close friends and family.',
  },
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

const butterfliesData = [
  { id: 1, color: '#f3cf78', delay: 0, duration: 14, startX: '15%', startY: '-10%', scale: 0.8 },
  { id: 2, color: '#8ab4f8', delay: 4, duration: 17, startX: '75%', startY: '-5%', scale: 1 },
  { id: 3, color: '#ffcf54', delay: 8, duration: 19, startX: '40%', startY: '-15%', scale: 0.7 },
  { id: 4, color: '#5c9ce6', delay: 12, duration: 15, startX: '85%', startY: '-10%', scale: 0.9 },
  { id: 5, color: '#f3cf78', delay: 16, duration: 18, startX: '25%', startY: '-5%', scale: 1.1 },
];

function Butterfly({ color, delay, duration, startX, startY, scale }: any) {
  return (
    <motion.div
      style={{
        position: 'fixed',
        left: startX,
        bottom: startY,
        pointerEvents: 'none',
        zIndex: 50,
      }}
      initial={{ opacity: 0, x: 0, y: 0, scale }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, 60, -30, 80, 20],
        y: [0, -250, -500, -750, -1000],
        rotate: [-10, 15, -20, 10, -5],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'linear',
      }}
    >
      <motion.div
        animate={{ scaleX: [1, 0.4, 1] }}
        transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      >
        <svg
          width="28"
          height="24"
          viewBox="0 0 28 24"
          fill={color}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}
        >
          <path d="M14 12C14 12 8 2 4 4C0 6 2 12 6 13C10 14 14 12 14 12ZM14 12C14 12 20 2 24 4C28 6 26 12 22 13C18 14 14 12 14 12ZM14 12C14 12 10 22 6 20C2 18 4 13 8 13C12 13 14 12 14 12ZM14 12C14 12 18 22 22 20C26 18 24 13 20 13C16 13 14 12 14 12Z" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

const eventOptions = ['Mehendi', 'Haldi', 'Sangeet', 'Wedding'];

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
    { offset: 0, frequency: 293.66, duration: 1.8, volume: 0.028, type: 'sine' as const },
    { offset: 0.35, frequency: 369.99, duration: 1.6, volume: 0.019, type: 'triangle' as const },
    { offset: 0.85, frequency: 440, duration: 1.45, volume: 0.021, type: 'sine' as const },
    { offset: 1.7, frequency: 493.88, duration: 1.35, volume: 0.017, type: 'triangle' as const },
    { offset: 2.25, frequency: 440, duration: 1.7, volume: 0.023, type: 'sine' as const },
    { offset: 2.9, frequency: 369.99, duration: 1.5, volume: 0.017, type: 'triangle' as const },
    { offset: 3.55, frequency: 329.63, duration: 2, volume: 0.022, type: 'sine' as const },
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

function fireCrackers() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#ffb703', '#fb8500', '#ffea00', '#ffffff'],
      zIndex: 100
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#ffb703', '#fb8500', '#ffea00', '#ffffff'],
      zIndex: 100
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

function ScratchReveal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const drawingRef = useRef(false);
  const scratchCountRef = useRef(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const setup = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = '#f3cf78';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 120; i += 1) {
        context.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          2 + Math.random() * 5,
          2 + Math.random() * 5,
        );
      }
      context.globalCompositeOperation = 'destination-out';
      scratchCountRef.current = 0;
      setIsRevealed(false);
    };

    setup();

    const resizeObserver = new ResizeObserver(setup);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [value]);

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (lastPosRef.current) {
      context.lineWidth = 52;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      context.lineTo(x, y);
      context.stroke();
    } else {
      context.beginPath();
      context.arc(x, y, 26, 0, Math.PI * 2);
      context.fill();
    }

    lastPosRef.current = { x, y };

    scratchCountRef.current += 1;

    if (scratchCountRef.current % 6 !== 0) {
      return;
    }

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentPixels = 0;

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) {
        transparentPixels += 1;
      }
    }

    if (!isRevealed && transparentPixels / (pixels.length / 4) > 0.70) {
      setIsRevealed(true);
      fireCrackers();
    }
  };

  const stopScratching = (pointerId?: number) => {
    drawingRef.current = false;
    lastPosRef.current = null;

    if (pointerId !== undefined) {
      canvasRef.current?.releasePointerCapture(pointerId);
    }
  };

  return (
    <div className="scratch-panel">
      <div className="section-heading">
        <p className="section-eyebrow">Scratch to Reveal</p>
        <h2>{label}</h2>
      </div>

      <div
        ref={containerRef}
        className={isRevealed ? 'scratch-card is-revealed' : 'scratch-card'}
      >
        {!isRevealed && <span className="scratch-card__hint">Scratch Here</span>}
        <div className="scratch-card__content">
          <span className="scratch-card__caption">Wedding Date</span>
          <strong>{value}</strong>
        </div>
        <canvas
          ref={canvasRef}
          className="scratch-card__canvas"
          onPointerDown={(event) => {
            drawingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            scratch(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (drawingRef.current) {
              scratch(event.clientX, event.clientY);
            }
          }}
          onPointerUp={(event) => {
            stopScratching(event.pointerId);
          }}
          onPointerCancel={(event) => {
            stopScratching(event.pointerId);
          }}
          onPointerLeave={() => {
            if (drawingRef.current) {
              stopScratching();
            }
          }}
        />
      </div>
    </div>
  );
}

function App() {
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 1000], [0, 150]);
  const timeoutRefs = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicLoopRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [content, setContent] = useState(fallbackContent);
  const [countdown, setCountdown] = useState<CountdownState>(
    getCountdown(fallbackContent.countdownTarget),
  );
  const [storyIndex, setStoryIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    guestCount: '1',
    events: ['Wedding'],
  });

  useEffect(() => {
    void getInvitationContent().then((nextContent) => {
      setContent(nextContent);
      setCountdown(getCountdown(nextContent.countdownTarget));
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(content.countdownTarget));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [content.countdownTarget]);

  useEffect(() => {
    const storyTimer = window.setInterval(() => {
      setStoryIndex((current) => (current + 1) % 3);
    }, 4200);

    return () => window.clearInterval(storyTimer);
  }, []);

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

  const stories: StorySlide[] = useMemo(
    () => [
      {
        id: 'story-1',
        image: content.heroImage,
        stamp: '12.12.26',
        title: 'The First Look',
        caption:
          'Soft light, quiet nerves, and the first moment everything starts to feel real.',
      },
      {
        id: 'story-2',
        image: content.profiles[0]?.image ?? content.heroImage,
        stamp: '13.12.26',
        title: 'Her Chapter',
        caption:
          'Blush florals, warm laughter, and every detail carrying her signature grace.',
      },
      {
        id: 'story-3',
        image: content.profiles[1]?.image ?? content.heroImage,
        stamp: '14.12.26',
        title: 'Their Evening',
        caption:
          'A celebration of music, family, and the kind of joy that lingers long after midnight.',
      },
    ],
    [content.heroImage, content.profiles],
  );

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

    const audioContext = audioContextRef.current ?? new window.AudioContext();
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

  const handleEnter = async () => {
    if (isOpening) {
      return;
    }

    setIsOpening(true);
    await toggleAudio().catch(() => undefined);

    const enterTimeout = window.setTimeout(() => {
      setHasEntered(true);
      confetti({
        particleCount: 95,
        spread: 82,
        startVelocity: 30,
        scalar: 0.9,
        origin: { y: 0.58 },
        colors: ['#f2a6ba', '#f3cf78', '#fff4cb'],
      });
    }, 850);

    timeoutRefs.current.push(enterTimeout);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);

    confetti({
      particleCount: 120,
      spread: 76,
      startVelocity: 28,
      scalar: 0.9,
      origin: { y: 0.45 },
      colors: ['#f2a6ba', '#f7d98f', '#fff1ca'],
    });
  };

  return (
    <div className="invitation-shell">
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            key="intro"
            className="gate-intro"
            exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.7 } }}
          >
            <div className={`gate-frame ${isOpening ? 'gate-frame--opening' : ''}`}>
              <div className="gate-frame__backdrop">
                <img
                  src={content.heroImage}
                  alt="Wedding invitation cover"
                  className="gate-frame__image"
                />
                <div className="gate-frame__overlay" />
              </div>
              <div className="gate-panel gate-panel--left" />
              <div className="gate-panel gate-panel--right" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75 }}
                className="intro-content"
              >
                <p className="intro-eyebrow" style={{ color: '#fff' }}>For The Celebration</p>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h1 className="hero-title" style={{ color: '#fff', marginBottom: '3rem', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    Vaishnavi &amp; Yash
                  </h1>
                  
                  <motion.button
                    type="button"
                    onClick={handleEnter}
                    className="seal-button"
                    style={{ position: 'relative', left: 'auto', bottom: 'auto', transform: 'none' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    animate={
                      isOpening
                        ? { scale: [1, 1.08, 12], opacity: [1, 1, 0] }
                        : { rotate: [0, 3, -3, 0] }
                    }
                    transition={
                      isOpening
                        ? { duration: 0.82, ease: 'easeInOut' }
                        : { duration: 4, repeat: Number.POSITIVE_INFINITY }
                    }
                  >
                    <span className="seal-button__outer" />
                    <span className="seal-button__inner">
                      <Heart className="h-8 w-8 fill-current" strokeWidth={1.5} />
                    </span>
                  </motion.button>
                  <p style={{ marginTop: '1.5rem', color: '#fff', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Tap to enter</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" onClick={() => void toggleAudio()} className="music-button">
        <Music
          className={`h-5 w-5 ${isPlaying ? 'animate-pulse music-button__icon--active' : 'music-button__icon'}`}
        />
      </button>

      {hasEntered && butterfliesData.map((butterfly) => (
        <Butterfly key={butterfly.id} {...butterfly} />
      ))}

      <motion.main
        className="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasEntered ? 1 : 0 }}
        transition={{ duration: 0.72, delay: hasEntered ? 0.14 : 0 }}
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

        <section className="hero-section">
          <motion.div 
            className="hero-image-container"
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 50, damping: 20, duration: 1.5 }}
          >
            <motion.img
              src={content.heroImage}
              alt="Couple portrait"
              style={{ y: yParallax }}
            />
            <div className="hero-image-overlay" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: hasEntered ? 1 : 0, y: hasEntered ? 0 : 40 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 1 }}
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
            className="hero-story"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hasEntered ? 1 : 0, y: hasEntered ? 0 : 20 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4" />
            <p>{content.story}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: hasEntered ? 1 : 0, scale: hasEntered ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.35 }}
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
              >
                <span className="countdown-card__value">
                  {item.value.toString().padStart(2, '0')}
                </span>
                <span className="countdown-card__label">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <p className="hero-venue">{content.venueLine}</p>
        </section>

        <section className="content-section">
          <ScratchReveal label="Wedding Date" value="December 14, 2026" />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="section-eyebrow">Story Timeline</p>
            <h2>Moments In Motion</h2>
          </div>

          <div className="story-slider">
            <div className="story-slider__progress">
              {stories.map((story, index) => (
                <span
                  key={story.id}
                  className={index === storyIndex ? 'is-active' : ''}
                />
              ))}
            </div>

            <div className="story-slider__media">
              <img src={stories[storyIndex].image} alt={stories[storyIndex].title} />
              <div className="story-slider__grain" />
              <span className="story-slider__stamp">{stories[storyIndex].stamp}</span>
              <button
                type="button"
                className="story-slider__arrow story-slider__arrow--left"
                onClick={() =>
                  setStoryIndex((current) => (current - 1 + stories.length) % stories.length)
                }
                aria-label="Previous story"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="story-slider__arrow story-slider__arrow--right"
                onClick={() => setStoryIndex((current) => (current + 1) % stories.length)}
                aria-label="Next story"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <motion.div
              key={stories[storyIndex].id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45 }}
              className="story-slider__copy"
            >
              <p className="story-slider__kicker">Insta-Style Story</p>
              <h3>{stories[storyIndex].title}</h3>
              <p>{stories[storyIndex].caption}</p>
            </motion.div>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="section-eyebrow">Timeline</p>
            <h2>The Wedding Flow</h2>
          </div>

          <div className="timeline-list">
            {content.events.map((event, index) => (
              <motion.article
                key={event.id}
                className="timeline-card"
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.42, delay: index * 0.06 }}
              >
                <div className="timeline-card__rail">
                  <span className="timeline-card__dot" />
                  {index !== content.events.length - 1 && <span className="timeline-card__line" />}
                </div>
                <div className="timeline-card__body">
                  <div className="timeline-card__icon">{renderEventIcon(event.icon)}</div>
                  <div className="timeline-card__content">
                    <p className="timeline-card__date">{event.dateLabel}</p>
                    <h3>{event.title}</h3>
                    <p>{event.blurb}</p>
                    <div className="timeline-card__meta">
                      <span>
                        <Clock3 className="h-4 w-4" />
                        {event.timeLabel}
                      </span>
                      <span>
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="section-eyebrow">Details</p>
            <h2>Everything Guests Need</h2>
          </div>

          <div className="details-grid">
            {detailCards.map((card, index) => (
              <motion.article
                key={card.title}
                className="detail-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.42, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
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

        <section className="content-section content-section--last">
          <div className="section-heading">
            <p className="section-eyebrow">RSVP</p>
            <h2>Ready To Celebrate?</h2>
          </div>

          <div className="floating-rsvp">
            <button type="button" className="floating-rsvp__button" onClick={() => setIsDrawerOpen(true)}>
              Open RSVP
            </button>
          </div>
        </section>

        <footer className="footer-block">
          <p className="footer-block__line">A little romance, a lot of celebration.</p>
          <p>Vaishnavi &amp; Yash / 2026</p>
        </footer>
      </motion.main>

      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
          >
            <motion.aside
              className="rsvp-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rsvp-drawer__header">
                <div>
                  <p className="section-eyebrow">RSVP Drawer</p>
                  <h3>Confirm Your Presence</h3>
                </div>
                <button
                  type="button"
                  className="rsvp-drawer__close"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close RSVP drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form className="rsvp-form" onSubmit={handleSubmit}>
                <label className="form-field">
                  <span>Name</span>
                  <div className="form-field__input">
                    <User className="h-4 w-4" />
                    <input
                      type="text"
                      value={formValues.name}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>Guest Count</span>
                  <div className="form-field__input">
                    <Users className="h-4 w-4" />
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={formValues.guestCount}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, guestCount: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>

                <div className="form-field">
                  <span>Events</span>
                  <div className="event-checkboxes">
                    {eventOptions.map((option) => {
                      const checked = formValues.events.includes(option);
                      return (
                        <label key={option} className={checked ? 'event-checkbox is-active' : 'event-checkbox'}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setFormValues((current) => ({
                                ...current,
                                events: checked
                                  ? current.events.filter((item) => item !== option)
                                  : [...current.events, option],
                              }))
                            }
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="rsvp-submit">
                  Confirm
                </button>

                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      className="confetti-lottie"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="confetti-lottie__burst">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                      <p>RSVP captured beautifully.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
