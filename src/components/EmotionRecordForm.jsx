import { useState } from 'react';
import { getLocalDatetimeString } from '../lib/datetime.js';
import { predefinedEmotions, emotionColors, sensationTypes, locationCategories } from '../constants.js';
import { hiddenKeywords } from '../lib/hidden.js';
import { useDialog } from './Dialog.jsx';

export default function EmotionRecordForm({ onSave, initialRecord, onCancel, hiddenModeActive, toggleHiddenMode }) {
    const { confirmDialog, promptDialog } = useDialog();
    const isEditing = !!initialRecord;

    // 감정명이 히든 키워드를 포함하는지 체크
    const isHiddenEmotion = (emotionName) => {
        const lowerName = emotionName.toLowerCase();
        return Object.values(hiddenKeywords).some(keywords =>
            keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))
        );
    };
    const [selectedEmotions, setSelectedEmotions] = useState(() =>
        isEditing ? initialRecord.emotions.map(e => e.name) : []
    );
    const [customEmotions, setCustomEmotions] = useState(() => {
        try {
            const saved = localStorage.getItem('customEmotions');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [emotionIntensities, setEmotionIntensities] = useState(() =>
        isEditing ? Object.fromEntries(initialRecord.emotions.map(e => [e.name, e.intensity])) : {}
    );
    const [bodySensations, setBodySensations] = useState(() =>
        isEditing ? initialRecord.bodySensations : []
    );
    const [timestamp, setTimestamp] = useState(() =>
        isEditing
            ? new Date(new Date(initialRecord.timestamp) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
            : getLocalDatetimeString()
    );
    const [locationValue, setLocationValue] = useState(() =>
        isEditing ? initialRecord.location.value : '집'
    );
    const [customCategories, setCustomCategories] = useState(() =>
        isEditing ? (initialRecord.customCategories || {}) : {}
    );
    const [sensationModal, setSensationModal] = useState(null);
    const [sensationModalType, setSensationModalType] = useState('');
    const [sensationModalDesc, setSensationModalDesc] = useState('');
    const [saveError, setSaveError] = useState('');
    const [memo, setMemo] = useState(() =>
        isEditing ? (initialRecord.memo || '') : ''
    );

    // 히든 모드가 비활성일 때는 히든 키워드가 포함된 커스텀 감정 숨김
    const visibleCustomEmotions = hiddenModeActive
        ? customEmotions
        : customEmotions.filter(e => !isHiddenEmotion(e));

    const allEmotions = [...predefinedEmotions, ...visibleCustomEmotions];

    const toggleEmotion = (emotion) => {
        if (selectedEmotions.includes(emotion)) {
            setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
            const newIntensities = { ...emotionIntensities };
            delete newIntensities[emotion];
            setEmotionIntensities(newIntensities);
        } else {
            setSelectedEmotions([...selectedEmotions, emotion]);
            setEmotionIntensities({ ...emotionIntensities, [emotion]: 5 });
        }
    };

    const addCustomEmotion = async () => {
        const emotion = await promptDialog({
            title: '새 감정 추가',
            message: '나만의 감정 이름을 입력하세요.',
            placeholder: '예: 뿌듯함, 그리움',
            confirmText: '추가'
        });
        if (emotion && emotion.trim() && !allEmotions.includes(emotion.trim())) {
            const updated = [...customEmotions, emotion.trim()];
            setCustomEmotions(updated);
            try { localStorage.setItem('customEmotions', JSON.stringify(updated)); } catch(e) {}
        }
    };

    const removeCustomEmotion = async (emotion) => {
        const ok = await confirmDialog({
            title: '감정 삭제',
            message: `"${emotion}" 감정을 삭제하시겠습니까?`,
            confirmText: '삭제',
            danger: true
        });
        if (ok) {
            const updated = customEmotions.filter(e => e !== emotion);
            setCustomEmotions(updated);
            // 선택된 감정에서도 제거
            if (selectedEmotions.includes(emotion)) {
                setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
                const newIntensities = { ...emotionIntensities };
                delete newIntensities[emotion];
                setEmotionIntensities(newIntensities);
            }
            try { localStorage.setItem('customEmotions', JSON.stringify(updated)); } catch(e) {}
        }
    };

    const removeSensation = (index) => {
        setBodySensations(bodySensations.filter((_, i) => i !== index));
    };

    const bodyBtnClass = (part) =>
        `body-part-button${bodySensations.some(s => s.area === part) ? ' has-sensation' : ''}`;

    // 부위 클릭 핸들러
    const handlePartClick = (partName) => {
        setSensationModal({ partName });
        setSensationModalType('');
        setSensationModalDesc('');
    };

    const handleSensationConfirm = () => {
        if (!sensationModalType) return;
        setBodySensations([...bodySensations, {
            area: sensationModal.partName,
            sensationType: sensationModalType,
            description: sensationModalDesc
        }]);
        setSensationModal(null);
    };

    const handleSave = () => {
        if (selectedEmotions.length === 0) {
            setSaveError('감정을 최소 하나 선택해 주세요.');
            return;
        }
        setSaveError('');
        const record = {
            id: isEditing ? initialRecord.id : Date.now().toString(),
            timestamp: new Date(timestamp).toISOString(),
            location: {
                type: 'category',
                value: locationValue
            },
            emotions: selectedEmotions.map(name => ({
                name,
                intensity: emotionIntensities[name]
            })),
            bodySensations,
            customCategories,
            memo
        };

        onSave(record);

        // 초기화
        setSelectedEmotions([]);
        setEmotionIntensities({});
        setBodySensations([]);
        setTimestamp(getLocalDatetimeString());
        setMemo('');
        setLocationValue('집');
        setCustomCategories({});
        setSensationModal(null);
    };

    return (
        <div className="emotion-form">
            {/* 히든 모드 토글 버튼 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '12px 16px',
                background: hiddenModeActive ? 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)' : 'var(--surface-2)',
                borderRadius: '12px',
                border: hiddenModeActive ? '2px solid #ffd700' : '2px solid var(--border)',
                transition: 'all 0.3s'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: hiddenModeActive ? '#ffd700' : 'var(--text-soft)'
                    }}>
                        {hiddenModeActive ? '✨ 확장 모드' : '📝 기본 모드'}
                    </span>
                    <span style={{
                        fontSize: '0.85rem',
                        color: hiddenModeActive ? '#b8a7e8' : 'var(--text-muted)'
                    }}>
                        {hiddenModeActive ? '숨은 감정들이 표시됩니다' : '기본 감정만 표시됩니다'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={toggleHiddenMode}
                    style={{
                        padding: '8px 16px',
                        background: hiddenModeActive ? '#ffd700' : '#667eea',
                        color: hiddenModeActive ? '#1a1a2e' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    {hiddenModeActive ? '기본 모드로' : '확장 모드로'}
                </button>
            </div>

            <div className="form-section">
                <h3>감정 선택</h3>
                <div className="emotion-grid">
                    {allEmotions.map(emotion => (
                        <div
                            key={emotion}
                            className={`emotion-chip ${selectedEmotions.includes(emotion) ? 'selected' : ''}`}
                            onClick={() => toggleEmotion(emotion)}
                            style={{
                                ...(selectedEmotions.includes(emotion)
                                    ? { background: emotionColors[emotion] || '#667eea', borderColor: emotionColors[emotion] || '#667eea', color: 'white' }
                                    : { borderColor: emotionColors[emotion] || '#667eea', color: emotionColors[emotion] || '#667eea' }),
                                position: 'relative',
                                paddingRight: customEmotions.includes(emotion) ? '32px' : '20px'
                            }}
                        >
                            {emotion}
                            {customEmotions.includes(emotion) && (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeCustomEmotion(emotion);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        opacity: 0.7
                                    }}
                                >
                                    ×
                                </span>
                            )}
                        </div>
                    ))}
                    <button className="add-custom-button" onClick={addCustomEmotion}>
                        + 감정 추가
                    </button>
                </div>

                {selectedEmotions.map(emotion => {
                    const intensity = emotionIntensities[emotion] || 5;
                    const getIntensityColor = (val) => {
                        if (val <= 3) return '#90EE90';
                        if (val <= 6) return '#FFB347';
                        return '#FF6B6B';
                    };
                    return (
                        <div key={emotion} className="intensity-slider">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ margin: 0 }}>{emotion} 강도</label>
                                <span style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: getIntensityColor(intensity),
                                    minWidth: '45px',
                                    textAlign: 'right'
                                }}>
                                    {intensity} / 10
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={intensity}
                                onChange={(e) => setEmotionIntensities({
                                    ...emotionIntensities,
                                    [emotion]: parseInt(e.target.value)
                                })}
                                style={{
                                    background: `linear-gradient(90deg, ${getIntensityColor(intensity)} 0%, ${getIntensityColor(intensity)} ${intensity * 10}%, #e9ecef ${intensity * 10}%, #e9ecef 100%)`
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="form-section">
                <h3 style={{ marginBottom: '15px' }}>신체 감각</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 70px)',
                        gridTemplateRows: 'repeat(13, 44px)',
                        gap: '6px',
                        alignItems: 'center',
                        justifyItems: 'center',
                        padding: '15px',
                        background: 'var(--surface-2)',
                        borderRadius: '15px'
                    }}>
                        {/* Row 1: Head */}
                        <div></div>
                        <button onClick={() => handlePartClick('머리')} className={bodyBtnClass('머리')}>머리</button>
                        <div></div>

                        {/* Row 2: Neck */}
                        <div></div>
                        <button onClick={() => handlePartClick('목')} className={bodyBtnClass('목')}>목</button>
                        <div></div>

                        {/* Row 3: Shoulders */}
                        <button onClick={() => handlePartClick('왼어깨')} className={bodyBtnClass('왼어깨')}>왼어깨</button>
                        <div></div>
                        <button onClick={() => handlePartClick('오른어깨')} className={bodyBtnClass('오른어깨')}>오른어깨</button>

                        {/* Row 4-5: Upper arms and chest (2 rows) */}
                        <button onClick={() => handlePartClick('왼팔뚝')} className={bodyBtnClass('왼팔뚝')}>왼팔뚝</button>
                        <button onClick={() => handlePartClick('가슴')} className={bodyBtnClass('가슴')} style={{ gridRow: 'span 2', height: '94px' }}>가슴</button>
                        <button onClick={() => handlePartClick('오른팔뚝')} className={bodyBtnClass('오른팔뚝')}>오른팔뚝</button>

                        {/* Row 5: Continue upper arms */}
                        <button onClick={() => handlePartClick('왼팔목')} className={bodyBtnClass('왼팔목')}>왼팔목</button>
                        {/* 가슴이 여기 차지 */}
                        <button onClick={() => handlePartClick('오른팔목')} className={bodyBtnClass('오른팔목')}>오른팔목</button>

                        {/* Row 6-7: Forearms and belly (2 rows) */}
                        <button onClick={() => handlePartClick('왼손')} className={bodyBtnClass('왼손')}>왼손</button>
                        <button onClick={() => handlePartClick('배')} className={bodyBtnClass('배')} style={{ gridRow: 'span 2', height: '94px' }}>배</button>
                        <button onClick={() => handlePartClick('오른손')} className={bodyBtnClass('오른손')}>오른손</button>

                        {/* Row 7: Continue forearms */}
                        <div></div>
                        {/* 배가 여기 차지 */}
                        <div></div>

                        {/* Row 8: Hips */}
                        <div></div>
                        <button onClick={() => handlePartClick('골반')} className={bodyBtnClass('골반')}>골반</button>
                        <div></div>

                        {/* Row 9-10: Upper legs (separated) */}
                        <button onClick={() => handlePartClick('왼허벅지')} className={bodyBtnClass('왼허벅지')} style={{ gridRow: 'span 2', height: '94px' }}>왼허벅지</button>
                        <div></div>
                        <button onClick={() => handlePartClick('오른허벅지')} className={bodyBtnClass('오른허벅지')} style={{ gridRow: 'span 2', height: '94px' }}>오른허벅지</button>

                        {/* Row 10: Continue upper legs */}
                        {/* 왼허벅지가 여기 차지 */}
                        <div></div>
                        {/* 오른허벅지가 여기 차지 */}

                        {/* Row 11-12: Lower legs (separated) */}
                        <button onClick={() => handlePartClick('왼종아리')} className={bodyBtnClass('왼종아리')} style={{ gridRow: 'span 2', height: '94px' }}>왼종아리</button>
                        <div></div>
                        <button onClick={() => handlePartClick('오른종아리')} className={bodyBtnClass('오른종아리')} style={{ gridRow: 'span 2', height: '94px' }}>오른종아리</button>

                        {/* Row 12: Continue lower legs */}
                        {/* 왼종아리가 여기 차지 */}
                        <div></div>
                        {/* 오른종아리가 여기 차지 */}

                        {/* Row 13: Feet */}
                        <button onClick={() => handlePartClick('왼발')} className={bodyBtnClass('왼발')}>왼발</button>
                        <div></div>
                        <button onClick={() => handlePartClick('오른발')} className={bodyBtnClass('오른발')}>오른발</button>
                    </div>
                    <div className="sensation-list">
                        <h4>기록된 감각</h4>
                        {bodySensations.map((sensation, index) => (
                            <div key={index} className="sensation-item">
                                <strong>{sensation.area}</strong>
                                <br/>
                                {sensation.sensationType}
                                {sensation.description && <div style={{ marginTop: '5px', color: 'var(--text-muted)' }}>{sensation.description}</div>}
                                <button
                                    onClick={() => removeSensation(index)}
                                    style={{
                                        marginTop: '5px',
                                        padding: '8px 14px',
                                        minHeight: '44px',
                                        fontSize: '0.9rem',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                {sensationModal && (
                    <div style={{
                        marginTop: '15px',
                        padding: '15px',
                        background: 'var(--accent-soft)',
                        border: '2px solid #667eea',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontWeight: '700', marginBottom: '10px', color: 'var(--accent-strong)' }}>
                            {sensationModal.partName} - 감각 입력
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-soft)' }}>감각 타입 선택:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {sensationTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSensationModalType(type)}
                                        style={{
                                            padding: '10px 16px',
                                            minHeight: '44px',
                                            border: '2px solid #667eea',
                                            borderRadius: '20px',
                                            background: sensationModalType === type ? '#667eea' : 'white',
                                            color: sensationModalType === type ? 'white' : '#667eea',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}
                                    >{type}</button>
                                ))}
                            </div>
                        </div>
                        <input
                            placeholder="설명 (선택)"
                            value={sensationModalDesc}
                            onChange={e => setSensationModalDesc(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ced4da',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                fontSize: '0.9rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleSensationConfirm}
                                disabled={!sensationModalType}
                                style={{
                                    padding: '12px 24px',
                                    minHeight: '44px',
                                    background: sensationModalType ? 'var(--accent)' : 'var(--text-muted)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: sensationModalType ? 'pointer' : 'default',
                                    fontWeight: '600'
                                }}
                            >추가</button>
                            <button
                                onClick={() => setSensationModal(null)}
                                style={{
                                    padding: '12px 24px',
                                    minHeight: '44px',
                                    background: 'var(--surface)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid #ced4da',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >취소</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="form-section">
                <h3>시간 및 장소</h3>
                <div className="input-group">
                    <label>시간</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="datetime-local"
                            value={timestamp}
                            onChange={(e) => setTimestamp(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setTimestamp(getLocalDatetimeString())}
                            style={{
                                padding: '10px 14px',
                                minHeight: '44px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >지금</button>
                    </div>
                </div>
                <div className="input-group">
                    <label>장소</label>
                    <select value={locationValue} onChange={(e) => setLocationValue(e.target.value)}>
                        {locationCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-section">
                <h3>추가 카테고리 (선택)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    자유롭게 카테고리를 추가하여 더 깊은 기록을 남겨보세요
                </p>
                {Object.entries(customCategories).map(([key, value], index) => (
                    <div key={index} className="input-group" style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                placeholder="카테고리 이름"
                                value={key}
                                onChange={(e) => {
                                    const newCategories = { ...customCategories };
                                    delete newCategories[key];
                                    newCategories[e.target.value] = value;
                                    setCustomCategories(newCategories);
                                }}
                                style={{ flex: 1 }}
                            />
                            <input
                                placeholder="값"
                                value={value}
                                onChange={(e) => setCustomCategories({
                                    ...customCategories,
                                    [key]: e.target.value
                                })}
                                style={{ flex: 2 }}
                            />
                            <button
                                className="action-button"
                                onClick={() => {
                                    const newCategories = { ...customCategories };
                                    delete newCategories[key];
                                    setCustomCategories(newCategories);
                                }}
                            >
                                ❌
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    className="add-custom-button"
                    onClick={() => setCustomCategories({ ...customCategories, '': '' })}
                >
                    + 카테고리 추가
                </button>
            </div>

            <div className="form-section">
                <h3>메모 (선택)</h3>
                <textarea
                    placeholder="이 감정에 대해 자유롭게 기록하세요..."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px 14px',
                        border: '1px solid #ced4da',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                    }}
                />
            </div>

            {saveError && (
                <div style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '10px', fontWeight: '600' }}>
                    {saveError}
                </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="save-button" onClick={handleSave} style={{ flex: 1 }}>
                    {isEditing ? '수정 완료' : '저장하기'}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '14px', fontSize: '1rem', borderRadius: '12px' }}
                    >
                        취소
                    </button>
                )}
            </div>
        </div>
    );
}
