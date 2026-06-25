import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'operation-kidzania-2026-state';
const PASSWORD = 'wiyona awalia puteri';
const MAX_ACTIVITIES = 20;
const TARGET_COMPLETED = 10;
const EXAMPLE_ACTIVITIES = ['Pilot', 'Firefighter', 'AQUA Factory', 'Yakult Factory', 'Pizza Shop'];
const REWARD_ITEMS = [
  { id: 'eskrim', name: 'EsKrim', cost: 50, icon: '🍦', note: 'Sweet mini treat setelah misi.' },
  { id: 'bunga', name: 'Bunga', cost: 350, icon: '💐', note: 'Cute flower reward untuk Agent Wiyona.' },
  { id: 'makan-cantik', name: 'Makan Cantik', cost: 650, icon: '🍽️', note: 'Nice meal checkpoint after mission.' },
  { id: 'request', name: 'Request', cost: 1500, icon: '💌', note: 'Satu special request dari reward vault.' },
  { id: 'mobil-listrik', name: 'Mobil Listrik', cost: 2002, icon: '🚗', note: 'Ultra rare reward tier.' }
];
const REWARD_FALLBACK = 'Secret reward: pilih satu treat spesial setelah misi KidZania selesai. 🐾';

const pageSequence = ['briefing', 'activities', 'tracker', 'reward'];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `mission-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizePassword = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const makeActivity = (name) => ({
  id: createId(),
  name: name.trim(),
  completed: false,
  completedAt: null
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialState = () => {
  const saved = loadState();
  return {
    accessGranted: saved?.accessGranted ?? false,
    page: saved?.page ?? 'briefing',
    activities: Array.isArray(saved?.activities) ? saved.activities : EXAMPLE_ACTIVITIES.map(makeActivity),
    overrideReason: saved?.overrideReason ?? '',
    overrideApproved: saved?.overrideApproved ?? false,
    rewardText: saved?.rewardText ?? REWARD_FALLBACK,
    rewardRevealed: saved?.rewardRevealed ?? false,
    claimedRewards: Array.isArray(saved?.claimedRewards) ? saved.claimedRewards : [],
    agentWiyonaApproval: saved?.agentWiyonaApproval ?? 'pending',
    agentWiyonaNote:
      saved?.agentWiyonaNote ??
      'Pending Agent Wiyona decision untuk next trip atau main lagi bersama Geo.',
    darkMode: saved?.darkMode ?? false
  };
};

function App() {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [confettiSignal, setConfettiSignal] = useState(0);
  const [toast, setToast] = useState('');

  const completedCount = useMemo(
    () => state.activities.filter((activity) => activity.completed).length,
    [state.activities]
  );

  const rawProgress = Math.min(100, Math.round((completedCount / TARGET_COMPLETED) * 100));
  const progress = state.overrideApproved ? 100 : rawProgress;
  const earnedXp = completedCount * 100;
  const spentXp = useMemo(
    () =>
      state.claimedRewards.reduce((total, rewardId) => {
        const reward = REWARD_ITEMS.find((item) => item.id === rewardId);
        return total + (reward?.cost ?? 0);
      }, 0),
    [state.claimedRewards]
  );
  const rewardXpBalance = Math.max(0, earnedXp - spentXp);
  const missionReady = progress >= 100;

  const achievements = useMemo(
    () => [
      {
        id: 'first',
        title: 'First Mission',
        icon: '🌟',
        unlocked: completedCount >= 1,
        note: 'Satu aktivitas berhasil diamankan.'
      },
      {
        id: 'three',
        title: '3 Missions Completed',
        icon: '🎈',
        unlocked: completedCount >= 3,
        note: 'Tiga checkpoint selesai.'
      },
      {
        id: 'five',
        title: '5 Missions Completed',
        icon: '🍕',
        unlocked: completedCount >= 5,
        note: 'Setengah perjalanan terasa dekat.'
      },
      {
        id: 'ten',
        title: '10 Missions Completed',
        icon: '🏆',
        unlocked: completedCount >= 10,
        note: 'Target utama selesai.'
      },
      {
        id: 'hunter',
        title: 'Activity Hunter',
        icon: '🐾',
        unlocked: state.activities.length >= 10,
        note: 'Daftar aktivitas makin serius.'
      },
      {
        id: 'master',
        title: 'Mission Master',
        icon: '👑',
        unlocked: missionReady,
        note: 'Progress misi mencapai 100%.'
      },
      {
        id: 'explorer',
        title: 'KidZania Explorer',
        icon: '🗺️',
        unlocked: completedCount >= 7 || state.activities.length >= 15,
        note: 'Eksplorasi kota mini makin luas.'
      },
      {
        id: 'approval',
        title: 'Special Approval',
        icon: '✨',
        unlocked: state.overrideApproved,
        note: 'Mission Control menyetujui hasil akhir.'
      }
    ],
    [completedCount, missionReady, state.activities.length, state.overrideApproved]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateState = (patch) => setState((current) => ({ ...current, ...patch }));

  const goTo = (page) => updateState({ page });

  const nextPage = () => {
    const currentIndex = pageSequence.indexOf(state.page);
    const next = pageSequence[Math.min(pageSequence.length - 1, currentIndex + 1)];
    goTo(next);
  };

  const previousPage = () => {
    const currentIndex = pageSequence.indexOf(state.page);
    const prev = pageSequence[Math.max(0, currentIndex - 1)];
    goTo(prev);
  };

  const addActivity = (name) => {
    const cleanName = name.trim();
    if (!cleanName || state.activities.length >= MAX_ACTIVITIES) return false;
    updateState({ activities: [...state.activities, makeActivity(cleanName)] });
    setToast(`Activity added: ${cleanName}`);
    return true;
  };

  const updateActivityName = (id, name) => {
    updateState({
      activities: state.activities.map((activity) =>
        activity.id === id ? { ...activity, name } : activity
      )
    });
  };

  const deleteActivity = (id) => {
    updateState({ activities: state.activities.filter((activity) => activity.id !== id) });
  };

  const toggleActivity = (id) => {
    let justCompleted = false;
    const activities = state.activities.map((activity) => {
      if (activity.id !== id) return activity;
      justCompleted = !activity.completed;
      return {
        ...activity,
        completed: !activity.completed,
        completedAt: !activity.completed ? new Date().toISOString() : null
      };
    });

    updateState({ activities });

    if (justCompleted) {
      setConfettiSignal((value) => value + 1);
      setToast('+100 XP secured!');
    } else {
      setToast('Mission card reopened.');
    }
  };

  const toggleRewardClaim = (rewardId) => {
    const reward = REWARD_ITEMS.find((item) => item.id === rewardId);
    if (!reward) return;

    const alreadyClaimed = state.claimedRewards.includes(rewardId);

    if (alreadyClaimed) {
      updateState({ claimedRewards: state.claimedRewards.filter((id) => id !== rewardId) });
      setToast(`${reward.name} unchecked. ${reward.cost} XP returned.`);
      return;
    }

    if (rewardXpBalance < reward.cost) {
      setToast(`XP belum cukup untuk ${reward.name}. Need ${reward.cost - rewardXpBalance} XP lagi.`);
      return;
    }

    updateState({ claimedRewards: [...state.claimedRewards, rewardId] });
    setConfettiSignal((value) => value + 1);
    setToast(`${reward.name} claimed! -${reward.cost} XP`);
  };

  const setAgentWiyonaApproval = (agentWiyonaApproval) => {
    updateState({ agentWiyonaApproval });
    setConfettiSignal((value) => value + 1);
    setToast(agentWiyonaApproval === 'acc' ? 'Agent Wiyona: ACC secured!' : 'Agent Wiyona: Decline logged.');
  };

  const resetMission = () => {
    const fresh = {
      accessGranted: false,
      page: 'briefing',
      activities: EXAMPLE_ACTIVITIES.map(makeActivity),
      overrideReason: '',
      overrideApproved: false,
      rewardText: REWARD_FALLBACK,
      rewardRevealed: false,
      claimedRewards: [],
      agentWiyonaApproval: 'pending',
      agentWiyonaNote: 'Pending Agent Wiyona decision untuk next trip atau main lagi bersama Geo.',
      darkMode: state.darkMode
    };
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  if (loading) return <LoadingScreen />;

  if (!state.accessGranted) {
    return (
      <AppFrame darkMode={state.darkMode} setDarkMode={(darkMode) => updateState({ darkMode })} minimal>
        <LoginScreen
          onUnlock={() => {
            updateState({ accessGranted: true, page: 'briefing' });
            setConfettiSignal((value) => value + 1);
          }}
        />
        <ConfettiCanvas signal={confettiSignal} />
        <Toast message={toast} />
      </AppFrame>
    );
  }

  return (
    <AppFrame darkMode={state.darkMode} setDarkMode={(darkMode) => updateState({ darkMode })}>
      <ConfettiCanvas signal={confettiSignal} />
      <Toast message={toast} />

      <Header
        page={state.page}
        goTo={goTo}
        missionReady={missionReady}
        progress={progress}
        xp={rewardXpBalance}
        earnedXp={earnedXp}
        spentXp={spentXp}
        darkMode={state.darkMode}
        setDarkMode={(darkMode) => updateState({ darkMode })}
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-8 pt-3 sm:max-w-xl">
        <div className="page-pop">
          {state.page === 'briefing' && <MissionBriefing onStart={() => goTo('activities')} />}

          {state.page === 'activities' && (
            <ActivityBuilder
              activities={state.activities}
              addActivity={addActivity}
              updateActivityName={updateActivityName}
              deleteActivity={deleteActivity}
              onNext={() => goTo('tracker')}
            />
          )}

          {state.page === 'tracker' && (
            <MissionTracker
              activities={state.activities}
              completedCount={completedCount}
              progress={progress}
              rawProgress={rawProgress}
              earnedXp={earnedXp}
              spentXp={spentXp}
              rewardXpBalance={rewardXpBalance}
              achievements={achievements}
              overrideReason={state.overrideReason}
              overrideApproved={state.overrideApproved}
              onOverrideReasonChange={(overrideReason) => updateState({ overrideReason })}
              onApproveOverride={() => {
                updateState({ overrideApproved: true });
                setConfettiSignal((value) => value + 1);
                setToast('Special Approval unlocked!');
              }}
              onToggle={toggleActivity}
              onReward={() => goTo('reward')}
            />
          )}

          {state.page === 'reward' && (
            <RewardPage
              missionReady={missionReady}
              rewardItems={REWARD_ITEMS}
              claimedRewards={state.claimedRewards}
              earnedXp={earnedXp}
              spentXp={spentXp}
              rewardXpBalance={rewardXpBalance}
              onToggleReward={toggleRewardClaim}
              agentWiyonaApproval={state.agentWiyonaApproval}
              agentWiyonaNote={state.agentWiyonaNote}
              setAgentWiyonaApproval={setAgentWiyonaApproval}
              setAgentWiyonaNote={(agentWiyonaNote) => updateState({ agentWiyonaNote })}
              onBackToTracker={() => goTo('tracker')}
              onReset={resetMission}
            />
          )}
        </div>

        <BottomControls
          page={state.page}
          previousPage={previousPage}
          nextPage={nextPage}
          missionReady={missionReady}
        />
      </main>
    </AppFrame>
  );
}

function AppFrame({ children, darkMode, setDarkMode, minimal = false }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-rose-100 via-sky-100 to-amber-100 text-slate-800 transition-colors duration-500 dark:from-slate-950 dark:via-fuchsia-950 dark:to-slate-900 dark:text-white">
      <FloatingDecorations />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.65),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(252,231,243,0.45),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(186,230,253,0.40),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.24),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.18),transparent_34%)]" />
      {minimal && (
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="glass-button fixed right-4 top-4 z-20 px-3 py-2 text-xs font-bold"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      )}
      <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
    </div>
  );
}

function FloatingDecorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="cloud cloud-one">☁️</div>
      <div className="cloud cloud-two">☁️</div>
      <div className="cloud cloud-three">☁️</div>
      <div className="paw paw-one">🐾</div>
      <div className="paw paw-two">🐾</div>
      <div className="paw paw-three">🐾</div>
      <div className="star-orb left-[8%] top-[18%]" />
      <div className="star-orb right-[12%] top-[34%] delay-300" />
      <div className="star-orb bottom-[14%] left-[16%] delay-700" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-rose-100 via-sky-100 to-amber-100 px-6 text-slate-800 dark:from-slate-950 dark:via-fuchsia-950 dark:to-slate-900 dark:text-white">
      <div className="glass-card w-full max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[2rem] bg-white/65 text-5xl shadow-xl dark:bg-white/10">
          🐱
        </div>
        <p className="text-xs font-black uppercase tracking-[0.32em] text-fuchsia-500 dark:text-fuchsia-200">
          Mission System Booting
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight">Operation KidZania 2026</h1>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/60 shadow-inner dark:bg-white/10">
          <div className="loading-bar h-full rounded-full bg-gradient-to-r from-pink-300 via-sky-300 to-amber-300" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Preparing badges, XP, and secret rewards...
        </p>
      </div>
    </div>
  );
}

function LoginScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');

  const submit = (event) => {
    event.preventDefault();
    if (normalizePassword(password) === PASSWORD) {
      setStatus('granted');
      window.setTimeout(onUnlock, 900);
    } else {
      setStatus('denied');
    }
  };

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-4 py-8">
      <form onSubmit={submit} className="glass-card page-pop w-full text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[2rem] bg-gradient-to-br from-pink-200 to-sky-200 text-4xl shadow-xl dark:from-fuchsia-700 dark:to-sky-700">
          🔒
        </div>
        <p className="text-xs font-black uppercase tracking-[0.32em] text-fuchsia-500 dark:text-fuchsia-200">
          Operation KidZania 2026
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Classified Mission</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Enter the authorized full-name passphrase to open the mission briefing.
        </p>

        <label className="mt-7 block text-left text-sm font-black text-slate-700 dark:text-slate-100" htmlFor="password">
          Agent Passphrase
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setStatus('idle');
          }}
          placeholder="Full name password"
          className="mission-input mt-2"
          autoComplete="current-password"
        />

        <button type="submit" className="primary-button mt-5 w-full">
          Unlock Mission 🚀
        </button>

        {status === 'granted' && (
          <div className="granted-pop mt-5 rounded-3xl border border-emerald-200 bg-emerald-100/80 px-4 py-3 text-sm font-black text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-200">
            ✅ Access Granted — briefing portal opening...
          </div>
        )}

        {status === 'denied' && (
          <div className="shake mt-5 rounded-3xl border border-rose-200 bg-rose-100/80 px-4 py-3 text-sm font-black text-rose-600 dark:border-rose-300/30 dark:bg-rose-400/15 dark:text-rose-200">
            ❌ Access Denied — verify the full name and try again.
          </div>
        )}
      </form>
    </main>
  );
}

function Header({ page, goTo, missionReady, progress, xp, earnedXp, spentXp, darkMode, setDarkMode }) {
  const tabs = [
    { id: 'briefing', label: 'Brief', icon: '📜', disabled: false },
    { id: 'activities', label: 'Add', icon: '➕', disabled: false },
    { id: 'tracker', label: 'Track', icon: '✅', disabled: false },
    { id: 'reward', label: 'Reward', icon: '🎁', disabled: !missionReady }
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/35 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/35">
      <div className="mx-auto max-w-md sm:max-w-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.26em] text-fuchsia-500 dark:text-fuchsia-200">
              Mission Dashboard
            </p>
            <h1 className="text-xl font-black leading-tight">Operation KidZania 2026</h1>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="glass-button shrink-0 px-3 py-2 text-xs font-bold"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => !tab.disabled && goTo(tab.id)}
              disabled={tab.disabled}
              className={`rounded-2xl px-2 py-2 text-xs font-black transition-all duration-300 ${
                page === tab.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:bg-white dark:text-slate-950'
                  : tab.disabled
                    ? 'bg-white/25 text-slate-400 opacity-70 dark:bg-white/5 dark:text-slate-500'
                    : 'bg-white/55 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:bg-white/80 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15'
              }`}
            >
              <span className="block text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
          <div className="rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/10">
            Progress: <span className="text-fuchsia-600 dark:text-fuchsia-200">{progress}%</span>
          </div>
          <div className="rounded-2xl bg-white/55 px-3 py-2 text-right dark:bg-white/10">
            XP Balance: <span className="text-sky-600 dark:text-sky-200">{xp}</span>
            <span className="block text-[0.62rem] text-slate-400 dark:text-slate-300">
              Earned {earnedXp} · Spent {spentXp}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function MissionBriefing({ onStart }) {
  return (
    <section className="space-y-4">
      <div className="glass-card text-center">
        <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-[2rem] bg-white/65 text-5xl shadow-xl dark:bg-white/10">
          🕵️‍♀️
        </div>
        <p className="text-xs font-black uppercase tracking-[0.32em] text-fuchsia-500 dark:text-fuchsia-200">
          Mission Briefing
        </p>
        <h2 className="mt-3 text-3xl font-black leading-tight">Agents, assemble.</h2>
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Your task: explore KidZania, collect XP, unlock achievements, and secure the final reward.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AgentCard name="Agent Geo" icon="🧢" color="from-sky-200 to-cyan-100" />
        <AgentCard name="Agent Wiyona" icon="🎀" color="from-pink-200 to-rose-100" />
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-black">Mission Objective</h3>
        <div className="mt-4 space-y-3">
          {['Have Fun', 'Complete Activities', 'Unlock Final Reward'].map((objective, index) => (
            <div key={objective} className="flex items-center gap-3 rounded-3xl bg-white/55 p-3 dark:bg-white/10">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 to-pink-200 font-black text-slate-700 dark:from-fuchsia-600 dark:to-sky-600 dark:text-white">
                {index + 1}
              </div>
              <p className="font-black">{objective}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={onStart} className="primary-button mt-5 w-full">
          Start Mission ✨
        </button>
      </div>
    </section>
  );
}

function AgentCard({ name, icon, color }) {
  return (
    <div className="glass-card-mini text-center">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-gradient-to-br ${color} text-4xl shadow-lg`}>
        {icon}
      </div>
      <p className="mt-3 text-sm font-black">{name}</p>
      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">Status: Ready</p>
    </div>
  );
}

