import React, { useState } from 'react';
import './App.css';
import SpiderWebGraph from './components/SpiderWebGraph';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCrawl = async () => {
    if (!url.trim()) {
      setError('Please enter a Reddit URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8080/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to crawl Reddit post');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleCrawl();
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Enter the Reddit Post URL:</h1>
        
        <div className="input-section">
          <input
            type="text"
            value={url}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="https://www.reddit.com/r/..."
            className="url-input"
            disabled={loading}
          />
          
          <button 
            onClick={handleCrawl} 
            className="crawl-button"
            disabled={loading || !url.trim()}
          >
            {loading ? 'Crawling...' : 'Crawl'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>Word Network Visualization:</h2>
            <p className="visualization-description">
              Node size represents word frequency • Line thickness represents co-occurrence strength
            </p>
            <SpiderWebGraph data={result} />
            
            <details className="raw-data-toggle">
              <summary>Show Raw Data</summary>
              <pre className="result-data">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
