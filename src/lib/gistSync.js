
// GitHub Gist 동기화
export const GistSync = {
    getToken: () => localStorage.getItem('ghToken') || '',
    getGistId: () => localStorage.getItem('ghGistId') || '',
    setGistId: (id) => localStorage.setItem('ghGistId', id),
    clearGistId: () => localStorage.removeItem('ghGistId'),

    _headers(token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        };
    },

    async testToken(token) {
        const res = await fetch('https://api.github.com/user', {
            headers: this._headers(token)
        });
        if (!res.ok) throw new Error('토큰이 유효하지 않습니다');
        const data = await res.json();
        return data.login;
    },

    // 기존 Emoscape Gist 찾기
    async findExistingGist(token) {
        let page = 1;
        while (page <= 5) {
            const res = await fetch(`https://api.github.com/gists?per_page=100&page=${page}`, {
                headers: this._headers(token)
            });
            if (!res.ok) break;
            const gists = await res.json();
            if (gists.length === 0) break;
            const found = gists.find(g => g.files && g.files['emoscape-records.json']);
            if (found) return found.id;
            page++;
        }
        return null;
    },

    async fetchRecords() {
        const token = this.getToken();
        const gistId = this.getGistId();
        if (!token || !gistId) return null;
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: this._headers(token)
        });
        if (!res.ok) throw new Error('Gist 불러오기 실패 (' + res.status + ')');
        const data = await res.json();
        const content = data.files['emoscape-records.json']?.content;
        return content ? JSON.parse(content) : [];
    },

    async saveRecords(records) {
        const token = this.getToken();
        if (!token) return;
        const body = {
            description: 'Emoscape 감정 기록 (자동 동기화)',
            public: false,
            files: { 'emoscape-records.json': { content: JSON.stringify(records, null, 2) } }
        };
        const gistId = this.getGistId();
        if (gistId) {
            const res = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: this._headers(token),
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Gist 저장 실패 (' + res.status + ')');
        } else {
            const res = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: this._headers(token),
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Gist 생성 실패 (' + res.status + ')');
            const data = await res.json();
            this.setGistId(data.id);
        }
    }
};