function ActivityBuilder({ activities, addActivity, updateActivityName, deleteActivity, onNext }) {
  const [activityName, setActivityName] = useState('');
  const remainingSlots = MAX_ACTIVITIES - activities.length;

  const submit = (event) => {
    event.preventDefault();
    const added = addActivity(activityName);
    if (added) setActivityName('');
  };

  return (
    <section className="space-y-4">
      <div className="glass-card">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-500 dark:text-fuchsia-200">
          Page 3 · Add Activities
        </p>
        <h2 className="mt-2 text-3xl font-black">Build the activity map.</h2>
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Add up to {MAX_ACTIVITIES} activities. You can edit every card before tracking begins.
        </p>

        <form onSubmit={submit} className="mt-5 flex gap-2">
          <input
            value={activityName}
            onChange={(event) => setActivityName(event.target.value)}
            placeholder="e.g. Pilot"
            className="mission-input"
            maxLength={42}
          />
          <button
            type="submit"
            disabled={!activityName.trim() || remainingSlots <= 0}
            className="primary-button shrink-0 px-5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Add
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_ACTIVITIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => addActivity(example)}
              disabled={remainingSlots <= 0}
              className="rounded-full bg-white/60 px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/15"
            >
              + {example}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-white/45 p-3 text-sm font-black dark:bg-white/10">
          Slots remaining: <span className="text-fuchsia-600 dark:text-fuchsia-200">{remainingSlots}</span>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black">Editable Activity List</h3>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700 dark:bg-sky-400/15 dark:text-sky-200">
            {activities.length}/{MAX_ACTIVITIES}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {activities.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/70 bg-white/35 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
              No activities yet. Add the first mission target.
            </div>
          )}

          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-center gap-2 rounded-3xl bg-white/55 p-2 shadow-sm dark:bg-white/10">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-200 to-sky-200 text-sm font-black dark:from-fuchsia-700 dark:to-sky-700">
                {index + 1}
              </div>
              <input
                value={activity.name}
                onChange={(event) => updateActivityName(activity.id, event.target.value)}
                className="min-w-0 flex-1 rounded-2xl bg-transparent px-2 py-2 text-sm font-black outline-none ring-0 placeholder:text-slate-400"
                aria-label={`Edit ${activity.name}`}
              />
              <button
                type="button"
                onClick={() => deleteActivity(activity.id)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 transition hover:scale-105 dark:bg-rose-400/15 dark:text-rose-200"
                aria-label={`Delete ${activity.name}`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={onNext} className="primary-button mt-5 w-full" disabled={activities.length === 0}>
          Open Mission Tracker ✅
        </button>
      </div>
    </section>
  );
}

