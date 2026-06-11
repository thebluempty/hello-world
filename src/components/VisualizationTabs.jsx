import { useState } from 'react';
import LocationVisualization from './LocationVisualization.jsx';
import BodyHeatmap from './BodyHeatmap.jsx';
import LightFlowBody from './LightFlowBody.jsx';
import SineWaveVisualization from './SineWaveVisualization.jsx';
import CalendarHeatmap from './CalendarHeatmap.jsx';

export default function VisualizationTabs({ records, onGoToRecord, hiddenModesDetected }) {
    const [vizType, setVizType] = useState('time');
    const [bodyVizMode, setBodyVizMode] = useState('heatmap');

    if (records.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '50px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                <div style={{ fontSize: '1.1rem', marginBottom: '20px' }}>기록이 있어야 시각화를 볼 수 있습니다.</div>
                <button
                    onClick={onGoToRecord}
                    style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600'
                    }}
                >
                    지금 기록하기
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="viz-tab-buttons">
                {[
                    ['time', '⏰ 강도 흐름'],
                    ['location', '📍 장소'],
                    ['body', '🫀 신체'],
                    ['calendar', '📅 달력'],
                ].map(([val, label]) => (
                    <button key={val}
                        className={`viz-tab-btn ${vizType === val ? 'active' : ''}`}
                        onClick={() => setVizType(val)}
                    >{label}</button>
                ))}
            </div>

            {/* 신체 탭일 때만 하위 전환 버튼 표시 */}
            {vizType === 'body' && (
                <div className="viz-tab-buttons" style={{ marginTop: '15px' }}>
                    <button
                        className={`viz-tab-btn ${bodyVizMode === 'heatmap' ? 'active' : ''}`}
                        onClick={() => setBodyVizMode('heatmap')}
                    >
                        📊 히트맵
                    </button>
                    <button
                        className={`viz-tab-btn ${bodyVizMode === 'lightflow' ? 'active' : ''}`}
                        onClick={() => setBodyVizMode('lightflow')}
                    >
                        {hiddenModesDetected.size > 0 ? '✨ 통합 흐름' : '💫 빛의 흐름'}
                    </button>
                </div>
            )}

            {vizType === 'time' && <SineWaveVisualization records={records} />}
            {vizType === 'location' && <LocationVisualization records={records} />}
            {vizType === 'body' && bodyVizMode === 'heatmap' && <BodyHeatmap records={records} />}
            {vizType === 'body' && bodyVizMode === 'lightflow' && <LightFlowBody records={records} hiddenModesDetected={hiddenModesDetected} />}
            {vizType === 'calendar' && <CalendarHeatmap records={records} />}
        </div>
    );
}
