// 기록 리마인더 — 앱이 열려 있는 동안 설정 시간에 알림
// (서버 푸시 없이 Notification API만 사용하므로 앱이 닫혀 있으면 알림 불가)

export const getReminderTime = () => {
    try { return localStorage.getItem('reminderTime') || ''; } catch (e) { return ''; }
};

export const setReminderTime = (time) => {
    try {
        if (time) localStorage.setItem('reminderTime', time);
        else localStorage.removeItem('reminderTime');
    } catch (e) {}
};

export const notificationsSupported = () =>
    typeof window !== 'undefined' && 'Notification' in window;

export async function ensurePermission() {
    if (!notificationsSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
}

const localDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

// 설정 시간이 지났고 오늘 아직 안 울렸으면 알림 (오늘 기록이 있으면 조용히 소진)
export function checkAndFireReminder(hasRecordToday) {
    const time = getReminderTime();
    if (!time || !notificationsSupported() || Notification.permission !== 'granted') return;
    const today = localDateKey();
    try {
        if (localStorage.getItem('reminderLastFired') === today) return;
    } catch (e) { return; }

    const [hh, mm] = time.split(':').map(Number);
    const now = new Date();
    if (now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm)) {
        if (!hasRecordToday) {
            try {
                new Notification('Emoscape', {
                    body: '오늘의 감정을 아직 기록하지 않았어요. 지금 떠오르는 감정을 남겨보세요 🌱',
                    icon: '/pwa-192x192.png',
                    tag: 'emoscape-daily-reminder'
                });
            } catch (e) {}
        }
        try { localStorage.setItem('reminderLastFired', today); } catch (e) {}
    }
}
