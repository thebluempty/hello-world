import React, { useState, useEffect, useRef } from 'react';
import { Storage } from './lib/storage.js';
import { GistSync } from './lib/gistSync.js';
import { detectHiddenCategories } from './lib/hidden.js';
import { importFromJSON, exportToJSON, exportToCSV } from './lib/exportImport.js';
import { THEME_MODES, getThemeMode, setThemeMode, applyTheme } from './lib/theme.js';
import { useDialog } from './components/Dialog.jsx';
import EmotionRecordForm from './components/EmotionRecordForm.jsx';
import RecordsList from './components/RecordsList.jsx';
import VisualizationTabs from './components/VisualizationTabs.jsx';

const TABS = [
    { id: 'record', icon: '📝', label: '기록하기' },
    { id: 'list', icon: '📋', label: '기록 목록' },
    { id: 'visualize', icon: '📊', label: '시각화' }
];

export default function App() {
    const { confirmDialog, alertDialog } = useDialog();
    const [activeTab, setActiveTab] = useState('record');
    const [records, setRecords] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);
    const [hiddenModesDetected, setHiddenModesDetected] = useState(new Set());
    const [hiddenModeActive, setHiddenModeActive] = useState(() => {
        try {
            const saved = localStorage.getItem('hiddenModeActive');
            return saved ? JSON.parse(saved) : false;
        } catch(e) {
            return false;
        }
    });
    const [toast, setToast] = useState('');
    const toastTimerRef = useRef(null);

    // 테마 (system/light/dark 순환)
    const [themeMode, setThemeModeState] = useState(getThemeMode);

    useEffect(() => {
        applyTheme(themeMode);
        if (themeMode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyTheme('system');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [themeMode]);

    const cycleTheme = () => {
        const next = THEME_MODES[(THEME_MODES.indexOf(themeMode) + 1) % THEME_MODES.length];
        setThemeModeState(next);
        setThemeMode(next);
        showToast(next === 'system' ? '🌓 시스템 테마 따라가기' : next === 'light' ? '☀️ 라이트 모드' : '🌙 다크 모드');
    };

    const themeIcon = themeMode === 'system' ? '🌓' : themeMode === 'light' ? '☀️' : '🌙';
    const themeLabel = themeMode === 'system' ? '시스템 테마' : themeMode === 'light' ? '라이트 모드' : '다크 모드';

    // 히든 모드 토글 함수
    const toggleHiddenMode = () => {
        const newMode = !hiddenModeActive;
        setHiddenModeActive(newMode);
        try {
            localStorage.setItem('hiddenModeActive', JSON.stringify(newMode));
        } catch(e) {}
        showToast(newMode ? '✨ 확장 모드 활성화' : '기본 모드로 전환');
    };

    // GitHub Gist 동기화 상태
    const [showSettings, setShowSettings] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [syncStatus, setSyncStatus] = useState('idle');
    const [syncMsg, setSyncMsg] = useState(() =>
        GistSync.getToken() ? 'Gist 연동 중...' : '미연결'
    );
    const [connectedUser, setConnectedUser] = useState(() =>
        localStorage.getItem('ghUser') || ''
    );
    // 첫 로드 시 Gist 동기화 대기 중이면 스켈레톤 표시
    const [initialLoading, setInitialLoading] = useState(() =>
        !!(GistSync.getToken() && GistSync.getGistId())
    );

    const showToast = (msg) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(msg);
        toastTimerRef.current = setTimeout(() => setToast(''), 2500);
    };

    const setSynced = (msg) => { setSyncStatus('synced'); setSyncMsg(msg); };
    const setSyncing = (msg) => { setSyncStatus('syncing'); setSyncMsg(msg || '동기화 중...'); };
    const setError = (msg) => { setSyncStatus('error'); setSyncMsg(msg); };

    // 저장 + 실패 시 안내 다이얼로그
    const persist = (newRecords) => {
        if (!Storage.save(newRecords)) {
            alertDialog({
                title: '저장 실패',
                message: '저장 공간이 부족합니다. 데이터를 내보낸 후 오래된 기록을 삭제해주세요.'
            });
        }
    };

    // 앱 로드 시: localStorage 먼저 표시 → Gist에서 병합
    useEffect(() => {
        const local = Storage.load();
        setRecords(local);
        setHiddenModesDetected(detectHiddenCategories(local));

        if (GistSync.getToken() && GistSync.getGistId()) {
            setSyncing('Gist에서 불러오는 중...');
            GistSync.fetchRecords().then(gistRecords => {
                if (!gistRecords) return;
                const merged = [...gistRecords];
                local.forEach(lr => { if (!merged.some(gr => gr.id === lr.id)) merged.push(lr); });
                merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setRecords(merged);
                persist(merged);
                setHiddenModesDetected(detectHiddenCategories(merged));
                setSynced(`${localStorage.getItem('ghUser') || 'GitHub'} Gist 연동됨`);
            }).catch(e => setError('Gist 불러오기 실패: ' + e.message))
              .finally(() => setInitialLoading(false));
        }
    }, []);

    // Gist에 저장 (로컬 저장 후 비동기 동기화)
    const syncToGist = (newRecords) => {
        if (!GistSync.getToken()) return;
        setSyncing();
        GistSync.saveRecords(newRecords)
            .then(() => setSynced(`${localStorage.getItem('ghUser') || 'GitHub'} Gist 연동됨`))
            .catch(e => setError('Gist 저장 실패: ' + e.message));
    };

    const handleSaveRecord = (record) => {
        const newRecords = [...records, record];
        setRecords(newRecords);
        persist(newRecords);
        setHiddenModesDetected(detectHiddenCategories(newRecords));
        setActiveTab('list');
        showToast('기록이 저장되었습니다!');
        syncToGist(newRecords);
    };

    const handleUpdateRecord = (updatedRecord) => {
        const newRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
        setRecords(newRecords);
        persist(newRecords);
        setHiddenModesDetected(detectHiddenCategories(newRecords));
        setEditingRecord(null);
        setActiveTab('list');
        showToast('기록이 수정되었습니다!');
        syncToGist(newRecords);
    };

    const handleEditRecord = (record) => {
        setEditingRecord(record);
        setActiveTab('record');
    };

    const handleCancelEdit = () => {
        setEditingRecord(null);
    };

    const handleDeleteRecord = async (id) => {
        const ok = await confirmDialog({
            title: '기록 삭제',
            message: '이 기록을 삭제하시겠습니까?\n삭제한 기록은 복구할 수 없습니다.',
            confirmText: '삭제',
            danger: true
        });
        if (!ok) return;
        const newRecords = records.filter(r => r.id !== id);
        setRecords(newRecords);
        persist(newRecords);
        setHiddenModesDetected(detectHiddenCategories(newRecords));
        showToast('기록이 삭제되었습니다');
        syncToGist(newRecords);
    };

    const handleImportRecords = (imported) => {
        const merged = [...records, ...imported.filter(imp => !records.some(r => r.id === imp.id))];
        setRecords(merged);
        persist(merged);
        setHiddenModesDetected(detectHiddenCategories(merged));
        showToast(`${imported.length}개 기록을 가져왔습니다!`);
        syncToGist(merged);
    };

    const handleImportClick = () => {
        importFromJSON(
            async (imported) => {
                const ok = await confirmDialog({
                    title: 'JSON 가져오기',
                    message: `${imported.length}개의 기록을 가져옵니다.\n기존 기록에 추가됩니다.`,
                    confirmText: '가져오기'
                });
                if (ok) handleImportRecords(imported);
            },
            (msg) => alertDialog({ title: '가져오기 실패', message: msg })
        );
    };

    // GitHub PAT 연결
    const handleConnectGist = async () => {
        const token = tokenInput.trim();
        if (!token) return;
        setSyncing('토큰 확인 중...');
        try {
            const username = await GistSync.testToken(token);
            localStorage.setItem('ghToken', token);
            localStorage.setItem('ghUser', username);
            setConnectedUser(username);

            setSyncing('기존 Gist 검색 중...');
            const existingId = await GistSync.findExistingGist(token);
            if (existingId) {
                GistSync.setGistId(existingId);
                // 기존 Gist에서 불러와 병합
                const gistRecords = await GistSync.fetchRecords();
                if (gistRecords && gistRecords.length > 0) {
                    const merged = [...gistRecords];
                    records.forEach(lr => { if (!merged.some(gr => gr.id === lr.id)) merged.push(lr); });
                    merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    setRecords(merged);
                    persist(merged);
                    await GistSync.saveRecords(merged);
                } else {
                    await GistSync.saveRecords(records);
                }
                showToast(`${username}님의 기존 Gist를 찾았습니다!`);
            } else {
                await GistSync.saveRecords(records);
                showToast(`${username}님의 새 Gist를 생성했습니다!`);
            }
            setSynced(`${username} Gist 연동됨`);
            setTokenInput('');
            setShowSettings(false);
        } catch(e) {
            setError(e.message);
        }
    };

    // 연결 해제
    const handleDisconnect = async () => {
        const ok = await confirmDialog({
            title: '연동 해제',
            message: 'GitHub Gist 연동을 해제하시겠습니까?\n기기에 저장된 기록은 그대로 유지됩니다.',
            confirmText: '해제',
            danger: true
        });
        if (!ok) return;
        localStorage.removeItem('ghToken');
        localStorage.removeItem('ghGistId');
        localStorage.removeItem('ghUser');
        setConnectedUser('');
        setTokenInput('');
        setSyncStatus('idle');
        setSyncMsg('미연결');
        showToast('GitHub Gist 연동 해제');
    };

    return (
        <React.Fragment>
        <div className="app-container">
            <div className="app-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h1 style={{ margin: 0 }}>Emoscape</h1>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {/* Gist 동기화 상태 표시 */}
                        {GistSync.getToken() && (
                            <span className={`sync-status ${syncStatus}`}>
                                <span className="sync-dot"></span>
                                {syncMsg}
                            </span>
                        )}
                        <button className="export-button" onClick={cycleTheme}
                            aria-label={`테마 전환 (현재: ${themeLabel})`} title={themeLabel}>
                            {themeIcon}
                        </button>
                        <button className="export-button" onClick={() => setShowSettings(s => !s)}
                            aria-label="설정" aria-expanded={showSettings}
                            title="데이터 관리 및 Gist 동기화 설정">
                            ⚙️{connectedUser ? ` ${connectedUser}` : ''}
                        </button>
                    </div>
                </div>
                <p>감정을 시간, 장소, 신체와 함께 기록하고 시각화하세요</p>
                {hiddenModesDetected.size > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '0.9rem' }}>
                        ✨ 확장 모드 활성화됨
                    </div>
                )}
                {/* 설정 패널: 데이터 관리 + GitHub Gist */}
                {showSettings && (
                    <div className="settings-panel">
                        <div className="settings-section">
                            <h4>💾 데이터 관리</h4>
                            <div className="settings-row">
                                <button className="export-button" onClick={handleImportClick}>
                                    JSON 가져오기
                                </button>
                                {records.length > 0 && (
                                    <React.Fragment>
                                        <button className="export-button" onClick={() => exportToJSON(records)}>
                                            JSON 내보내기
                                        </button>
                                        <button className="export-button" onClick={() => exportToCSV(records)}>
                                            CSV 내보내기
                                        </button>
                                    </React.Fragment>
                                )}
                            </div>
                        </div>
                        <hr className="settings-divider" />
                        <div className="settings-section">
                            <h4>🔗 GitHub Gist 동기화</h4>
                            {connectedUser ? (
                                <div>
                                    <div className={`sync-status ${syncStatus}`} style={{ marginBottom: '10px' }}>
                                        <span className="sync-dot"></span>{syncMsg}
                                    </div>
                                    <button className="export-button" onClick={handleDisconnect}
                                        style={{ background: 'rgba(248,113,113,0.3)', borderColor: 'rgba(248,113,113,0.7)' }}>
                                        연동 해제
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="settings-row">
                                        <input
                                            className="settings-token-input"
                                            type="password"
                                            placeholder="GitHub Personal Access Token (gist 권한)"
                                            value={tokenInput}
                                            onChange={e => setTokenInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleConnectGist()}
                                        />
                                        <button className="export-button"
                                            onClick={handleConnectGist}
                                            disabled={syncStatus === 'syncing'}
                                            style={{ whiteSpace: 'nowrap' }}>
                                            {syncStatus === 'syncing' ? '연결 중...' : '연결하기'}
                                        </button>
                                    </div>
                                    {syncStatus === 'error' && (
                                        <div className="sync-status error" style={{ marginTop: '8px' }}>
                                            <span className="sync-dot"></span>{syncMsg}
                                        </div>
                                    )}
                                    <p className="settings-hint">
                                        토큰 발급: <a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank" rel="noopener">github.com/settings/tokens</a> → Gist 권한만 체크
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <nav className="tab-navigation" aria-label="주 메뉴">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="tab-content">
                {activeTab === 'record' && <EmotionRecordForm onSave={editingRecord ? handleUpdateRecord : handleSaveRecord} initialRecord={editingRecord} onCancel={handleCancelEdit} hiddenModeActive={hiddenModeActive} toggleHiddenMode={toggleHiddenMode} />}
                {activeTab === 'list' && <RecordsList records={records} loading={initialLoading} onDelete={handleDeleteRecord} onEdit={handleEditRecord} onGoToRecord={() => setActiveTab('record')} />}
                {activeTab === 'visualize' && <VisualizationTabs records={records} onGoToRecord={() => setActiveTab('record')} hiddenModesDetected={hiddenModesDetected} />}
            </div>
        </div>
        {toast && (
            <div className="toast" role="status">{toast}</div>
        )}
        </React.Fragment>
    );
}