function MissionTracker({
  activities,
  completedCount,
  progress,
  rawProgress,
  earnedXp,
  spentXp,
  rewardXpBalance,
  achievements,
  overrideReason,
  overrideApproved,
  onOverrideReasonChange,
  onApproveOverride,
  onToggle,
  onReward
}) {
  return (
    <section className="space-y-4">
      <ProgressPanel
        progress={progress}
        rawProgress={rawProgress}
        completedCount={completedCount}
        earnedXp={earnedXp}
        spentXp={spentXp}
        rewardXpBalance={rewardXpBalance}
        overrideApproved={overrideApproved}
      />

      <div className="glass-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-fuchsia-500 dark:text-fuchsia-200">
              Page 4 · Mission Tracker
            </p>
            <h2 className="mt-2 text-2xl font-black">Activity Cards</h2>
          </div>
          <span className="rounded-full bg-white/60 px-3 py-2 text-xs font-black dark:bg-white/10">
            {completedCount}/{TARGET_COMPLETED}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {activities.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/70 bg-white/35 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
              No activity cards. Add activities first.
            </div>
          )}

          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} onToggle={() => onToggle(activity.id)} />
          ))}
        </div>
      </div>

      <AchievementPanel achievements={achievements} />

      {completedCount < TARGET_COMPLETED && !overrideApproved && (
        <OverridePanel
          reason={overrideReason}
          onReasonChange={onOverrideReasonChange}
          onApproveOverride={onApproveOverride}
        />
      )}

      {overrideApproved && (
        <div className="granted-pop rounded-[2rem] border border-emerald-200 bg-emerald-100/80 p-5 text-center shadow-xl dark:border-emerald-300/30 dark:bg-emerald-400/15">
          <p className="text-3xl">✨</p>
          <h3 className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-100">
            Mission Success Approved
          </h3>
          <p className="mt-2 text-sm font-bold text-emerald-700/80 dark:text-emerald-100/80">
            Mission Control accepted the field report. Final progress is now 100%.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onReward}
        disabled={progress < 100}
        className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-45"
      >
        {progress >= 100 ? 'Open Reward Page 🎁' : 'Reward Locked · Reach 100%'}
      </button>
    </section>
  );
}

