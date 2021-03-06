
(function() {
  if (window.chrome && chrome.ttsEngine) {
    var engine = window.remoteTtsEngine = new RemoteTTS(config.serviceUrl);
    chrome.ttsEngine.onSpeak.addListener(engine.speak);
    chrome.ttsEngine.onStop.addListener(engine.stop);
    chrome.ttsEngine.onPause.addListener(engine.pause);
    chrome.ttsEngine.onResume.addListener(engine.resume);
  }
})();


function RemoteTTS(host) {
  var audio = window.ttsAudio || (window.ttsAudio = document.createElement("AUDIO"));
  var prefetchAudio = document.createElement("AUDIO");
  var nextStartTime = 0;
  var waitTimer;

  this.speak = function(utterance, options, onEvent) {
    if (!options.volume) options.volume = 1;
    if (!options.rate) options.rate = 1;
    if (!onEvent) onEvent = options.onEvent;
    audio.pause();
    audio.volume = options.volume;
    audio.defaultPlaybackRate = options.rate;
    audio.src = getAudioUrl(utterance, options.lang, options.voiceName);
    audio.oncanplay = function() {
      var waitTime = nextStartTime - new Date().getTime();
      if (waitTime > 0) waitTimer = setTimeout(audio.play.bind(audio), waitTime);
      else audio.play();
    };
    audio.onplay = onEvent.bind(null, {type: 'start', charIndex: 0});
    audio.onended = onEvent.bind(null, {type: 'end', charIndex: utterance.length});
    audio.onerror = function() {
      onEvent({type: "error", errorMessage: audio.error.message});
    };
  }

  this.isSpeaking = function(callback) {
    callback(audio.currentTime && !audio.paused && !audio.ended);
  }

  this.pause =
  this.stop = function() {
    clearTimeout(waitTimer);
    audio.pause();
  }

  this.resume = function() {
    audio.play();
  }

  this.prefetch = function(utterance, options) {
    prefetchAudio.src = getAudioUrl(utterance, options.lang, options.voiceName);
  }

  this.setNextStartTime = function(time) {
    nextStartTime = time || 0;
  }

  function getAudioUrl(utterance, lang, voiceName) {
    return host + "/read-aloud/speak/" + lang + "/" + encodeURIComponent(voiceName) + "?q=" + encodeURIComponent(utterance);
  }
}
