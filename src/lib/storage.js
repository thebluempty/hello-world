
// 데이터 스토리지
export const Storage = {
    save(records) {
        try {
            localStorage.setItem('emotionRecords', JSON.stringify(records));
        } catch (e) {
            console.error('저장 실패:', e);
            alert('저장 공간이 부족합니다. 오래된 기록을 삭제해주세요.');
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
