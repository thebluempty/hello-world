import { emotionColors } from '../constants.js';
import {
    calcStreak, recordedDayCount, periodSummary,
    emotionLocationPatterns, timeOfDayPattern
} from '../lib/insights.js';

// 증감 표시 (감정 데이터라 좋다/나쁘다 색상 판단 없이 중립 표기)
function Delta({ cur, prev, digits = 0 }) {
    const diff = cur - prev;
    if (Math.abs(diff) < Math.pow(10, -digits) / 2) return <span className="delta">지난주와 동일</span>;
    const txt = digits ? Math.abs(diff).toFixed(digits) : Math.abs(diff);
    return <span className="delta">{diff > 0 ? '▲' : '▼'} {txt} (지난주 대비)</span>;
}

export default function InsightsView({ records, onGoToRecord }) {
    if (records.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">💡</div>
                <div className="empty-title">아직 인사이트가 없습니다</div>
                <div className="empty-sub">감정을 기록하면 패턴과 변화를 분석해드립니다.</div>
                <button className="empty-cta" onClick={onGoToRecord}>지금 기록하기</button>
            </div>
        );
    }

    const streak = calcStreak(records);
    const totalDays = recordedDayCount(records);
    const thisWeek = periodSummary(records, 7);
    const lastWeek = periodSummary(records, 7, 7);
    const patterns = emotionLocationPatterns(records);
    const tod = timeOfDayPattern(records);
    const maxTod = Math.max(1, ...tod.map(t => t.count));
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="insights">
            {/* 통계 카드 */}
            <div className="insight-stats">
                <div className="stat-card">
                    <div className="stat-value">🔥 {streak}</div>
                    <div className="stat-label">연속 기록 (일)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{records.length}</div>
                    <div className="stat-label">전체 기록</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalDays}</div>
                    <div className="stat-label">기록한 날</div>
                </div>
            </div>

            {/* 최근 7일 vs 지난 7일 */}
            <div className="insight-card">
                <h3>📅 최근 7일</h3>
                <div className="insight-row">
                    <span>기록 횟수</span>
                    <span><strong>{thisWeek.count}건</strong> <Delta cur={thisWeek.count} prev={lastWeek.count} /></span>
                </div>
                <div className="insight-row">
                    <span>평균 감정 강도</span>
                    <span>
                        <strong>{thisWeek.count ? thisWeek.avgIntensity.toFixed(1) : '-'}</strong>
                        {thisWeek.count > 0 && lastWeek.count > 0 &&
                            <Delta cur={thisWeek.avgIntensity} prev={lastWeek.avgIntensity} digits={1} />}
                    </span>
                </div>
                <div className="insight-row">
                    <span>기록한 날</span>
                    <span><strong>{thisWeek.recordedDays}일 / 7일</strong></span>
                </div>
                {thisWeek.topEmotions.length > 0 && (
                    <div className="insight-top-emotions">
                        {thisWeek.topEmotions.map((e, i) => (
                            <span key={e.name} className="emotion-tag" style={{
                                background: emotionColors[e.name] || 'var(--surface-hover)',
                                color: emotionColors[e.name] ? 'white' : 'var(--text)'
                            }}>
                                {medals[i]} {e.name} ×{e.count}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* 감정 × 장소 패턴 */}
            {patterns.length > 0 && (
                <div className="insight-card">
                    <h3>🧭 감정 × 장소 패턴</h3>
                    {patterns.map(p => (
                        <div key={`${p.emotion}-${p.location}`} className="insight-row">
                            <span>
                                <span className="emotion-tag" style={{
                                    background: emotionColors[p.emotion] || 'var(--surface-hover)',
                                    color: emotionColors[p.emotion] ? 'white' : 'var(--text)'
                                }}>{p.emotion}</span>
                                {' '}은(는) 주로 <strong>{p.location}</strong>에서
                            </span>
                            <span className="insight-count">{p.count}회</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 시간대 분포 */}
            <div className="insight-card">
                <h3>🕐 시간대별 기록 분포</h3>
                {tod.map(t => (
                    <div key={t.label} className="tod-row">
                        <span className="tod-label">{t.icon} {t.label}</span>
                        <div className="tod-bar-wrap">
                            <div className="tod-bar" style={{ width: `${(t.count / maxTod) * 100}%` }}></div>
                        </div>
                        <span className="tod-count">
                            {t.count}건{t.count > 0 ? ` · 강도 ${t.avg.toFixed(1)}` : ''}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
