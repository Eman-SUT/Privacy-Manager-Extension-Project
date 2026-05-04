chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageText") {
        sendResponse({ text: document.body.innerText });
    }
});

const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function(type) {
    const ctx = this.getContext('2d');
    if (ctx) {
        const imageData = ctx.getImageData(0, 0, 1, 1);
        imageData.data[0] ^= 1;
        ctx.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.apply(this, arguments);
};

const originalGetChannelData = AudioBuffer.prototype.getChannelData;
AudioBuffer.prototype.getChannelData = function() {
    const data = originalGetChannelData.apply(this, arguments);
    for (let i = 0; i < data.length; i += 100) {
        data[i] += Math.random() * 0.0001;
    }
    return data;
};
