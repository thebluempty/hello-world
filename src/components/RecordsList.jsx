import { useState } from 'react';
import { emotionColors } from '../constants.js';

export default function RecordsList({ records, loading, onDelete, onEdit, onGoToRecord }) {
    const [filterEmotion, setFilterEmotion] = useState('all');
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterBody, setFilterBody] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    // 첫 동기화 로딩 중이면 스켈레톤 표시
    if (records.length === 0 && loading) {
        return (
            <div className="records-list" aria-busy="true" aria-label="기록 불러오는 중">
                {[0, 1, 2].map(i => (
                    <div key={i} className="skeleton-card">
                        <div className="skeleton-line w40"></div>
                        <div className="skeleton-line w90"></div>
                        <div className="skeleton-line w70"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-title">아직 기록이 없습니다</div>
                <div className="empty-sub">오늘의 감정을 남기는 것부터 시작해보세요.</div>
                <button className="empty-cta" onClick={onGoToRecord}>지금 기록하기</button>
            </div>
        );
    }

    // 모든 고유 값 추출
    const allEmotions = [...new Set(records.flatMap(r => r.emotions.map(e => e.name)))];
    const allLocations = [...new Set(records.map(r => r.location.value))];
    const allBodyAreas = [...new Set(records.flatMap(r => r.bodySensations.map(s => s.area)))];

    // 필터링 로직
    const filteredRecords = records.filter(record => {
        // 감정 필터
        if (filterEmotion !== 'all' && !record.emotions.some(e => e.name === filterEmotion)) {
            return false;
        }

        // 장소 필터
        if (filterLocation !== 'all' && record.location.value !== filterLocation) {
            return false;
        }

        // 신체 부위 필터
        if (filterBody !== 'all' && !record.bodySensations.some(s => s.area === filterBody)) {
            return false;
        }

        // 날짜 범위 필터
        const recordDate = new Date(record.timestamp);
        if (dateFrom && new Date(dateFrom) > recordDate) {
            return false;
        }
        if (dateTo && new Date(dateTo + 'T23:59:59') < recordDate) {
            return false;
        }

        // 텍스트 검색
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            const matchesEmotion = record.emotions.some(e => e.name.toLowerCase().includes(searchLower));
            const matchesLocation = record.location.value.toLowerCase().includes(searchLower);
            const matchesBody = record.bodySensations.some(s =>
                s.area.toLowerCase().includes(searchLower) ||
                s.sensationType.toLowerCase().includes(searchLower) ||
                (s.description && s.description.toLowerCase().includes(searchLower))
            );
            const matchesCustom = record.customCategories &&
                Object.entries(record.customCategories).some(([key, value]) =>
                    key.toLowerCase().includes(searchLower) ||
                    (value && value.toString().toLowerCase().includes(searchLower))
                );
            const matchesMemo = record.memo && record.memo.toLowerCase().includes(searchLower);

            if (!matchesEmotion && !matchesLocation && !matchesBody && !matchesCustom && !matchesMemo) {
                return false;
            }
        }

        return true;
    });

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const tA = new Date(a.timestamp), tB = new Date(b.timestamp);
        return sortOrder === 'newest' ? tB - tA : tA - tB;
    });

    return (
        <div>
            {/* 필터 UI */}
            <div style={{
                background: 'var(--surface-2)',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '20px'
            }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>필터 및 검색</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {/* 검색 */}
                    <div className="input-group">
                        <label>검색</label>
                        <input
                            type="text"
                            placeholder="감정, 장소, 신체 부위..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    {/* 감정 필터 */}
                    <div className="input-group">
                        <label>감정</label>
                        <select value={filterEmotion} onChange={(e) => setFilterEmotion(e.target.value)}>
                            <option value="all">전체</option>
                            {allEmotions.map(emotion => (
                                <option key={emotion} value={emotion}>{emotion}</option>
                            ))}
                        </select>
                    </div>

                    {/* 장소 필터 */}
                    <div className="input-group">
                        <label>장소</label>
                        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                            <option value="all">전체</option>
                            {allLocations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>

                    {/* 신체 부위 필터 */}
                    <div className="input-group">
                        <label>신체 부위</label>
                        <select value={filterBody} onChange={(e) => setFilterBody(e.target.value)}>
                            <option value="all">전체</option>
                            {allBodyAreas.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>

                    {/* 시작 날짜 */}
                    <div className="input-group">
                        <label>시작 날짜</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    {/* 종료 날짜 */}
                    <div className="input-group">
                        <label>종료 날짜</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                {/* 필터 초기화 버튼 */}
                <button
                    className="add-custom-button"
                    style={{ marginTop: '15px', width: 'auto' }}
                    onClick={() => {
                        setFilterEmotion('all');
                        setFilterLocation('all');
                        setFilterBody('all');
                        setSearchText('');
                        setDateFrom('');
                        setDateTo('');
                    }}
                >
                    필터 초기화
                </button>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {filteredRecords.length}개 / {records.length}개 기록
                    </span>
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        style={{
                            padding: '5px 12px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: 'var(--text-soft)'
                        }}
                    >
                        {sortOrder === 'newest' ? '최신순 ↓' : '오래된순 ↑'}
                    </button>
                </div>
            </div>

            {/* 기록 목록 */}
            {sortedRecords.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">필터 조건에 맞는 기록이 없습니다</div>
                    <div className="empty-sub">필터를 초기화하거나 검색어를 바꿔보세요.</div>
                </div>
            ) : (
                <div className="records-list">
                    {sortedRecords.map(record => (
                        <div key={record.id} className="record-card">
                            <div className="record-header">
                                <div className="record-time">
                                    {new Date(record.timestamp).toLocaleString('ko-KR')}
                                </div>
                                <div className="record-actions">
                                    <button className="action-button" onClick={() => onEdit(record)} style={{ marginRight: '8px' }}>
                                        수정
                                    </button>
                                    <button className="action-button" onClick={() => onDelete(record.id)}>
                                        삭제
                                    </button>
                                </div>
                            </div>
                            <div className="record-emotions">
                                {record.emotions.map((emotion, i) => (
                                    <span
                                        key={i}
                                        className="emotion-tag"
                                        style={{ background: emotionColors[emotion.name] || 'var(--surface-hover)' }}
                                    >
                                        {emotion.name} ({emotion.intensity})
                                    </span>
                                ))}
                            </div>
                            <div style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                                📍 {record.location.value}
                            </div>
                            {record.bodySensations.length > 0 && (
                                <div style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                                    🫀 {record.bodySensations.map(s => `${s.area}(${s.sensationType})`).join(', ')}
                                </div>
                            )}
                            {record.memo && (
                                <div style={{ marginTop: '10px', color: 'var(--text-soft)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                    📝 {record.memo}
                                </div>
                            )}
                            {record.customCategories && Object.keys(record.customCategories).length > 0 && (
                                <div style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {Object.entries(record.customCategories).map(([key, value]) => (
                                        <div key={key}>
                                            <strong>{key}</strong>: {value}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