function ProgressPanel({ progress, rawProgress, completedCount, earnedXp, spentXp, rewardXpBalance, overrideApproved }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-500 dark:text-fuchsia-200">
            Progress System
          </p>
          <h2 className="mt-2 text-3xl font-black">{progress}%</h2>
        </div>
        <div className="rounded-[1.4rem] bg-white/60 px-4 py-3 text-right shadow-sm dark:bg-white/10">
          <p className="text-xs font-black text-slate-500 dark:text-slate-300">Spendable XP</p>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-200">{rewardXpBalance}</p>
        </div>
      </div>

      <div className="mt-5 h-7 overflow-hidden rounded-full bg-white/60 p-1 shadow-inner dark:bg-white/10">
        <div
          className="progress-fill h-full rounded-full bg-gradient-to-r from-pink-300 via-fuchsia-300 to-sky-300 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-2xl bg-white/45 px-3 py-2 dark:bg-white/10">
          Completed: {completedCount}/{TARGET_COMPLETED}
        </div>
        <div className="rounded-2xl bg-white/45 px-3 py-2 text-right dark:bg-white/10">
          Formula: {rawProgress}%
        </div>
        <div className="rounded-2xl bg-white/45 px-3 py-2 dark:bg-white/10">
          Earned XP: {earnedXp}
        </div>
        <div className="rounded-2xl bg-white/45 px-3 py-2 text-right dark:bg-white/10">
          Spent XP: {spentXp}
        </div>
      </div>

      {overrideApproved && (
        <p className="mt-3 rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
          Special override active: displayed progress forced to 100%. XP still follows completed activity count.
        </p>
      )}
    </div>
  );
}

