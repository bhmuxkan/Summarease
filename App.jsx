import React, { useState } from 'react';
import { FileText, Download, Copy, BookOpen, Coffee, TrendingDown, AlertCircle } from 'lucide-react';

const App = () => {
  const [inputText, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryRatio, setRatio] = useState(40);
  const [isProcessing, setProcessing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [copied, setCopied] = useState(false);

  const summarizeText = (text, compressionRatio) => {
    try {
      const cleanText = text.trim();
      if (!cleanText) {
        return { summary: '', metrics: null, error: 'No text provided' };
      }

      const sentenceArray = cleanText.split(/(?<=[.!?])\s+/);
      const sentences = sentenceArray
        .map(s => s.trim())
        .filter(s => s.length > 0 && /[a-zA-Z]/.test(s));

      if (sentences.length === 0) {
        return { summary: cleanText, metrics: null, error: 'No valid sentences found' };
      }

      const wordPattern = /[a-zA-Z0-9]+(?:'[a-zA-Z]+)?/g;
      const allWords = cleanText.match(wordPattern) || [];
      const originalWordCount = allWords.length;
      const originalSentenceCount = sentences.length;

      if (originalWordCount === 0) {
        return { summary: '', metrics: null, error: 'No words found' };
      }

      const stopwords = new Set([
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
        'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
        'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
        'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
        'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
        'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
        'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
        'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
        'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
        'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
      ]);

      const wordFrequency = {};
      allWords.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (!stopwords.has(lowerWord) && lowerWord.length > 2) {
          wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
        }
      });

      const meaningfulWords = Object.keys(wordFrequency);
      if (meaningfulWords.length === 0) {
        const firstSentence = sentences[0];
        const firstSentenceWords = (firstSentence.match(wordPattern) || []).length;
        return {
          summary: firstSentence,
          metrics: {
            originalSentences: originalSentenceCount,
            originalWords: originalWordCount,
            summarySentences: 1,
            summaryWords: firstSentenceWords,
            wordReductionPercent: ((1 - firstSentenceWords / originalWordCount) * 100).toFixed(1),
            sentenceReductionPercent: ((1 - 1 / originalSentenceCount) * 100).toFixed(1),
            compressionRatio: compressionRatio,
            averageSentenceLength: firstSentenceWords.toFixed(1)
          },
          error: null
        };
      }

      const maxFreq = Math.max(...Object.values(wordFrequency));
      for (let word in wordFrequency) {
        wordFrequency[word] = wordFrequency[word] / maxFreq;
      }

      const scoredSentences = sentences.map((sentence, idx) => {
        const words = (sentence.match(wordPattern) || []).map(w => w.toLowerCase());
        
        let score = 0;
        let countedWords = 0;

        words.forEach(word => {
          if (wordFrequency[word] !== undefined) {
            score += wordFrequency[word];
            countedWords++;
          }
        });

        const avgScore = countedWords > 0 ? score / words.length : 0;

        return {
          sentence: sentence,
          score: avgScore,
          originalIndex: idx,
          wordCount: words.length
        };
      });

      const targetCount = Math.max(1, Math.round(originalSentenceCount * (compressionRatio / 100)));

      const selectedSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, targetCount)
        .sort((a, b) => a.originalIndex - b.originalIndex);

      const summaryText = selectedSentences.map(item => item.sentence).join(' ');

      const summaryWords = (summaryText.match(wordPattern) || []).length;
      const summarySentences = selectedSentences.length;

      const wordReduction = ((1 - summaryWords / originalWordCount) * 100).toFixed(1);
      const sentenceReduction = ((1 - summarySentences / originalSentenceCount) * 100).toFixed(1);

      return {
        summary: summaryText,
        metrics: {
          originalSentences: originalSentenceCount,
          originalWords: originalWordCount,
          summarySentences: summarySentences,
          summaryWords: summaryWords,
          wordReductionPercent: parseFloat(wordReduction),
          sentenceReductionPercent: parseFloat(sentenceReduction),
          compressionRatio: compressionRatio,
          averageSentenceLength: (summaryWords / summarySentences).toFixed(1)
        },
        error: null
      };

    } catch (error) {
      console.error('Summarization error:', error);
      return { 
        summary: '', 
        metrics: null, 
        error: 'An error occurred during summarization' 
      };
    }
  };

  const handleSummarize = () => {
    const trimmedText = inputText.trim();
    
    if (!trimmedText) {
      alert('Please enter some text to summarize');
      return;
    }

    if (trimmedText.length < 50) {
      alert('Please enter a longer text (at least 50 characters) for meaningful summarization');
      return;
    }

    setProcessing(true);
    
    setTimeout(() => {
      const result = summarizeText(trimmedText, summaryRatio);
      
      if (result.error && !result.summary) {
        alert(result.error);
        setProcessing(false);
        return;
      }
      
      setSummary(result.summary);
      setMetrics(result.metrics);
      setProcessing(false);
    }, 1000);
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (summary) {
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setText(event.target.result);
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a .txt file');
      }
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
    setMetrics(null);
    setCopied(false);
  };

  const wordPattern = /[a-zA-Z0-9]+(?:'[a-zA-Z]+)?/g;
  const currentWords = inputText.trim() ? (inputText.match(wordPattern) || []).length : 0;
  const currentSentences = inputText.trim() ? inputText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0 && /[a-zA-Z]/.test(s)).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-serif text-slate-900 tracking-tight">SummarEase</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider">SMART READING COMPANION</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
              <Coffee className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-indigo-700 font-medium">Study Mode</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-slate-800 mb-2 tracking-tight">Transform lengthy texts into concise summaries</h2>
          <p className="text-sm text-slate-500 font-light">Advanced NLP extracts the most important sentences automatically</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-8 bg-gradient-to-b from-white to-slate-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-700">Your Text</h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer transition-all text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {inputText && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here... I'll analyze it using frequency-based algorithms and extract the most important sentences while maintaining logical flow and readability."
              className="w-full h-72 p-5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none text-slate-800 leading-loose bg-white text-base shadow-sm"
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{currentWords}</span>
                  words
                </span>
                <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{currentSentences}</span>
                  sentences
                </span>
              </div>
              {currentWords > 0 && (
                <div className="text-xs text-slate-500">
                  ~{Math.ceil(currentWords / 200)} min read
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-indigo-50/50 border-y border-slate-200">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Summary Length</label>
                    <p className="text-xs text-slate-500 mt-0.5">Keep {summaryRatio}% of original sentences</p>
                  </div>
                  <span className="text-lg font-serif text-indigo-600">{summaryRatio}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="70"
                  step="10"
                  value={summaryRatio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>Brief (20%)</span>
                  <span>Moderate (40%)</span>
                  <span>Detailed (70%)</span>
                </div>
              </div>

              <button
                onClick={handleSummarize}
                disabled={isProcessing || !inputText.trim() || currentWords < 10}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm tracking-wide"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Text...
                  </span>
                ) : (
                  'Generate Smart Summary'
                )}
              </button>
            </div>
          </div>

          {summary && metrics && (
            <div className="p-8 animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-700">Your Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top {metrics.summarySentences} most important sentences</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 mb-6 shadow-sm">
                <p className="text-slate-800 leading-loose text-base whitespace-pre-wrap" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
                  {summary}
                </p>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-indigo-900 mb-1">How It Works</h5>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Analyzed <span className="font-semibold text-indigo-700">{metrics.originalSentences} sentences</span>, calculated word frequencies (excluding 100+ common stopwords), scored each sentence by word importance, and extracted the top <span className="font-semibold text-indigo-700">{metrics.summarySentences} sentences ({metrics.compressionRatio}%)</span> while maintaining original order for coherent flow.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-semibold text-slate-700">Performance Metrics</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">{metrics.wordReductionPercent}%</div>
                    <div className="text-xs text-slate-600 font-medium">Word Reduction</div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{metrics.sentenceReductionPercent}%</div>
                    <div className="text-xs text-slate-600 font-medium">Sentence Reduction</div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-slate-800 mb-1">{metrics.summaryWords}</div>
                    <div className="text-xs text-slate-600 font-medium">Summary Words</div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-slate-800 mb-1">{metrics.summarySentences}</div>
                    <div className="text-xs text-slate-600 font-medium">Sentences Kept</div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Original:</span>
                      <span className="ml-2 font-semibold text-slate-700">{metrics.originalWords} words, {metrics.originalSentences} sentences</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Summary:</span>
                      <span className="ml-2 font-semibold text-slate-700">{metrics.summaryWords} words, {metrics.summarySentences} sentences</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Avg Length:</span>
                      <span className="ml-2 font-semibold text-slate-700">{metrics.averageSentenceLength} words/sentence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Powered by extractive NLP algorithm • Accurate metrics guaranteed
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;