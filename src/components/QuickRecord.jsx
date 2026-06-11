import { useState, useRef } from 'react';
import { predefinedEmotions, emotionColors } from '../constants.js';

// 원탭 빠른 기록 — 감정을 탭하면 강도 5로 즉시 저장
export default function QuickRecord({ onQuickSave }) {
    const [savedEmotion, setSavedEmotion] = useState('');
    const timerRef = useRef(null);

    const handleTap = (name) => {
        onQuickSave(name);
        setSavedEmotion(name);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSavedEmotion(''), 900);
    };

    return (
        <div className="quick-record">
            <div className="quick-record-title">
                ⚡ 빠른 기록
                <span className="quick-record-sub">감정을 탭하면 바로 저장됩니다 (강도 5)</span>
            </div>
            <div className="quick-chips">
                {predefinedEmotions.map(name => (
                    <button
                        key={name}
                        className={`quick-chip${savedEmotion === name ? ' saved' : ''}`}
                        style={savedEmotion === name ? undefined : { borderColor: emotionColors[name] }}
                        onClick={() => handleTap(name)}
                    >
                        {savedEmotion === name ? '✓ 저장됨' : name}
                    </button>
                ))}
            </div>
        </div>
    );
}