function ActivityCard({ activity, onToggle }) {
  const completedAt = activity.completedAt
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(activity.completedAt))
    : 'Awaiting completion';

  return (
    <article
      className={`mission-card ${activity.completed ? 'mission-card-complete' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-black shadow-sm transition-all duration-300 ${
            activity.completed
              ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100'
              : 'bg-white/75 text-slate-500 hover:scale-105 dark:bg-white/10 dark:text-slate-300'
          }`}
          aria-label={activity.completed ? `Uncheck ${activity.name}` : `Complete ${activity.name}`}
        >
          {activity.completed ? '✓' : '○'}
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-black leading-tight">{activity.name || 'Unnamed Activity'}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">
            Timestamp: {completedAt}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-white/55 px-3 py-1 text-xs font-black dark:bg-white/10">
            {activity.completed ? '+100 XP secured' : 'Tap check to complete'}
          </p>
        </div>
      </div>
    </article>
  );
}

function AchievementPanel({ achievements }) {
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-500 dark:text-fuchsia-200">
            Achievement System
          </p>
          <h2 className="mt-2 text-2xl font-black">Badges</h2>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`badge-card ${achievement.unlocked ? 'badge-card-unlocked' : 'badge-card-locked'}`}
          >
            <div className="text-3xl">{achievement.unlocked ? achievement.icon : '🔐'}</div>
            <h3 className="mt-2 text-sm font-black leading-tight">{achievement.title}</h3>
            <p className="mt-1 text-[0.68rem] font-bold leading-snug opacity-75">{achievement.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverridePanel({ reason, onReasonChange, onApproveOverride }) {
  const [open, setOpen] = useState(false);
  const isValid = reason.trim().length >= 30;

  return (
    <div className="glass-card">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 to-pink-200 text-2xl shadow-lg dark:from-amber-600 dark:to-fuchsia-700">
          📝
        </div>
        <div>
          <h2 className="text-xl font-black">Special Override System</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
            Fewer than 10 completed activities detected. Submit a field explanation for Mission Control review.
          </p>
        </div>
      </div>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="secondary-button mt-5 w-full">
          Explain Mission Outcome
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <label htmlFor="override" className="text-sm font-black">
            Why was the mission target not achieved?
          </label>
          <textarea
            id="override"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="mission-input min-h-32 resize-none"
            placeholder="Write at least 30 characters. Example: waktu habis karena antrean panjang dan beberapa aktivitas sudah penuh."
          />
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-300">
            <span>{reason.trim().length}/30 characters</span>
            <span>{isValid ? 'Ready for approval ✅' : 'More detail needed'}</span>
          </div>
          <button
            type="button"
            onClick={onApproveOverride}
            disabled={!isValid}
            className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-45"
          >
            Submit Field Explanation ✨
          </button>
        </div>
      )}
    </div>
  );
}

