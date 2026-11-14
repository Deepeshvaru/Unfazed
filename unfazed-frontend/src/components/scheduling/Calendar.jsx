
function Calendar({ value, onChange, min }) {
  return (
    <div className="profile-calendar">
      <label className="profile-calendar-label">
        Select date
      </label>

      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="profile-calendar-input"
      />
    </div>
  );
}

export default Calendar;
