
// 파일 선택 → 파싱 결과를 콜백으로 전달 (확인/오류 UI는 호출 측에서 처리)
export function importFromJSON(onParsed, onError) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!Array.isArray(imported)) throw new Error('올바른 형식이 아닙니다');
                onParsed(imported);
            } catch(e) {
                onError('파일을 읽을 수 없습니다. 올바른 JSON 형식인지 확인하세요.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

export function exportToJSON(records) {
    const dataStr = JSON.stringify(records, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion-records-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

export function exportToCSV(records) {
    const headers = ['시간', '감정', '강도', '장소', '신체 부위', '감각 타입', '설명'];
    const rows = records.flatMap(record => {
        if (record.emotions.length === 0) {
            return [[
                new Date(record.timestamp).toLocaleString('ko-KR'),
                '', '',
                record.location.value,
                '', '', ''
            ]];
        }
        return record.emotions.map(emotion => [
            new Date(record.timestamp).toLocaleString('ko-KR'),
            emotion.name,
            emotion.intensity,
            record.location.value,
            record.bodySensations.map(s => s.area).join('; '),
            record.bodySensations.map(s => s.sensationType).join('; '),
            record.bodySensations.map(s => s.description).join('; ')
        ]);
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const dataBlob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion-records-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
