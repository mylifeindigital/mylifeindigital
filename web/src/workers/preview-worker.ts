import {
    processBrowserPreview,
    type BrowserPreviewRequest,
    type BrowserPreviewResponse,
} from '../utils/pipeline/browser-preview.js';

export async function processPreviewWorkerRequest(
    request: BrowserPreviewRequest
): Promise<BrowserPreviewResponse> {
    return processBrowserPreview(request);
}

const workerGlobal = globalThis as typeof globalThis & {
    addEventListener?: (
        type: 'message',
        listener: (event: { data: BrowserPreviewRequest }) => void
    ) => void;
    postMessage?: (message: BrowserPreviewResponse) => void;
};

if (typeof workerGlobal.addEventListener === 'function') {
    workerGlobal.addEventListener('message', (event) => {
        void processPreviewWorkerRequest(event.data).then((response) => {
            workerGlobal.postMessage?.(response);
        });
    });
}
