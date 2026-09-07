import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const API_BASE = '/api/v1'

function App() {
  const [count, setCount] = useState(0)
  const [url, setUrl] = useState('https://news.ycombinator.com/')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeAction, setActiveAction] = useState(null)
  const [minPoints, setMinPoints] = useState(10)
  const [minComments, setMinComments] = useState(100)
  const [result, setResult] = useState(null)

  const runRequest = async (action, requesFn) => {
    setLoading(true)
    setError(null)
    setActiveAction(action)
    try {
      const res = await requesFn()
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
      setResult(data);
    } catch (error) {
      setError(error.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCrawl = () => {
    runRequest('crawl', () =>
      fetch(`${API_BASE}/crawl`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url })
      })
    )
  }

  const handleFilterComments = () => {
    runRequest('points', (() => fetch(`${API_BASE}/entries/filter/points?min=${minPoints}`)))
  }
  const handleFilterPoints = () => {
    runRequest('comments', (() => fetch(`${API_BASE}/entries/filter/comments?min=${minComments}`)))
  }

  return (
    <>
      <section id="center">
        <h2>Web scrapper</h2>
        <div>Coding exercise - Andres Torres</div>
        <input
          type='text'
          placeholder='https://news.ycombinator.com/'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="counter"
          onClick={handleCrawl}
        >
          Crawl url
        </button>
      </section>

      <section>
        <div className="filters">
          <div>
            <button
                type="button"
                className="counter"
                onClick={handleFilterPoints}
              >
                Filter by points
            </button>
          </div>
          
          <div>
            <button
                type="button"
                className="counter"
                onClick={handleFilterComments}
              >
                Filter by comments
            </button>
          </div>
        </div>

        <div>
        {loading && <p> Loading </p>}
        {error && <p className='error'> Error: {error} </p>}
        {result && (
          <>
            <h2> Result - {activeAction}</h2>
            <p>Count: {result.count}</p>
            {result.entries && (
              <div className='results-grid'>
                <div className="grid-header">#</div>
                <div className="grid-header">Title</div>
                <div className="grid-header center">Points</div>
                <div className="grid-header center">Comments</div>
                {result.entries.map((entry) => (
                  <div className="grid-row" key={entry.number}>
                    <div className="grid-cell">{entry.number}</div>
                    <div className="grid-cell">{entry.title}</div>
                    <div className="grid-cell center">{entry.points}</div>
                    <div className="grid-cell center">{entry.comments}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
