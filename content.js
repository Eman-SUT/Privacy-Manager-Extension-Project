
function applyFingerprintingProtection() {

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;

  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    const context = this.getContext("2d");
    if (context) {
      const imageData = originalGetImageData.call(context, 0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] ^= 1;
      }
      context.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.apply(this, args);
  };

  HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
    const context = this.getContext("2d");
    if (context) {
      const imageData = originalGetImageData.call(context, 0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] ^= 1;
      }
      context.putImageData(imageData, 0, 0);
    }
    return originalToBlob.call(this, callback, ...args);
  };

  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    // UNMASKED_VENDOR_WEBGL
    if (parameter === 37445) return "Generic Vendor";
    // UNMASKED_RENDERER_WEBGL
    if (parameter === 37446) return "Generic Renderer";
    return originalGetParameter.call(this, parameter);
  };

  const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
  AudioContext.prototype.createAnalyser = function() {
    const analyser = originalCreateAnalyser.call(this);
    const originalGetFloatFrequencyData = analyser.getFloatFrequencyData.bind(analyser);
    analyser.getFloatFrequencyData = function(array) {
      originalGetFloatFrequencyData(array);
      for (let i = 0; i < array.length; i++) {
        array[i] += (Math.random() - 0.5) * 0.1;
      }
    };
    return analyser;
  };

  const spoofedProperties = {
    hardwareConcurrency: 4,
    deviceMemory: 8,
    platform: "Win32",
  };

  for (const [prop, value] of Object.entries(spoofedProperties)) {
    try {
      Object.defineProperty(navigator, prop, {
        get: () => value,
        configurable: true,
      });
    } catch (e) {}
  }

  console.log("[Privacy Guard] Fingerprinting protection active.");
}

applyFingerprintingProtection();
