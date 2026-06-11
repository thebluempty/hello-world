
// 로컬 시간 기준 datetime-local 값 반환
export const getLocalDatetimeString = () => {
    const now = new Date();
    return new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
