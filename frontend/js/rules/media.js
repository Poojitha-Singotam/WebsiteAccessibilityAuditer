/**
 * Rule Category: Media
 * Checks for video captions, audio alternatives, and autoplay attributes.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.media = {
        name: 'Media',
        category: 'Media',

        analyze(doc, rawHtml) {
            const results = [];
            const videos = doc.querySelectorAll('video');
            const audios = doc.querySelectorAll('audio');

            if (videos.length === 0 && audios.length === 0) {
                results.push({
                    ruleId: 'MEDIA_NONE',
                    category: 'Media',
                    severity: 'PASS',
                    message: 'No video or audio multimedia elements found',
                    element: 'N/A',
                    explanation: 'The analyzed document contains no HTML5 <video> or <audio> tags.',
                    recommendation: 'Ensure future media embeds include captions and transcripts.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '1.2.2 Captions (Prerecorded)'
                });
                return results;
            }

            // 1. Analyze <video>
            videos.forEach(video => {
                const snippet = A11yUtils.getElementSnippet(video);
                const tracks = video.querySelectorAll('track');
                const hasCaptions = Array.from(tracks).some(t => {
                    const kind = (t.getAttribute('kind') || '').toLowerCase();
                    return kind === 'captions' || kind === 'subtitles';
                });
                const isAutoplay = video.hasAttribute('autoplay');
                const isMuted = video.hasAttribute('muted');

                if (isAutoplay && !isMuted) {
                    results.push({
                        ruleId: 'MEDIA_AUTOPLAY_UNMUTED',
                        category: 'Media',
                        severity: 'ERROR',
                        message: 'Video element has unmuted autoplay enabled',
                        element: snippet,
                        explanation: 'Autoplaying media with audio can interfere with screen readers and startle users with cognitive or sensory processing differences.',
                        recommendation: 'Remove the autoplay attribute or add the muted attribute.',
                        currentCode: snippet,
                        recommendedCode: snippet.replace('autoplay', 'autoplay muted'),
                        highlightTarget: 'autoplay',
                        wcag: '1.4.2 Audio Control'
                    });
                }

                if (!hasCaptions) {
                    results.push({
                        ruleId: 'MEDIA_CAPTIONS_001',
                        category: 'Media',
                        severity: 'WARNING',
                        message: 'Video element is missing a closed captions track (<track kind="captions">)',
                        element: snippet,
                        explanation: 'Users who are deaf or hard of hearing rely on synchronized text captions to understand spoken dialogue and sound effects.',
                        recommendation: 'Add a <track kind="captions" src="captions.vtt" srclang="en" label="English"> element inside the <video>.',
                        currentCode: snippet,
                        recommendedCode: '<video controls>\n  <source src="video.mp4" type="video/mp4">\n  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>\n</video>',
                        highlightTarget: '<video',
                        wcag: '1.2.2 Captions (Prerecorded)'
                    });
                } else {
                    results.push({
                        ruleId: 'MEDIA_CAPTIONS_PASS',
                        category: 'Media',
                        severity: 'PASS',
                        message: 'Video includes synchronized caption/subtitle tracks',
                        element: snippet,
                        explanation: 'The video element contains caption tracks for deaf and hard-of-hearing viewers.',
                        recommendation: 'Ensure caption files are kept synchronized with audio.',
                        currentCode: snippet,
                        recommendedCode: snippet,
                        wcag: '1.2.2 Captions (Prerecorded)'
                    });
                }
            });

            // 2. Analyze <audio>
            audios.forEach(audio => {
                const snippet = A11yUtils.getElementSnippet(audio);
                const isAutoplay = audio.hasAttribute('autoplay');

                if (isAutoplay) {
                    results.push({
                        ruleId: 'MEDIA_AUDIO_AUTOPLAY',
                        category: 'Media',
                        severity: 'ERROR',
                        message: 'Audio element has autoplay enabled',
                        element: snippet,
                        explanation: 'Automatically playing audio disrupts screen readers and violates WCAG 1.4.2.',
                        recommendation: 'Remove the autoplay attribute and allow the user to initiate audio playback.',
                        currentCode: snippet,
                        recommendedCode: snippet.replace('autoplay', ''),
                        highlightTarget: 'autoplay',
                        wcag: '1.4.2 Audio Control'
                    });
                }

                results.push({
                    ruleId: 'MEDIA_AUDIO_TRANSCRIPT',
                    category: 'Media',
                    severity: 'INFO',
                    message: 'Audio element detected: Ensure a text transcript is provided nearby',
                    element: snippet,
                    explanation: 'Audio content requires a text transcript for users who cannot hear audio streams.',
                    recommendation: 'Provide a link or expandable section containing the full audio transcript.',
                    currentCode: snippet,
                    recommendedCode: snippet + '\n<p><a href="#transcript">Read full audio transcript</a></p>',
                    wcag: '1.2.1 Audio-only and Video-only (Prerecorded)'
                });
            });

            return results;
        }
    };
})();
