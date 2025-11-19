import { useState, useRef } from 'react';
import { parseKMZ, parseKML } from '../utils/kmzParser';

function FileUpload({ onDataLoaded, onReset }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
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

  const handleReset = () => {
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <div className="mb-4 pb-4 border-b">
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
