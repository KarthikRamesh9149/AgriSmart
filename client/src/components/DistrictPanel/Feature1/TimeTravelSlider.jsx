function getHorizonStops(currentYear) {
  return [2000, currentYear, 2050];
}

function getLabel(year, currentYear) {
  if (year === 2000) return 'Baseline';
  if (year === currentYear) return 'Current';
  return 'Projection';
}

function clampIndex(index) {
  return Math.max(0, Math.min(2, index));
}

function TimeTravelSlider({ value, onChange, currentYear }) {
  const stops = getHorizonStops(currentYear);
  const currentIndex = clampIndex(stops.indexOf(value));

  const handleRangeChange = (event) => {
    const nextIndex = clampIndex(Number(event.target.value));
    onChange(stops[nextIndex]);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = clampIndex(currentIndex + delta);
    onChange(stops[nextIndex]);
  };

  return (
    <div className="time-travel-slider">
      <input
        type="range"
        className="time-travel-range"
        min={0}
        max={2}
        step={1}
        value={currentIndex}
        onChange={handleRangeChange}
        onKeyDown={handleKeyDown}
        aria-label="Time travel horizon slider"
      />
      <div className="time-travel-stops" role="group" aria-label="Time travel stops">
        {stops.map((year) => (
          <button
            key={year}
            type="button"
            className={`time-stop ${value === year ? 'active' : ''}`}
            onClick={() => onChange(year)}
            aria-pressed={value === year}
          >
            <span className="time-stop-year">{year}</span>
            <span className="time-stop-label">{getLabel(year, currentYear)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TimeTravelSlider;
