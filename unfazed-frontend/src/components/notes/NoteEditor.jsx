
import { useState } from "react";

function NoteEditor({ onSave }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("private");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({ content, type });
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Session Note Editor</h2>

      <textarea
        placeholder="Write session notes..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="private">Private Note</option>
        <option value="shared">Shared Note</option>
      </select>

      <button type="submit">Save Note</button>
    </form>
  );
}

export default NoteEditor;
