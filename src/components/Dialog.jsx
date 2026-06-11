import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const DialogContext = createContext(null);

// confirmDialog/promptDialog/alertDialog를 Promise로 제공하는 훅
export function useDialog() {
    return useContext(DialogContext);
}

export function DialogProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);
    const confirmRef = useRef(null);

    const open = useCallback((opts) => new Promise(resolve => {
        setInputValue(opts.defaultValue || '');
        setDialog({ ...opts, resolve });
    }), []);

    // confirm → true/false
    const confirmDialog = useCallback((opts) =>
        open({ type: 'confirm', confirmText: '확인', cancelText: '취소', ...opts }), [open]);
    // prompt → 입력값 또는 null
    const promptDialog = useCallback((opts) =>
        open({ type: 'prompt', confirmText: '추가', cancelText: '취소', ...opts }), [open]);
    // alert → undefined
    const alertDialog = useCallback((opts) =>
        open({ type: 'alert', confirmText: '확인', ...(typeof opts === 'string' ? { message: opts } : opts) }), [open]);

    const close = useCallback((result) => {
        if (!dialog) return;
        dialog.resolve(result);
        setDialog(null);
    }, [dialog]);

    const handleCancel = () => {
        if (dialog.type === 'prompt') close(null);
        else if (dialog.type === 'alert') close(undefined);
        else close(false);
    };

    const handleConfirm = () => {
        if (dialog.type === 'prompt') close(inputValue.trim());
        else if (dialog.type === 'alert') close(undefined);
        else close(true);
    };

    // 열릴 때 포커스 이동, ESC로 닫기
    useEffect(() => {
        if (!dialog) return;
        const target = dialog.type === 'prompt' ? inputRef.current : confirmRef.current;
        if (target) target.focus();
        const onKey = (e) => { if (e.key === 'Escape') handleCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [dialog]);

    return (
        <DialogContext.Provider value={{ confirmDialog, promptDialog, alertDialog }}>
            {children}
            {dialog && (
                <div className="dialog-overlay" onClick={handleCancel}>
                    <div className="dialog-sheet" role="dialog" aria-modal="true"
                        aria-label={dialog.title || dialog.message}
                        onClick={e => e.stopPropagation()}>
                        {dialog.title && <div className="dialog-title">{dialog.title}</div>}
                        {dialog.message && <div className="dialog-message">{dialog.message}</div>}
                        {dialog.type === 'prompt' && (
                            <input
                                ref={inputRef}
                                className="dialog-input"
                                type="text"
                                value={inputValue}
                                placeholder={dialog.placeholder || ''}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                            />
                        )}
                        <div className="dialog-actions">
                            {dialog.type !== 'alert' && (
                                <button className="btn btn-secondary" onClick={handleCancel}>
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                ref={confirmRef}
                                className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleConfirm}
                                disabled={dialog.type === 'prompt' && dialog.required !== false && !inputValue.trim()}>
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
}
