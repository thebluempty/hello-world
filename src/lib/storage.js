
// 데이터 스토리지
export const Storage = {
    // 저장 성공 여부 반환 — 실패 UI는 호출 측에서 처리
    save(records) {
        try {
            localStorage.setItem('emotionRecords', JSON.stringify(records));
            return true;
        } catch (e) {
            console.error('저장 실패:', e);
            return false;
        }
    },
    load() {
        try {
            const data = localStorage.getItem('emotionRecords');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('데이터 로딩 실패:', e);
            return [];
        }
    }
};
