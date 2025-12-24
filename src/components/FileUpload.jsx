import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { parseKMZ, parseKML } from '../utils/kmzParser';

function FileUpload({ onDataLoaded, onReset }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [mode, setMode] = useState('file'); // 'file' or 'url'
  const [url, setUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let data;

      if (file.name.endsWith('.kmz')) {
        data = await parseKMZ(file);
      } else if (file.name.endsWith('.kml')) {
        const text = await file.text();
        data = parseKML(text);
      } else {
        throw new Error('Please upload a .kmz or .kml file');
      }

      if (data.groups.length === 0) {
        throw new Error('No valid points found in file');
      }

      setFileName(file.name);
      onDataLoaded(data);
    } catch (err) {
      setError(err.message);
      console.error('File parsing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const trimmedUrl = url.trim();

      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(trimmedUrl);
      } catch {
        throw new Error('Invalid URL format');
      }

      // Fetch the file
      const response = await fetch(trimmedUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const urlLower = trimmedUrl.toLowerCase();
      let data;

      // Determine if KMZ or KML based on URL or content-type
      if (urlLower.endsWith('.kmz') || contentType.includes('application/vnd.google-earth.kmz')) {
        // KMZ file - fetch as blob and parse
        const blob = await response.blob();
        const zip = new JSZip();
        const contents = await zip.loadAsync(blob);

        // Find KML file inside KMZ
        let kmlFile = null;
        for (const filename of Object.keys(contents.files)) {
          if (filename.endsWith('.kml')) {
            kmlFile = contents.files[filename];
            break;
          }
        }

        if (!kmlFile) {
          throw new Error('No KML file found in KMZ archive');
        }

        const kmlText = await kmlFile.async('text');
        data = parseKML(kmlText);
      } else {
        // Assume KML - fetch as text
        const text = await response.text();

        // Check if it looks like KML
        if (!text.includes('<kml') && !text.includes('<Placemark')) {
          throw new Error('URL does not appear to contain valid KML data');
        }

        data = parseKML(text);
      }

      if (data.groups.length === 0) {
        throw new Error('No valid points found in file');
      }

      // Extract filename from URL
      const urlPath = parsedUrl.pathname;
      const extractedName = urlPath.split('/').pop() || 'remote.kml';

      setFileName(extractedName);
      onDataLoaded(data);
    } catch (err) {
      // Handle CORS errors
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('CORS error: The server does not allow cross-origin requests. Try downloading the file and uploading it instead.');
      } else {
        setError(err.message);
      }
      console.error('URL loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setError(null);
    setUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <div className="mb-4 pb-4 border-b">
      {/* Mode Toggle */}
      <div className="flex gap-1 mb-3 text-xs">
        <button
          onClick={() => setMode('file')}
          className={`px-3 py-1 rounded-l ${
            mode === 'file'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📁 File
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-3 py-1 rounded-r ${
            mode === 'url'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔗 URL
        </button>
      </div>

      {mode === 'file' ? (
        /* File Upload Mode */
        <div className="flex gap-2 mb-2">
          <label className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".kmz,.kml"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="block w-full px-3 py-2 text-sm bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-center">
              {loading ? 'Loading...' : 'Upload KMZ/KML'}
            </span>
          </label>

          {fileName && (
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          )}
        </div>
      ) : (
        /* URL Mode */
        <div className="space-y-2 mb-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/file.kml"
            className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUrlLoad}
              disabled={loading || !url.trim()}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load from URL'}
            </button>
            {fileName && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {fileName && (
        <div className="text-xs text-green-600">
          Loaded: {fileName}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
