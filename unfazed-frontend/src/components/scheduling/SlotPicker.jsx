
function SlotPicker({ slots = [], selectedSlot, onSelect }) {
  if (slots.length === 0) {
    return (
      <p className="profile-no-slots">
        No available slots for this date. Please choose another date.
      </p>
    );
  }

  return (
    <div className="profile-slot-container">
      {slots.map((slot) => {
        const selected =
          selectedSlot?.startTime === slot.startTime;

        return (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onSelect(slot)}
            className={`profile-slot-button ${
              selected ? "profile-slot-selected" : ""
            }`}
          >
            {slot.startTime} – {slot.endTime}
          </button>
        );
      })}
    </div>
  );
}

export default SlotPicker;
