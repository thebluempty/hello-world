
// 숨은 키워드 시스템
export const hiddenKeywords = {
    manas: ['말나', '말나식', 'manas', 'ego', '자아'],
    alaya: ['아뢰야', 'alaya', '저장'],
    awareness: ['알아차림', 'awareness', 'mindfulness', '깨어있음', '관찰'],
    presence: ['현존', 'presence', 'being', '있음'],
    sacred: ['성', 'sacred', 'divine', '성스러움', '개입'],
    emptiness: ['공', '空', 'sunyata', 'emptiness', '비움']
};

// 키워드 감지 함수
export function detectHiddenCategories(records) {
    const detected = new Set();
    records.forEach(record => {
        // 모든 텍스트 수집
        const textsToCheck = [];

        // 1. 감정명
        if (record.emotions) {
            record.emotions.forEach(e => {
                if (e.name) textsToCheck.push(e.name);
            });
        }

        // 2. 신체 감각 설명
        if (record.bodySensations) {
            record.bodySensations.forEach(s => {
                if (s.area) textsToCheck.push(s.area);
                if (s.sensationType) textsToCheck.push(s.sensationType);
                if (s.description) textsToCheck.push(s.description);
            });
        }

        // 3. 커스텀 카테고리
        if (record.customCategories) {
            Object.entries(record.customCategories).forEach(([key, value]) => {
                textsToCheck.push(key);
                if (value) textsToCheck.push(String(value));
            });
        }

        // 4. 메모
        if (record.memo) {
            textsToCheck.push(record.memo);
        }

        // 키워드 감지
        textsToCheck.forEach(text => {
            const lowerText = text.toLowerCase();
            Object.keys(hiddenKeywords).forEach(category => {
                if (hiddenKeywords[category].some(keyword =>
                    lowerText.includes(keyword.toLowerCase())
                )) {
                    detected.add(category);
                }
            });
        });
    });
    return detected;
}
