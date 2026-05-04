import { useEffect, useMemo, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISSED_KEY = 'kvartal_install_prompt_dismissed';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const ios = useMemo(isIos, []);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) === 'true') return;

    const showTimer = window.setTimeout(() => setVisible(true), 1200);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  if (!visible || isStandalone()) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[60] sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-100 p-2 text-primary-700">
            {ios ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900">Установить Квартал</div>
            <p className="mt-1 text-sm text-gray-500">
              {ios
                ? 'В Safari нажмите «Поделиться», затем «На экран Домой».'
                : 'Добавьте приложение на главный экран и открывайте его без браузерной панели.'}
            </p>
          </div>
          <button onClick={dismiss} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>
        {!ios && installEvent && (
          <button onClick={install} className="btn-primary mt-4 w-full py-3">
            Установить
          </button>
        )}
      </div>
    </div>
  );
}
