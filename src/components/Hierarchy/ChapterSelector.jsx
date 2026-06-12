import CustomDropdown from './CustomDropdown';
import { createChapter } from '../../hooks/useChapters';
import toast from 'react-hot-toast';

export default function ChapterSelector({ chapters, value, onChange, subjectId, onChapterCreated, accentColor }) {
  async function handleCreate(name) {
    try {
      const chapter = await createChapter(subjectId, name);
      onChapterCreated(chapter);
      return chapter;
    } catch {
      toast.error('Failed to create chapter');
      throw new Error();
    }
  }

  return (
    <CustomDropdown
      id="chapter-dd"
      items={chapters}
      value={value}
      onChange={onChange}
      placeholder="Choose a chapter…"
      onCreate={handleCreate}
      accentColor={accentColor}
    />
  );
}
