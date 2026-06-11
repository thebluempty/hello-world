// 인사이트 통계 계산 (로컬 시간 기준)

const dayKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
};

// 연속 기록 일수 — 오늘 기록이 없어도 어제까지 이어졌으면 스트릭 유지
export function calcStreak(records) {
    if (!records.length) return 0;
    const days = new Set(records.map(r => dayKey(r.timestamp)));
    const cur = new Date();
    if (!days.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
    let streak = 0;
    while (days.has(dayKey(cur))) {
        streak++;
        cur.setDate(cur.getDate() - 1);
    }
    return streak;
}

export function recordedDayCount(records) {
    return new Set(records.map(r => dayKey(r.timestamp))).size;
}

// 최근 days일 요약 (offsetDays만큼 과거로 이동 → 지난주 비교용)
export function periodSummary(records, days, offsetDays = 0) {
    const end = new Date();
    end.setDate(end.getDate() - offsetDays);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const recs = records.filter(r => {
        const t = new Date(r.timestamp);
        return t >= start && t <= end;
    });
    const counts = {};
    let sum = 0, n = 0;
    recs.forEach(r => r.emotions.forEach(e => {
        counts[e.name] = (counts[e.name] || 0) + 1;
        sum += e.intensity;
        n++;
    }));
    const topEmotions = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));
    return {
        count: recs.length,
        avgIntensity: n ? sum / n : 0,
        topEmotions,
        recordedDays: new Set(recs.map(r => dayKey(r.timestamp))).size
    };
}

// 감정 × 장소 상관 패턴 (2회 이상 반복된 조합만)
export function emotionLocationPatterns(records, limit = 3) {
    const pairs = {};
    records.forEach(r => {
        const loc = r.location && r.location.value;
        if (!loc) return;
        r.emotions.forEach(e => {
            const k = `${e.name}|${loc}`;
            pairs[k] = (pairs[k] || 0) + 1;
        });
    });
    return Object.entries(pairs)
        .filter(([, c]) => c >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k, count]) => {
            const [emotion, location] = k.split('|');
            return { emotion, location, count };
        });
}

// 시간대별 기록 분포 + 평균 강도
export function timeOfDayPattern(records) {
    const buckets = [
        { label: '아침', icon: '🌅', from: 5, to: 11 },
        { label: '낮', icon: '☀️', from: 11, to: 17 },
        { label: '저녁', icon: '🌆', from: 17, to: 22 },
        { label: '밤', icon: '🌙', from: 22, to: 5 }
    ].map(b => ({ ...b, count: 0, sum: 0, n: 0 }));

    records.forEach(r => {
        const h = new Date(r.timestamp).getHours();
        const b = buckets.find(b =>
            b.from < b.to ? (h >= b.from && h < b.to) : (h >= b.from || h < b.to)
        );
        if (!b) return;
        b.count++;
        r.emotions.forEach(e => { b.sum += e.intensity; b.n++; });
    });
    return buckets.map(b => ({
        label: b.label,
        icon: b.icon,
        count: b.count,
        avg: b.n ? b.sum / b.n : 0
    }));
}