function RewardPage({
  missionReady,
  rewardItems,
  claimedRewards,
  earnedXp,
  spentXp,
  rewardXpBalance,
  onToggleReward,
  agentWiyonaApproval,
  agentWiyonaNote,
  setAgentWiyonaApproval,
  setAgentWiyonaNote,
  onBackToTracker,
  onReset
}) {
  if (!missionReady) {
    return (
      <section className="glass-card text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[2rem] bg-white/60 text-4xl shadow-xl dark:bg-white/10">
          🔐
        </div>
        <h2 className="mt-4 text-3xl font-black">Reward Locked</h2>
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Reach 100% progress or submit Special Approval before opening the reward vault.
        </p>
        <button type="button" onClick={onBackToTracker} className="primary-button mt-5 w-full">
          Return to Tracker
        </button>
      </section>
    );
  }

  const approvalCopy = {
    pending: {
      icon: '🕵️‍♀️',
      title: 'Awaiting Agent Wiyona Review',
      body: 'Secret file belum diputuskan. Agent Wiyona bisa memilih ACC atau Decline.'
    },
    acc: {
      icon: '✅',
      title: 'ACC Approved',
      body: 'Agent Wiyona menyetujui next trip atau main lagi bersama Geo.'
    },
    decline: {
      icon: '❌',
      title: 'Decline Logged',
      body: 'Agent Wiyona menolak dulu. Mission file tetap tersimpan untuk evaluasi berikutnya.'
    }
  }[agentWiyonaApproval] ?? {
    icon: '🕵️‍♀️',
    title: 'Awaiting Agent Wiyona Review',
    body: 'Secret file belum diputuskan. Agent Wiyona bisa memilih ACC atau Decline.'
  };

  return (
    <section className="space-y-4">
      <div className="glass-card text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-amber-200 via-pink-200 to-sky-200 text-5xl shadow-xl dark:from-amber-600 dark:via-fuchsia-700 dark:to-sky-700">
          🎁
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-fuchsia-500 dark:text-fuchsia-200">
          Reward Page
        </p>
        <h2 className="mt-2 text-3xl font-black">Reward Unlocked</h2>
        <p className="mt-3 text-lg font-black text-slate-700 dark:text-white">
          Congratulations Agent Wiyona!
        </p>
      </div>

      <div className="glass-card reward-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-600 dark:text-amber-200">
              Reward XP Store
            </p>
            <h3 className="mt-2 text-2xl font-black">Choose rewards by XP.</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Check a reward to spend XP. Uncheck it if you need to return the XP.
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-white/65 px-4 py-3 text-right shadow-sm dark:bg-white/10">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
              Balance
            </p>
            <p className="text-3xl font-black text-sky-600 dark:text-sky-200">{rewardXpBalance}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-black">
          <div className="rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/10">
            Earned<br />{earnedXp} XP
          </div>
          <div className="rounded-2xl bg-white/55 px-3 py-2 text-center dark:bg-white/10">
            Spent<br />{spentXp} XP
          </div>
          <div className="rounded-2xl bg-white/55 px-3 py-2 text-right dark:bg-white/10">
            Claimed<br />{claimedRewards.length}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {rewardItems.map((reward) => {
            const claimed = claimedRewards.includes(reward.id);
            const canAfford = rewardXpBalance >= reward.cost;
            const disabled = !claimed && !canAfford;

            return (
              <label
                key={reward.id}
                className={`block rounded-[1.6rem] border p-4 shadow-lg transition-all duration-300 ${
                  claimed
                    ? 'border-emerald-200 bg-emerald-50/85 shadow-emerald-200/30 dark:border-emerald-300/20 dark:bg-emerald-400/15'
                    : disabled
                      ? 'border-white/40 bg-white/25 opacity-60 dark:border-white/10 dark:bg-white/5'
                      : 'border-white/60 bg-white/55 hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={claimed}
                    disabled={disabled}
                    onChange={() => onToggleReward(reward.id)}
                    className="h-6 w-6 shrink-0 accent-pink-400"
                    aria-label={`Claim ${reward.name}`}
                  />
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/65 text-2xl shadow-sm dark:bg-white/10">
                    {reward.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-base font-black leading-tight">{reward.name}</h4>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700 dark:bg-sky-400/15 dark:text-sky-200">
                        {reward.cost} XP
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{reward.note}</p>
                    <p className="mt-2 text-[0.7rem] font-black text-slate-500 dark:text-slate-300">
                      {claimed ? 'Status: claimed · XP spent' : disabled ? `Need ${reward.cost - rewardXpBalance} XP more` : 'Status: available to claim'}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="glass-card text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[2rem] bg-white/65 text-4xl shadow-xl dark:bg-white/10">
          {approvalCopy.icon}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-fuchsia-500 dark:text-fuchsia-200">
          Secret Reward · Agent Wiyona Approval
        </p>
        <h3 className="mt-2 text-2xl font-black">{approvalCopy.title}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
          {approvalCopy.body}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAgentWiyonaApproval('acc')}
            className={`rounded-[1.35rem] px-5 py-3 text-sm font-black shadow-lg transition hover:-translate-y-0.5 ${
              agentWiyonaApproval === 'acc'
                ? 'bg-emerald-500 text-white shadow-emerald-300/40'
                : 'bg-white/60 text-emerald-700 dark:bg-white/10 dark:text-emerald-200'
            }`}
          >
            ACC ✅
          </button>
          <button
            type="button"
            onClick={() => setAgentWiyonaApproval('decline')}
            className={`rounded-[1.35rem] px-5 py-3 text-sm font-black shadow-lg transition hover:-translate-y-0.5 ${
              agentWiyonaApproval === 'decline'
                ? 'bg-rose-500 text-white shadow-rose-300/40'
                : 'bg-white/60 text-rose-700 dark:bg-white/10 dark:text-rose-200'
            }`}
          >
            Decline ❌
          </button>
        </div>

        <label htmlFor="agent-note" className="mt-5 block text-left text-sm font-black">
          Agent Wiyona Note
        </label>
        <textarea
          id="agent-note"
          value={agentWiyonaNote}
          onChange={(event) => setAgentWiyonaNote(event.target.value)}
          className="mission-input mt-2 min-h-28 resize-none text-left"
          placeholder="Example: ACC untuk next trip / main lagi bersama Geo."
        />
      </div>

      <div className="glass-card">
        <h3 className="text-xl font-black">Settings · Mission Control</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Reset mission akan menghapus aktivitas, reward claim, approval, dan progress lokal di browser ini.
        </p>
        <button type="button" onClick={onReset} className="danger-button mt-4 w-full">
          Reset Mission
        </button>
      </div>
    </section>
  );
}

function BottomControls({ page, previousPage, nextPage, missionReady }) {
  const canGoNext = page !== 'reward' && (page !== 'tracker' || missionReady);

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={previousPage}
        disabled={page === 'briefing'}
        className="secondary-button disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={nextPage}
        disabled={!canGoNext}
        className="secondary-button disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[1.4rem] border border-white/60 bg-slate-950/85 px-4 py-3 text-center text-sm font-black text-white shadow-2xl backdrop-blur-xl toast-pop dark:border-white/10">
      {message}
    </div>
  );
}

function ConfettiCanvas({ signal }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!signal) return undefined;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frameId;
    const colors = ['#f9a8d4', '#bae6fd', '#fde68a', '#c4b5fd', '#86efac', '#fda4af'];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 90 }, () => ({
      x: width / 2 + (Math.random() - 0.5) * 120,
      y: height * 0.18 + Math.random() * 80,
      size: 5 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      velocityX: (Math.random() - 0.5) * 8,
      velocityY: -8 - Math.random() * 6,
      gravity: 0.22 + Math.random() * 0.12,
      rotation: Math.random() * Math.PI
    }));

    const startedAt = performance.now();

    const draw = (now) => {
      context.clearRect(0, 0, width, height);
      const elapsed = now - startedAt;

      particles.forEach((particle) => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += particle.gravity;
        particle.rotation += 0.12;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.globalAlpha = Math.max(0, 1 - elapsed / 1600);
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
        context.restore();
      });

      if (elapsed < 1700) {
        frameId = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      context.clearRect(0, 0, width, height);
    };
  }, [signal]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40" aria-hidden="true" />;
}

export default App;
